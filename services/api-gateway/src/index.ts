import express, { Request, Response } from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import { v4 as uuidv4 } from 'uuid';
import { Telemetry } from './models/Telemetry';

const app = express();
app.use(cors());
app.use(express.json());

const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://omniverse:omni_pass@postgres:5432/omniverse_db'
});

const mongoUrl = process.env.MONGO_URL || 'mongodb://omniverse:omni_pass@mongo:27017/omniverse_telemetry?authSource=admin';
mongoose.connect(mongoUrl)
  .then(() => console.log('[API Gateway] Connected to MongoDB'))
  .catch((err) => console.error('[API Gateway] MongoDB Error:', err));

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://redis:6379'
});
redisClient.connect().then(() => console.log('[API Gateway] Connected to Redis'));

// Initialize Postgres table on boot
pgPool.query(`
  CREATE TABLE IF NOT EXISTS media_jobs (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    media_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'QUEUED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
`).catch((err) => console.error('[API Gateway] Postgres Init Error:', err));

// Enqueue Job
app.post('/api/jobs', async (req: Request, res: Response) => {
  try {
    const { title, mediaType } = req.body;
    const jobId = uuidv4();

    await pgPool.query(
      'INSERT INTO media_jobs (id, title, media_type, status) VALUES ($1, $2, $3, $4)',
      [jobId, title, mediaType, 'QUEUED']
    );

    const payload = JSON.stringify({ jobId, title, mediaType, createdAt: new Date().toISOString() });
    await redisClient.lPush('media_jobs', payload);

    return res.status(202).json({ jobId, status: 'QUEUED', title, mediaType });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Worker Completion Callback
app.post('/api/jobs/:id/complete', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { framesProcessed, detectedObjects, sentimentScore, rawData } = req.body;

    await pgPool.query(
      'UPDATE media_jobs SET status = $1, updated_at = NOW() WHERE id = $2',
      ['COMPLETED', id]
    );

    await Telemetry.create({
      jobId: id,
      framesProcessed,
      detectedObjects,
      sentimentScore,
      rawInferenceData: rawData
    });

    return res.status(200).json({ status: 'ACK' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// List All Jobs
app.get('/api/jobs', async (_req: Request, res: Response) => {
  try {
    const { rows } = await pgPool.query('SELECT * FROM media_jobs ORDER BY created_at DESC LIMIT 50');
    return res.json(rows);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`[API Gateway] Running on port ${PORT}`));