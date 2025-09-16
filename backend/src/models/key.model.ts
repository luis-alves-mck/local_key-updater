import mongoose, { Document, Schema } from 'mongoose';

export interface IKey extends Document {
  key_name: string;
  key_secrets_data: {
    api_base_url: string;
    api_version: string;
    api_key: string;
    api_type: string;
  };
  available_models: string[];
  is_work_with_embeddings: boolean;
  expires_at?: Date;
  createdAt: Date;
  updatedAt: Date;
  getMaskedValue(): string;
}

const keySchema = new Schema<IKey>({
  key_name: { type: String, required: true, unique: true },
  key_secrets_data: {
    api_base_url: { type: String, required: true },
    api_version: { type: String, required: true },
    api_key: { type: String, required: true },
    api_type: { type: String, required: true }
  },
  available_models: [{ type: String }],
  is_work_with_embeddings: { type: Boolean, default: false },
  expires_at: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  collection: 'open_ai_keys',
  versionKey: false
});

// Add method to mask the secret value
keySchema.methods.getMaskedValue = function(): string {
  const apiKey = this.key_secrets_data?.api_key;
  if (!apiKey || typeof apiKey !== 'string') {
    return 'N/A';
  }
  if (apiKey.length <= 5) {
    return apiKey;
  }
  return apiKey.substring(0, 5) + '*****';
};

// Update the updatedAt field before saving
keySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Key = mongoose.model<IKey>('Key', keySchema); 