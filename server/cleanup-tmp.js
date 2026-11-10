/* Removes all regression-test artifacts from the DB and restores seed stock baselines.
 * Run with the LOCAL mongo uri:  $env:MONGODB_URI='mongodb://127.0.0.1:27017/dairyospro'; node cleanup-tmp.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

const BASELINE = {
  'Fresh Cow Milk': 200,
  'Buffalo Milk': 150,
  'Fresh Paneer': 50,
  'Fresh Curd': 100,
  'Pure Butter': 30,
  'Desi Ghee': 40,
  'Fresh Buttermilk': 80,
  'Cheese Block': 25,
};

(async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dairyospro');
  const db = mongoose.connection.db;

  const regs = await db.collection('users').find({ email: /^reg\d+@x\.com$/i }).toArray();
  const ids = regs.map(u => u._id);
  console.log(`test users found: ${ids.length}`);

  if (ids.length) {
    const orders = await db.collection('orders').find({ user: { $in: ids } }).toArray();
    const orderIds = orders.map(o => o._id);
    const del = async (col, q) => { const r = await db.collection(col).deleteMany(q); console.log(`${col}: -${r.deletedCount}`); };

    await del('payments', { $or: [{ order: { $in: orderIds } }, { user: { $in: ids } }] });
    await del('orders', { user: { $in: ids } });
    await del('bills', { $or: [{ customer: { $in: ids } }, { user: { $in: ids } }] });
    await del('subscriptions', { user: { $in: ids } });
    await del('notifications', { user: { $in: ids } });
    await del('deliverylogs', { $or: [{ customer: { $in: ids } }, { user: { $in: ids } }] });
    await del('users', { _id: { $in: ids } });
  }

  // Restore stock baselines
  for (const [name, stock] of Object.entries(BASELINE)) {
    const r = await db.collection('products').updateMany({ name }, { $set: { stock } });
    if (r.matchedCount) console.log(`stock restored: ${name} -> ${stock}`);
  }

  await mongoose.disconnect();
  console.log('cleanup done ✓');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
