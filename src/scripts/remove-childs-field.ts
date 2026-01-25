// scripts/remove-childs-field.ts
// ⚠️ MUST BE FIRST - load env vars before any imports
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// NOW use require() instead of import for db-dependent modules
const dbConnect = require('@/lib/db').default;
const Article = require('@/models/Article').default;

async function removeChildsField() {
  await dbConnect();
  
  console.log('⚠️  WARNING: This will PERMANENTLY remove childs field');
  console.log('Press Ctrl+C within 5 seconds to cancel...');
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  const result = await Article.updateMany(
    {},
    { $unset: { childs: "" } } // Remove field from all documents
  );
  
  console.log(`Removed childs field from ${result.modifiedCount} documents`);
}

removeChildsField().catch(console.error);