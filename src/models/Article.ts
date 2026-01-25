import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IChildArticle {
  id: string; // ObjectId as string
  type: 'LINK' | 'PART';
}

export interface IArticleData {
  _id: string;
  title: string;

  // KLUCZOWA ZMIANA: Tags zamiast childs
  tags: string[]; // IDs of parent topics/categories

  art_no?: number;
  shortname?: string;
  name?: string;
  summary: string;
  description: string;
  write_list?: string[];
  read_list?: string[];
  childs: IChildArticle[];
}

export interface IArticle extends Document, Omit<IArticleData, '_id'> {
    _id: any;
}

const ArticleSchema: Schema = new Schema({
  art_no: { type: Number, default: 0 },
  shortname: { type: String, default: '' },
  name: { type: String, default: '' },
  title: { type: String, required: true },
  tags: { type: [String], default: [] }, // KLUCZOWA ZMIANA: Tags zamiast childs
  summary: { type: String, default: '' },
  description: { type: String, default: '' },
  write_list: { type: [String], default: [], required: false },
  read_list: { type: [String], default: ['all'], required: false },
  childs: {
    type: [
      {
        id: { type: String, required: true },
        type: { type: String, default: 'LINK' }, // Removed enum to support legacy data
      },
    ],
    default: [],
  },
}, { timestamps: true });

const Article: Model<IArticle> = mongoose.models.articles || mongoose.model<IArticle>('articles', ArticleSchema);

export default Article;