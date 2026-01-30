// scripts/migrate-parts.ts
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const dbConnect = require('@/lib/db').default;
const Article = require('@/models/Article').default;
const mongoose = require('mongoose');

async function migrateParts() {
  await dbConnect();
  
  console.log('Migrating PART children from childs to parts field...');
  
  const articles = await Article.find({});
  console.log(`Found ${articles.length} articles`);
  
  let migratedCount = 0;
  let emptyPartsCount = 0;
  
  for (const article of articles) {
    // Znajdź wszystkie PART-y w polu childs
    const partChildren = article.childs?.filter((c: any) => c.type === 'PART') || [];
    
    // Wyciągnij same ID (jako stringi)
    const partIds = partChildren.map((c: any) => c.id.toString());
    
    // Połącz z istniejącymi parts (jeśli jakieś są) i usuń duplikaty
    const existingParts = article.parts || [];
    const allParts = [...new Set([...existingParts, ...partIds])];
    
    // ⭐ ZMIANA: Zawsze ustawiaj pole parts (nawet puste)
    await Article.updateOne(
      { _id: article._id },
      { $set: { parts: allParts } }  // $set zawsze nadpisze pole
    );
    
    if (partChildren.length > 0) {
      console.log(`✅ Migrated ${partChildren.length} PART(s) for: ${article.title} → [${allParts.join(', ')}]`);
    migratedCount++;
    } else {
      console.log(`➖ Set empty parts for: ${article.title}`);
      emptyPartsCount++;
    }
  }
  
  console.log(`\n✅ Migration complete!`);
  console.log(`   Articles with PARTs migrated: ${migratedCount}`);
  console.log(`   Articles with empty parts: ${emptyPartsCount}`);
  console.log(`   Total processed: ${articles.length}`);
  
  // Weryfikacja
  const withParts = await Article.countDocuments({ parts: { $exists: true } });
  const withoutParts = await Article.countDocuments({ parts: { $exists: false } });
  console.log(`\n📊 Verification:`);
  console.log(`   Articles WITH parts field: ${withParts}`);
  console.log(`   Articles WITHOUT parts field: ${withoutParts}`);
  
  await mongoose.disconnect();
  process.exit(0);
}

migrateParts().catch(error => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
