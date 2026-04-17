/**
 * migrate.js
 * Runs once on server startup to bring the MongoDB collection
 * in line with the new email+password schema.
 *
 * Safe to run multiple times — all operations are idempotent.
 */
async function runMigrations(db) {
  try {
    const collection = db.collection('users');

    // ── 1. Drop old incompatible indexes ─────────────────────────────────
    // The old schema had phone as required + unique (NOT sparse).
    // New schema: phone is optional + sparse (or not indexed at all).
    // Mongoose will fail to sync if the old non-sparse index exists.
    const indexes = await collection.indexes();
    const indexNames = indexes.map(i => i.name);

    const toDrop = ['phone_1', 'firebaseUID_1'];
    for (const name of toDrop) {
      if (indexNames.includes(name)) {
        await collection.dropIndex(name);
        console.log(`  [MIGRATE] Dropped old index: ${name}`);
      }
    }

    // ── 2. Fix old user documents that have no email ──────────────────────
    // Old OTP users were stored with only a phone number.
    // Assign them a placeholder email so they don't block the
    // email unique index creation.
    const result = await collection.updateMany(
      { email: { $exists: false } },
      [
        {
          $set: {
            email: {
              $concat: [
                { $ifNull: ['$phone', 'user'] },
                '@legacy.dairyospro.local'
              ]
            }
          }
        }
      ]
    );
    if (result.modifiedCount > 0) {
      console.log(`  [MIGRATE] Assigned placeholder emails to ${result.modifiedCount} legacy user(s)`);
    }

    // ── 3. Ensure all legacy users have a password placeholder ───────────
    // (bcrypt hash of 'changeme' — they will need to re-register)
    const bcrypt = require('bcryptjs');
    const defaultHash = await bcrypt.hash('changeme123', 10);
    const pwResult = await collection.updateMany(
      { password: { $exists: false } },
      { $set: { password: defaultHash } }
    );
    if (pwResult.modifiedCount > 0) {
      console.log(`  [MIGRATE] Added default password to ${pwResult.modifiedCount} legacy user(s)`);
    }

    console.log('  [MIGRATE] Migration complete ✓');
  } catch (err) {
    // Never crash the server for migration issues — just log
    console.error('  [MIGRATE] Warning:', err.message);
  }
}

module.exports = runMigrations;
