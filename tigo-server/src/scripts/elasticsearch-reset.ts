#!/usr/bin/env ts-node
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { IndexManagementService } from '../modules/search/services/index-management.service';
import { HotelDataSyncService } from '../modules/search/services/data-sync/hotel.data-sync.service';
import { SearchService } from '../modules/search/services/search.service';

async function resetElasticsearch() {
  console.log('🔄 Resetting Elasticsearch for Hotels...');
  
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

    // 2. Delete existing indices
    console.log('🗑️ Deleting existing indices...');
    try {
      await indexManagementService.deleteIndex('hotels');
      console.log('✅ Hotels index deleted');
    } catch (error) {
      console.log('ℹ️ Hotels index did not exist or could not be deleted');
    }

    try {
      await indexManagementService.deleteIndex('rooms');
      console.log('✅ Rooms index deleted');
    } catch (error) {
      console.log('ℹ️ Rooms index did not exist or could not be deleted');
    }

    // 3. Recreate indices
    console.log('🏗️ Recreating Elasticsearch indices...');
    await indexManagementService.createAllIndices();
    console.log('✅ Indices recreated successfully!');

    // 4. Bulk sync all existing hotels
    console.log('🔄 Resyncing all hotels to Elasticsearch...');
    await hotelDataSyncService.bulkSyncAllHotels();
    console.log('✅ Hotels resynced successfully!');

    // 5. Validate data consistency
    console.log('🔍 Validating data consistency...');
    const validation = await hotelDataSyncService.validateDataConsistency();
    
    if (validation.consistent) {
      console.log('✅ Data is consistent between PostgreSQL and Elasticsearch');
    } else {
      console.log('⚠️ Data consistency issues found:');
      validation.issues.forEach(issue => console.log(`  - ${issue}`));
    }

    console.log('\n🎉 Elasticsearch reset completed successfully!');

    await app.close();
  } catch (error) {
    console.error('❌ Elasticsearch reset failed:', error);
    process.exit(1);
  }
}

// Run reset if called directly
if (require.main === module) {
  resetElasticsearch();
}

export { resetElasticsearch };
