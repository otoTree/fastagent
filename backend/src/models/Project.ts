import mongoose, { Document, Schema } from 'mongoose';
import { z } from 'zod';

// Zod validation schemas
export const CreateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  agentId: z.string().min(1, 'Agent ID is required'),
  isActive: z.boolean().default(true),
});

export const UpdateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  agentId: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

// TypeScript interface
export interface IProject extends Document {
  name: string;
  description?: string;
  agentId: mongoose.Types.ObjectId;
  triggers: mongoose.Types.ObjectId[];
  isActive: boolean;
  owner: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  addWebhookTrigger(triggerId: string): Promise<IProject>;
  removeWebhookTrigger(triggerId: string): Promise<IProject>;
  activate(): Promise<IProject>;
  deactivate(): Promise<IProject>;
}

// Mongoose schema
const projectSchema = new Schema<IProject>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    maxlength: 500,
    trim: true,
  },
  agentId: {
    type: Schema.Types.ObjectId,
    ref: 'Agent',
    required: true,
  },
  triggers: [{
    type: Schema.Types.ObjectId,
    ref: 'Trigger',
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
projectSchema.index({ owner: 1, createdAt: -1 });
projectSchema.index({ agentId: 1 });
projectSchema.index({ isActive: 1 });
projectSchema.index({ name: 'text', description: 'text' });

// Virtual for trigger count
projectSchema.virtual('triggerCount').get(function(this: IProject) {
  return this.triggers.length;
});

// Method to add trigger
projectSchema.methods.addWebhookTrigger = function(this: IProject, triggerId: string) {
  if (!this.triggers.includes(new mongoose.Types.ObjectId(triggerId))) {
    this.triggers.push(new mongoose.Types.ObjectId(triggerId));
  }
  return this.save();
};

// Method to remove trigger
projectSchema.methods.removeWebhookTrigger = function(this: IProject, triggerId: string) {
  this.triggers = this.triggers.filter(
    (id: mongoose.Types.ObjectId) => !id.equals(new mongoose.Types.ObjectId(triggerId))
  );
  return this.save();
};

// Method to activate project
projectSchema.methods.activate = function(this: IProject) {
  this.isActive = true;
  return this.save();
};

// Method to deactivate project
projectSchema.methods.deactivate = function(this: IProject) {
  this.isActive = false;
  return this.save();
};

export const Project = mongoose.model<IProject>('Project', projectSchema);