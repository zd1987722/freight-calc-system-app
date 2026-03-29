import fs from 'fs';
import path from 'path';

const dir = path.resolve('./server/trpc/routers');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Fix finds: db.query.xxx.findMany / findFirst -> await db.query.xxx.findMany / findFirst
  content = content.replace(/(?<!await\s)(db\.query\.\w+\.find(?:Many|First))/g, 'await $1');

  // Fix inserts with returning().get() -> (await db.insert(...).returning())[0]
  content = content.replace(/db\.insert\((.*?)\)\.values\((.*?)\)\.returning\(\)\.get\(\)/g, '(await db.insert($1).values($2).returning())[0]');

  // Fix plain db.insert...run() -> await db.insert...
  content = content.replace(/db\.insert\((.*?)\)\.values\(([\s\S]*?)\)\.run\(\)/g, 'await db.insert($1).values($2)');

  // Fix plain db.update...run() -> await db.update...
  content = content.replace(/db\.update\((.*?)\)([\s\S]*?)\.run\(\)/g, 'await db.update($1)$2');
  
  // Fix plain db.delete...run() -> await db.delete...
  content = content.replace(/db\.delete\((.*?)\)([\s\S]*?)\.run\(\)/g, 'await db.delete($1)$2');
  
  // If there are any remaining db.insert/update without await (that don't end in run()), we might catch them, but they were mostly with run().
  // Let's also do a general sweep for any db.insert/update/delete that wasn't awaited:
  content = content.replace(/(?<!await\s)(db\.(?:insert|update|delete)\()/g, 'await $1');

  fs.writeFileSync(filePath, content, 'utf-8');
}
console.log('Fixed DB async calls in routers.');
