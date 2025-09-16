import mongoose, { Document, Schema } from 'mongoose';

export interface IOpenAIKey {
  key_name: string;
  model_name?: string;
  key_priority: number;
}

export interface IUseCase extends Document {
  use_case_name: string;
  openai_keys: IOpenAIKey[];
  createdAt: Date;
  updatedAt: Date;
}

const useCaseSchema = new Schema<IUseCase>({
  use_case_name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  openai_keys: [{
    key_name: {
      type: String,
      required: true,
      trim: true
    },
    model_name: {
      type: String,
      required: false,
      trim: true
    },
    key_priority: {
      type: Number,
      required: true,
      min: 1
    },
    _id: false
  }]
}, {
  timestamps: true,
  collection: 'open_ai_keys_config'
});

export const UseCase = mongoose.model<IUseCase>('UseCase', useCaseSchema); 