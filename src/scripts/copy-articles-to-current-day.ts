// scripts/copy-articles-to-current-day.ts
// ⚠️ MUST BE FIRST - load env vars before any imports
import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// NOW use require() instead of import for db-dependent modules
const dbConnect = require('@/lib/db').default;
const Article = require('@/models/Article').default;

async function copyArticlesToCurrentDay() {
  await dbConnect();
  
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const collectionName = `articles_${year}_${month}_${day}`;
  
  console.log(`Starting backup of articles to collection: ${collectionName}`);
  
  try {
    const articles = await Article.find({}).lean();
    console.log(`Found ${articles.length} articles to copy`);

    if (articles.length === 0) {
      console.log('No articles found. Nothing to copy.');
      return;
    }

    const db = mongoose.connection.db;
    if (!db) {
        throw new Error('Database connection not established');
    }

    const targetCollection = db.collection(collectionName);
    
    // Check if collection already exists and has data to avoid accidental overwrites/duplicates
    const existingCount = await targetCollection.countDocuments();
    if (existingCount > 0) {
      console.warn(`⚠️ Collection ${collectionName} already exists and contains ${existingCount} documents.`);
      console.log('Aborting to prevent duplicates.');
      return;
    }

    await targetCollection.insertMany(articles);
    console.log(`Successfully copied ${articles.length} articles to ${collectionName}`);
    
  } catch (error) {
    console.error('Error during backup:', error);
  } finally {
    await mongoose.disconnect();
  }
}

copyArticlesToCurrentDay().catch(console.error);
