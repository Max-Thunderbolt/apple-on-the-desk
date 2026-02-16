/**
 * One-time script: add userId to every document in Class, ShopItem, and PointCategory.
 * Run from API folder: node scripts/add-user-id-to-records.js
 *
 * Requires MONGODB_URI in .env (or environment).
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { connectDB, getDB, closeDB } = require('../config/database');

const USER_ID = 'cuZX5ktjR6O2geXKpR23LZR6Y2T2';

async function run() {
  await connectDB();
  const db = getDB();

  const collections = [
    { name: 'Class', label: 'Class' },
    { name: 'ShopItem', label: 'ShopItem' },
    { name: 'PointCategory', label: 'PointCategory' }
  ];

  for (const { name, label } of collections) {
    const col = db.collection(name);
    const result = await col.updateMany(
      {},
      { $set: { userId: USER_ID } }
    );
    console.log(`${label}: matched ${result.matchedCount}, modified ${result.modifiedCount}`);
  }

  await closeDB();
  console.log('Done.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
