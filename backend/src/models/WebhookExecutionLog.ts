import mongoose, { Document, Schema } from 'mongoose';

// TypeScript interface
export interface IWebhookExecutionLog extends Document {
  triggerId: mongoose.Types.ObjectId;
  agentId: mongoose.Types.ObjectId;
  requestData: any;
  responseData: any;
  statusCode: number;
  executionTime: number;
  success: boolean;
  errorMessage?: string;
  createdAt: Date;
}

// Mongoose schema
const webhookExecutionLogSchema = new Schema<IWebhookExecutionLog>({
  triggerId: {
    type: Schema.Types.ObjectId,
    ref: 'WebhookTrigger',
    required: true,
  },
  agentId: {
    type: Schema.Types.ObjectId,
    ref: 'Agent',
    required: true,
  },
  requestData: {
    type: Schema.Types.Mixed,
    required: true,
  },
  responseData: {
    type: Schema.Types.Mixed,
  },
  statusCode: {
    type: Number,
    required: true,
  },
  executionTime: {
    type: Number,
    required: true,
  },
  success: {
    type: Boolean,
    required: true,
  },
  errorMessage: {
    type: String,
  },
}, {
  timestamps: { createdAt: true, updatedAt: false },
});

// Indexes for better query performance
webhookExecutionLogSchema.index({ triggerId: 1, createdAt: -1 });
webhookExecutionLogSchema.index({ agentId: 1, createdAt: -1 });
webhookExecutionLogSchema.index({ success: 1, createdAt: -1 });
webhookExecutionLogSchema.index({ createdAt: -1 });

// TTL index to automatically delete logs after 30 days
webhookExecutionLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export const WebhookExecutionLog = mongoose.model<IWebhookExecutionLog>('WebhookExecutionLog', webhookExecutionLogSchema);