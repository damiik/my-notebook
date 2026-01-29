// scripts/clear-all-tags.ts
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const dbConnect = require('@/lib/db').default;
const Article = require('@/models/Article').default;
const mongoose = require('mongoose');

async function clearAllTags() {
  await dbConnect();
  
  const count = await Article.countDocuments({ tags: { $exists: true, $ne: [] } });
  
  console.log('⚠️  WARNING: This will clear ALL tags from ALL articles');
  console.log(`Found ${count} articles with non-empty tags`);
  console.log('Press Ctrl+C within 5 seconds to cancel...');
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  const result = await Article.updateMany(
    {},
    { $set: { tags: [] } }  // Ustawia pustą listę zamiast usuwania pola
  );
  
  console.log(`✅ Cleared tags from ${result.modifiedCount} articles`);
  console.log(`   Matched: ${result.matchedCount} documents`);
  
  await mongoose.disconnect();
  process.exit(0);
}

clearAllTags().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});