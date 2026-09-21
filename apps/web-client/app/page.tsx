'use client';
import { useState } from 'react';

export default function Home() {
  const [jobTitle, setJobTitle] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const triggerJob = async () => {
    if (!jobTitle) return;
    setIsLoading(true);
    setLogs((prev) => [...prev, `[Client] Dispatching job: "${jobTitle}" to API Gateway...`]);

    try {
      // Direct call to Express API Gateway
      const res = await fetch('http://localhost:5000/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: jobTitle, mediaType: 'video/mp4' }),
      });
      const data = await res.json();
      setLogs((prev) => [
        ...prev,
        `[Gateway Response 202] Enqueued Job ID: ${data.job?.jobId}`,
        `[Redis Queue] Broadcast to C# .NET Worker for multi-threaded processing.`
      ]);
      setJobTitle('');
    } catch (err) {
      setLogs((prev) => [...prev, `[Error] Failed to connect to Gateway (port 5000): ${String(err)}`]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="max-w-4xl mx-auto py-12 px-6">
      <div className="border border-cyan-500/20 bg-slate-900/60 p-8 rounded-2xl shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">
              Project Omniverse Hub
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Distributed Polyglot Microservices (Next.js • Node.js • .NET 8 • Python AI • Docker)
            </p>
          </div>
          <span className="px-3 py-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
            ● Cluster Healthy
          </span>
        </div>

        {/* Skill Badges */}
        <div className="flex flex-wrap gap-2 my-6">
          {['React', 'Next.js', 'Tailwind', 'TypeScript', 'Node.js', 'Express', '.NET 8', 'Python AI', 'Redis', 'PostgreSQL', 'Docker'].map((tech) => (
            <span key={tech} className="px-2.5 py-1 text-xs font-medium rounded-md bg-slate-800 text-cyan-300 border border-slate-700">
              {tech}
            </span>
          ))}
        </div>

        {/* Action Panel */}
        <div className="bg-slate-800/40 p-6 rounded-xl border border-slate-700/60 mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">Media File Name / Job Spec</label>
          <div className="flex gap-4">
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. 4K_Keynote_Speech_Raw.mp4"
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <button
              onClick={triggerJob}
              disabled={isLoading || !jobTitle}
              className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold px-6 py-2.5 rounded-lg transition-all"
            >
              {isLoading ? 'Dispatching...' : 'Dispatch Job'}
            </button>
          </div>
        </div>

        {/* Real-time Distributed Event Log */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">Distributed Event Stream</h3>
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 font-mono text-xs text-emerald-400 h-56 overflow-y-auto space-y-1">
            <p className="text-slate-500">&gt; Cluster initialized. Ready to accept media ingest pipeline commands...</p>
            {logs.map((log, idx) => (
              <p key={idx} className="text-cyan-300">&gt; {log}</p>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
