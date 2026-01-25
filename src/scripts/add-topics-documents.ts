// scripts/add-topics-documents.ts
// ⚠️ MUST BE FIRST - load env vars before any imports
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// NOW use require() instead of import for db-dependent modules
const dbConnect = require('@/lib/db').default;
const Article = require('@/models/Article').default;
const Topic = require('@/models/Topic').default;

async function addTopicsDocuments() {
  await dbConnect();
  
  console.log('Extracting topics from articles summary...');
  
  const articles = await Article.find({});
  console.log(`Found ${articles.length} articles`);
  
  // Step 1: Extract all unique topics from article structure
  const topicMap = new Map<string, Set<string>>(); // slug → parent slugs
  
  articles.forEach((article: any) => {
    // Parse summary for #tags
    const summaryTags = (article.summary?.match(/#[\w-]+/g) || [])
      .map((tag: string) => tag.slice(1)); // Remove #
    
    summaryTags.forEach((slug: string) => {
      if (!topicMap.has(slug)) {
        topicMap.set(slug, new Set());
      }
    });
  });
  
  console.log(`Identified ${topicMap.size} unique topics`);
  
  // Step 2: Create Topic documents
  const topicCreations = Array.from(topicMap.entries()).map(([slug, parents]) => ({
    name: slug.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' '), // "functional-programming" → "Functional Programming"
    slug,
    parent_tags: Array.from(parents),
    description: ''
  }));

  if (topicCreations.length === 0) {
    console.log('No topics to create.');
    return;
  }
  
  // Optional: Check which already exist to avoid duplicates if Topic.slug is unique
  const existingTopics = await Topic.find({ slug: { $in: topicCreations.map(t => t.slug) } });
  const existingSlugs = new Set(existingTopics.map((t: any) => t.slug));
  
  const toCreate = topicCreations.filter(t => !existingSlugs.has(t.slug));
  
  if (toCreate.length === 0) {
    console.log('All identified topics already exist in the database.');
  } else {
    const createdTopics = await Topic.insertMany(toCreate);
    console.log(`Created ${createdTopics.length} new topics`);
  }
  
  console.log('Done!');
}

addTopicsDocuments().catch(console.error);
