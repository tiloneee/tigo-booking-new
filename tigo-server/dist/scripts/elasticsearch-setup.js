#!/usr/bin/env ts-node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupElasticsearch = setupElasticsearch;
const core_1 = require("@nestjs/core");
const app_module_1 = require("../app.module");
const index_management_service_1 = require("../modules/search/services/index-management.service");
const hotel_data_sync_service_1 = require("../modules/search/services/data-sync/hotel.data-sync.service");
const search_service_1 = require("../modules/search/services/search.service");
async function setupElasticsearch() {
    console.log('🔍 Setting up Elasticsearch for Hotels...');
    try {
        const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
        const indexManagementService = app.get(index_management_service_1.IndexManagementService);
        const hotelDataSyncService = app.get(hotel_data_sync_service_1.HotelDataSyncService);
        const searchService = app.get(search_service_1.SearchService);
        console.log('📡 Checking Elasticsearch connection...');
        const health = await searchService.healthCheck();
        console.log('✅ Elasticsearch Status:', health);
        if (health.status === 'unavailable') {
            console.error('❌ Elasticsearch is not available. Please ensure it\'s running.');
            process.exit(1);
        }
        console.log('🏗️ Creating Elasticsearch indices...');
        await indexManagementService.createAllIndices();
        console.log('✅ Indices created successfully!');
        console.log('🔄 Syncing existing hotels to Elasticsearch...');
        await hotelDataSyncService.bulkSyncAllHotels();
        console.log('✅ Hotels synced successfully!');
        console.log('🔍 Validating data consistency...');
        const validation = await hotelDataSyncService.validateDataConsistency();
        if (validation.consistent) {
            console.log('✅ Data is consistent between PostgreSQL and Elasticsearch');
        }
        else {
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
    }
    catch (error) {
        console.error('❌ Elasticsearch setup failed:', error);
        process.exit(1);
    }
}
if (require.main === module) {
    setupElasticsearch();
}
//# sourceMappingURL=elasticsearch-setup.js.map