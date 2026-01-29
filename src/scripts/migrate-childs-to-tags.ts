import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const dbConnect = require('@/lib/db').default;
const Article = require('@/models/Article').default;

async function migrateChildsToTags() {
  await dbConnect();
  
  console.log('Migrating childs relationships to tags...');
  
  // Znajdź wszystkie artykuły które są rodzicami (mają dzieci w polu childs)
  const parents = await Article.find({ 'childs.0': { $exists: true } });
  console.log(`Found ${parents.length} parent articles with children`);
  
  let updatedCount = 0;
  let skippedCount = 0;
  
  for (const parent of parents) {
    // KLUCZOWE: ID rodzica jako string (to będzie wartość w tags dziecka)
    const parentId = parent._id.toString();
    
    // Dla każdego dziecka w liście childs rodzica
    for (const childRef of parent.childs) {
      const childId = childRef.id;
      
      if (!childId) {
        console.warn(`⚠️  Empty child reference in article: ${parent.title}`);
        continue;
      }
      
      try {
        // Sprawdź czy dziecko istnieje
        const childArticle = await Article.findById(childId);
        
        if (!childArticle) {
          console.warn(`⚠️  Child article not found: ${childId} (referenced by ${parent.title})`);
          continue;
        }
        
        // Sprawdź czy tag już istnieje (zabezpieczenie przed duplikatami)
        const currentTags = childArticle.tags || [];
        
        if (!currentTags.includes(parentId)) {
          console.log(`➕ Adding parent "${parent.title}" (${parentId}) to child "${childArticle.title}"`);
          
          // Dodaj ID rodzica do tags dziecka
          await Article.updateOne(
            { _id: childId },
            { $addToSet: { tags: parentId } }  // $addToSet zapobiega duplikatom
          );
          
          updatedCount++;
        } else {
          skippedCount++;
        }
        
      } catch (error) {
        console.error(`❌ Error processing child ${childId}:`, error.message);
      }
    }
  }
  
  console.log(`\n✅ Migration complete!`);
  console.log(`   Updated: ${updatedCount} articles`);
  console.log(`   Skipped (already had tag): ${skippedCount} articles`);
  
  process.exit(0);
}

migrateChildsToTags().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});