require('dotenv').config();
const TranslationService = require('../src/services/translation.service');
const cache = require('../src/utils/cache');
const logger = require('../src/utils/logger');

async function test() {
  console.log('🧪 Starting Redis Cache Verification...');

  try {
    // 1. Clear cache first to start fresh
    console.log('🧹 Clearing existing translation cache...');
    await cache.delByPattern('translations:*');

    // 2. Measure time for first lookup (should be from DB)
    console.log('📡 First lookup (fetching from DB)...');
    const start1 = Date.now();
    await TranslationService.getTranslations('en');
    const end1 = Date.now();
    console.log(`⏱️ First lookup took: ${end1 - start1}ms`);

    // 3. Measure time for second lookup (should be from Redis)
    console.log('💨 Second lookup (fetching from Redis)...');
    const start2 = Date.now();
    await TranslationService.getTranslations('en');
    const end2 = Date.now();
    console.log(`⏱️ Second lookup took: ${end2 - start2}ms`);

    if (end2 - start2 < end1 - start1) {
      console.log('✅ Success: Redis cache is working and faster!');
    } else {
      console.warn('⚠️ Warning: Second lookup was not faster. Check Redis connection/logs.');
    }

    // 4. Test Invalidation
    console.log('🔄 Testing invalidation...');
    await cache.delByPattern('translations:*');
    const start3 = Date.now();
    await TranslationService.getTranslations('en');
    const end3 = Date.now();
    console.log(`⏱️ Lookup after invalidation took: ${end3 - start3}ms (should be higher again)`);
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    process.exit(0);
  }
}

test();
