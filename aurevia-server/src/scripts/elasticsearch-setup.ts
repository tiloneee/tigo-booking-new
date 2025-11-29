#!/usr/bin/env ts-node
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { IndexManagementService } from '../modules/search/services/index-management.service';
import { HotelDataSyncService } from '../modules/search/services/data-sync/hotel.data-sync.service';
import { SearchService } from '../modules/search/services/search.service';

async function setupElasticsearch() {
  console.log('🔍 Setting up Elasticsearch for Hotels...');
  
  try {
    const app = await NestFactory.createApplicationContext(AppModule);
    
    const indexManagementService = app.get(IndexManagementService);
    const hotelDataSyncService = app.get(HotelDataSyncService);
    const searchService = app.get(SearchService);

    // 1. Check Elasticsearch health
    console.log('📡 Checking Elasticsearch connection...');
    const health = await searchService.healthCheck();
    console.log('✅ Elasticsearch Status:', health);

    if (health.status === 'unavailable') {
      console.error('❌ Elasticsearch is not available. Please ensure it\'s running.');
      process.exit(1);
    }

    // 2. Create indices
    console.log('🏗️ Creating Elasticsearch indices...');
    await indexManagementService.createAllIndices();
    console.log('✅ Indices created successfully!');

    // 3. Bulk sync all existing hotels
    console.log('🔄 Syncing existing hotels to Elasticsearch...');
    await hotelDataSyncService.bulkSyncAllHotels();
    console.log('✅ Hotels synced successfully!');

    // 4. Validate data consistency
    console.log('🔍 Validating data consistency...');
    const validation = await hotelDataSyncService.validateDataConsistency();
    
    if (validation.consistent) {
      console.log('✅ Data is consistent between PostgreSQL and Elasticsearch');
    } else {
      console.log('⚠️ Data consistency issues found:');
      validation.issues.forEach(issue => console.log(`  - ${issue}`));
    }

    console.log('\n🎉 Elasticsearch setup completed successfully!');
    console.log('📝 You can now use the following endpoints:');
    console.log('  - GET /search/hotels - Advanced hotel search with Elasticsearch');
    console.log('  - GET /search/hotels/autocomplete - Autocomplete suggestions');
    console.log('  - GET /hotels/search - Public hotel search (now using Elasticsearch)');
    console.log('  - GET /search/health - Check Elasticsearch health');

    await app.close();
  } catch (error) {
    console.error('❌ Elasticsearch setup failed:', error);
    process.exit(1);
  }
}

// Run setup if called directly
if (require.main === module) {
  setupElasticsearch();
}

export { setupElasticsearch };
