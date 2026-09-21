import mongoose, { Schema, Document } from 'mongoose';

export interface ITelemetry extends Document {
  jobId: string;
  framesProcessed: number;
  detectedObjects: string[];
  sentimentScore: number;
  rawInferenceData: Record<string, any>;
  createdAt: Date;
}

const TelemetrySchema = new Schema<ITelemetry>({
  jobId: { type: String, required: true, index: true },
  framesProcessed: { type: Number, default: 0 },
  detectedObjects: [{ type: String }],
  sentimentScore: { type: Number, default: 0.0 },
  rawInferenceData: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
});

export const Telemetry = mongoose.model<ITelemetry>('Telemetry', TelemetrySchema);