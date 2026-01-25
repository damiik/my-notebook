// models/Topic.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITopicData {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  parent_tags: string[]; // IDs of parent topics
}

export interface ITopic extends Document, Omit<ITopicData, '_id'> {
  _id: any;
}

const TopicSchema: Schema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
  parent_tags: { type: [String], default: [] },
}, { timestamps: true });

const Topic: Model<ITopic> = 
  mongoose.models.topics || mongoose.model<ITopic>('topics', TopicSchema);

export default Topic;