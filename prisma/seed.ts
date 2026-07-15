import 'dotenv/config';

import { db } from '../lib/db';

/**
 * Database seed. Real seed data is added as models land (Phase 1+).
 */
async function main() {
  console.log('Seed: no data to seed yet.');
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
