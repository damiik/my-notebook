// scripts/migrate-to-tags.ts
// ⚠️ MUST BE FIRST - load env vars before any imports
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// NOW use require() instead of import for db-dependent modules
const dbConnect = require('@/lib/db').default;
const Article = require('@/models/Article').default;
const Topic = require('@/models/Topic').default;

async function migrateToTags() {
  await dbConnect();
  
  console.log('Starting migration: childs → tags');
  
  const articles = await Article.find({});
  console.log(`Found ${articles.length} articles`);
  
  // Step 1 & 2: Fetch existing topics
  const createdTopics = await Topic.find({});
  console.log(`Found ${createdTopics.length} topics in database`);
  
  // Step 3: Build slug → _id map
  const slugToId = new Map<string, string>();
  createdTopics.forEach((topic: any) => {
    slugToId.set(topic.slug, topic._id.toString());
  });
  
  // Step 4: Add tags field to articles (WITHOUT removing childs)
  let updatedCount = 0;
  
  for (const article of articles) {
    const summaryTags = (article.summary?.match(/#[\w-]+/g) || [])
      .map((tag: string) => tag.slice(1));
    
    const tagIds = summaryTags
      .map((slug: string) => slugToId.get(slug))
      .filter(Boolean) as string[];
    
    // CRITICAL: Use $set to ADD tags field, keeping childs intact
    await Article.updateOne(
      { _id: article._id },
      { 
        $set: { tags: tagIds },
        // Do NOT use $unset: { childs: 1 } yet
      }
    );
    
    updatedCount++;
    if (updatedCount % 100 === 0) {
      console.log(`Updated ${updatedCount}/${articles.length} articles`);
    }
  }
  
  console.log(`Migration complete! Updated ${updatedCount} articles.`);
  console.log('⚠️  childs field still exists - remove after verification');
}

migrateToTags().catch(console.error);