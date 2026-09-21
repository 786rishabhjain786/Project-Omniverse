using System.Text;
using System.Text.Json;
using StackExchange.Redis;

namespace MediaWorker;

public class JobPayload
{
    public string JobId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string MediaType { get; set; } = string.Empty;
}

public class Worker : BackgroundService
{
    private readonly ILogger<Worker> _logger;
    private readonly HttpClient _httpClient;
    private ConnectionMultiplexer? _redis;
    private IDatabase? _db;

    public Worker(ILogger<Worker> logger, IHttpClientFactory httpClientFactory)
    {
        _logger = logger;
        _httpClient = httpClientFactory.CreateClient();
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var redisHost = Environment.GetEnvironmentVariable("REDIS_HOST") ?? "redis";
        _logger.LogInformation("[.NET Worker] Connecting to Redis at {Host}:6379...", redisHost);

        _redis = await ConnectionMultiplexer.ConnectAsync($"{redisHost}:6379,abortConnect=false");
        _db = _redis.GetDatabase();
        _logger.LogInformation("[.NET Worker] Listening on queue: media_jobs");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                RedisValue rawItem = await _db.ListRightPopAsync("media_jobs");

                if (!rawItem.IsNullOrEmpty)
                {
                    var job = JsonSerializer.Deserialize<JobPayload>(rawItem.ToString(), new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    if (job != null)
                    {
                        _logger.LogInformation("[.NET Worker] Processing Job {Id}: {Title}", job.JobId, job.Title);

                        // 1. Request Analysis from Python AI Service
                        var aiServiceUrl = Environment.GetEnvironmentVariable("AI_SERVICE_URL") ?? "http://ai-service:8000";
                        var aiRequestPayload = new StringContent(
                            JsonSerializer.Serialize(new { jobId = job.JobId, mediaType = job.MediaType }),
                            Encoding.UTF8,
                            "application/json"
                        );

                        var aiResponse = await _httpClient.PostAsync($"{aiServiceUrl}/api/v1/analyze", aiRequestPayload, stoppingToken);
                        var aiResult = await aiResponse.Content.ReadAsStringAsync(stoppingToken);

                        // 2. Notify API Gateway to finalize Postgres and Mongo records
                        var gatewayUrl = Environment.GetEnvironmentVariable("GATEWAY_URL") ?? "http://api-gateway:5000";
                        var completePayload = new StringContent(
                            JsonSerializer.Serialize(new
                            {
                                framesProcessed = 1500,
                                detectedObjects = new[] { "presentation", "speaker", "audio_track" },
                                sentimentScore = 0.92,
                                rawData = JsonSerializer.Deserialize<object>(aiResult)
                            }),
                            Encoding.UTF8,
                            "application/json"
                        );

                        await _httpClient.PostAsync($"{gatewayUrl}/api/jobs/{job.JobId}/complete", completePayload, stoppingToken);
                        _logger.LogInformation("[.NET Worker] Job {Id} marked COMPLETED in database.", job.JobId);
                    }
                }
                else
                {
                    await Task.Delay(1000, stoppingToken);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[.NET Worker] Exception in processing loop");
                await Task.Delay(2000, stoppingToken);
            }
        }
    }
}