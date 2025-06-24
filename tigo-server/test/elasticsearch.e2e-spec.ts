import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { SearchService } from '../src/modules/search/services/search.service';
import { IndexManagementService } from '../src/modules/search/services/index-management.service';
import { HotelSearchService } from '../src/modules/search/services/hotel-search.service';
import { DataSyncService } from '../src/modules/search/services/data-sync.service';

describe('Elasticsearch Integration (e2e)', () => {
  let app: INestApplication;
  let searchService: SearchService;
  let indexManagementService: IndexManagementService;
  let hotelSearchService: HotelSearchService;
  let dataSyncService: DataSyncService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    searchService = moduleFixture.get<SearchService>(SearchService);
    indexManagementService = moduleFixture.get<IndexManagementService>(IndexManagementService);
    hotelSearchService = moduleFixture.get<HotelSearchService>(HotelSearchService);
    dataSyncService = moduleFixture.get<DataSyncService>(DataSyncService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Infrastructure Tests', () => {
    it('should connect to Elasticsearch cluster', async () => {
      const health = await searchService.healthCheck();
      expect(health.status).toBeDefined();
      expect(['green', 'yellow']).toContain(health.status);
    });

    it('should verify cluster info', async () => {
      const health = await searchService.healthCheck();
      expect(health.cluster_name).toBeDefined();
      expect(health.version).toBeDefined();
    });
  });

  describe('2. Index Management Tests', () => {
    beforeAll(async () => {
      // Clean up any existing indices
      try {
        await indexManagementService.deleteIndex('hotels');
        await indexManagementService.deleteIndex('rooms');
      } catch (error) {
        // Ignore if indices don't exist
      }
    });

    it('should create hotel index with correct mapping', async () => {
      await indexManagementService.createHotelIndex();
      const exists = await searchService.indexExists('hotels');
      expect(exists).toBe(true);
    });

    it('should create room index with correct mapping', async () => {
      await indexManagementService.createRoomIndex();
      const exists = await searchService.indexExists('rooms');
      expect(exists).toBe(true);
    });

    it('should create all indices at once', async () => {
      // Delete first
      await indexManagementService.deleteIndex('hotels');
      await indexManagementService.deleteIndex('rooms');

      await indexManagementService.createAllIndices();
      
      const hotelExists = await searchService.indexExists('hotels');
      const roomExists = await searchService.indexExists('rooms');
      
      expect(hotelExists).toBe(true);
      expect(roomExists).toBe(true);
    });

    it('should get index statistics', async () => {
      const stats = await indexManagementService.getIndexStats('hotels');
      expect(stats).toBeDefined();
      expect(stats.indices).toBeDefined();
    });
  });

  describe('3. Document Operations Tests', () => {
    const testHotel = {
      id: 'test-hotel-1',
      name: 'Test Grand Hotel',
      description: 'A beautiful test hotel in the heart of the city',
      location: {
        coordinates: { lat: 10.8231, lon: 106.6297 },
        address: '123 Test Street',
        city: 'Ho Chi Minh City',
        state: 'Ho Chi Minh',
        country: 'Vietnam',
      },
      amenities: [
        { id: 'amenity-1', name: 'WiFi', category: 'connectivity' },
        { id: 'amenity-2', name: 'Pool', category: 'recreation' },
      ],
      pricing: {
        min_price: 50,
        max_price: 200,
        currency: 'USD',
      },
      ratings: {
        average: 4.5,
        count: 100,
      },
      is_active: true,
    };

    it('should index a document', async () => {
      await searchService.indexDocument('hotels', testHotel, testHotel.id);
      
      // Wait for indexing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const result = await searchService.search({
        index: searchService.getIndexName('hotels'),
        body: {
          query: { term: { id: testHotel.id } },
        },
      });
      
      expect(result.hits.total.value).toBe(1);
      expect(result.hits.hits[0]._source.name).toBe(testHotel.name);
    });

    it('should update a document', async () => {
      const updates = {
        name: 'Updated Test Grand Hotel',
        'ratings.average': 4.8,
      };
      
      await searchService.updateDocument('hotels', testHotel.id, updates);
      
      // Wait for update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const result = await searchService.search({
        index: searchService.getIndexName('hotels'),
        body: {
          query: { term: { id: testHotel.id } },
        },
      });
      
      expect(result.hits.hits[0]._source.name).toBe('Updated Test Grand Hotel');
    });

    it('should delete a document', async () => {
      await searchService.deleteDocument('hotels', testHotel.id);
      
      // Wait for deletion
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const result = await searchService.search({
        index: searchService.getIndexName('hotels'),
        body: {
          query: { term: { id: testHotel.id } },
        },
      });
      
      expect(result.hits.total.value).toBe(0);
    });

    it('should perform bulk operations', async () => {
      const hotels = [
        { ...testHotel, id: 'bulk-hotel-1', name: 'Bulk Hotel 1' },
        { ...testHotel, id: 'bulk-hotel-2', name: 'Bulk Hotel 2' },
        { ...testHotel, id: 'bulk-hotel-3', name: 'Bulk Hotel 3' },
      ];

      const operations: any[] = [];
      hotels.forEach(hotel => {
        operations.push(
          { index: { _index: searchService.getIndexName('hotels'), _id: hotel.id } },
          hotel
        );
      });

      await searchService.bulk(operations);
      
      // Wait for indexing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const result = await searchService.search({
        index: searchService.getIndexName('hotels'),
        body: {
          query: { terms: { id: ['bulk-hotel-1', 'bulk-hotel-2', 'bulk-hotel-3'] } },
        },
      });
      
      expect(result.hits.total.value).toBe(3);
    });
  });

  describe('4. Hotel Search Tests', () => {
    beforeAll(async () => {
      // Index test data
      const testHotels = [
        {
          id: 'search-hotel-1',
          name: 'Luxury Beach Resort',
          description: 'A beautiful beachfront resort with amazing views',
          location: {
            coordinates: { lat: 10.8231, lon: 106.6297 },
            city: 'Ho Chi Minh City',
            country: 'Vietnam',
          },
          amenities: [
            { id: 'wifi', name: 'WiFi', category: 'connectivity' },
            { id: 'pool', name: 'Swimming Pool', category: 'recreation' },
          ],
          pricing: { min_price: 100, max_price: 300, currency: 'USD' },
          ratings: { average: 4.5, count: 150 },
          is_active: true,
        },
        {
          id: 'search-hotel-2',
          name: 'Budget City Hotel',
          description: 'Affordable accommodation in the city center',
          location: {
            coordinates: { lat: 10.8331, lon: 106.6397 },
            city: 'Ho Chi Minh City',
            country: 'Vietnam',
          },
          amenities: [
            { id: 'wifi', name: 'WiFi', category: 'connectivity' },
          ],
          pricing: { min_price: 30, max_price: 80, currency: 'USD' },
          ratings: { average: 3.8, count: 75 },
          is_active: true,
        },
      ];

      const operations: any[] = [];
      testHotels.forEach(hotel => {
        operations.push(
          { index: { _index: searchService.getIndexName('hotels'), _id: hotel.id } },
          hotel
        );
      });

      await searchService.bulk(operations);
      await new Promise(resolve => setTimeout(resolve, 2000));
    });

    it('should search hotels by text query', async () => {
      const result = await hotelSearchService.searchHotels({
        query: 'luxury beach',
        limit: 10,
      });

      expect(result.hotels.length).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThan(0);
      expect(result.hotels[0].name).toContain('Luxury');
    });

    it('should search hotels by location', async () => {
      const result = await hotelSearchService.searchHotels({
        city: 'Ho Chi Minh City',
        limit: 10,
      });

      // Filter results to only include the test hotels we expect
      const testHotels = result.hotels.filter(hotel => 
        hotel.id === 'search-hotel-1' || hotel.id === 'search-hotel-2'
      );

      expect(testHotels.length).toBe(2);
      expect(result.total).toBeGreaterThanOrEqual(2); // Should be at least 2
    });

    it('should search hotels by geo-distance', async () => {
      const result = await hotelSearchService.searchHotels({
        latitude: 10.8231,
        longitude: 106.6297,
        radius_km: 5,
        limit: 10,
      });

      expect(result.hotels.length).toBeGreaterThan(0);
    });

    it('should filter hotels by price range', async () => {
      const result = await hotelSearchService.searchHotels({
        min_price: 80,
        max_price: 200,
        limit: 10,
      });

      expect(result.hotels.length).toBeGreaterThan(0);
      result.hotels.forEach(hotel => {
        expect(hotel.pricing.min_price).toBeGreaterThanOrEqual(80);
      });
    });

    it('should filter hotels by rating', async () => {
      const result = await hotelSearchService.searchHotels({
        min_rating: 4.0,
        limit: 10,
      });

      expect(result.hotels.length).toBeGreaterThan(0);
      result.hotels.forEach(hotel => {
        expect(hotel.ratings.average).toBeGreaterThanOrEqual(4.0);
      });
    });

    it('should sort hotels by price', async () => {
      const result = await hotelSearchService.searchHotels({
        sort_by: 'price',
        sort_order: 'ASC',
        limit: 10,
      });

      expect(result.hotels.length).toBeGreaterThan(1);
      const prices = result.hotels.map(h => h.pricing.min_price);
      const sortedPrices = [...prices].sort((a, b) => a - b);
      expect(prices).toEqual(sortedPrices);
    });

    it('should sort hotels by rating', async () => {
      const result = await hotelSearchService.searchHotels({
        sort_by: 'rating',
        sort_order: 'DESC',
        limit: 10,
      });

      expect(result.hotels.length).toBeGreaterThan(1);
      const ratings = result.hotels.map(h => h.ratings.average);
      const sortedRatings = [...ratings].sort((a, b) => b - a);
      expect(ratings).toEqual(sortedRatings);
    });

    it('should provide pagination', async () => {
      const page1 = await hotelSearchService.searchHotels({
        page: 1,
        limit: 1,
      });

      const page2 = await hotelSearchService.searchHotels({
        page: 2,
        limit: 1,
      });

      expect(page1.hotels.length).toBe(1);
      expect(page2.hotels.length).toBeGreaterThanOrEqual(0);
      expect(page1.page).toBe(1);
      expect(page2.page).toBe(2);
    });

    it('should return aggregations', async () => {
      const result = await hotelSearchService.searchHotels({
        limit: 10,
      });

      expect(result.aggregations).toBeDefined();
      expect(result.aggregations.price_ranges).toBeDefined();
      expect(result.aggregations.rating_distribution).toBeDefined();
    });
  });

  describe('5. Autocomplete Tests', () => {
    it('should provide hotel name suggestions', async () => {
      const result = await hotelSearchService.getAutocompleteSuggestions('luxury', 5);
      expect(result.suggestions).toBeDefined();
      expect(Array.isArray(result.suggestions)).toBe(true);
    });

    it('should provide city suggestions', async () => {
      const result = await hotelSearchService.getAutocompleteSuggestions('ho chi', 5);
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions.some(s => s.type === 'city')).toBe(true);
    });
  });

  describe('6. API Endpoint Tests', () => {
    it('should check health endpoint', () => {
      return request(app.getHttpServer())
        .get('/search/health')
        .expect(200)
        .expect(res => {
          expect(res.body.status).toBeDefined();
        });
    });

    it('should search hotels via API', () => {
      return request(app.getHttpServer())
        .get('/search/hotels?query=luxury&limit=5')
        .expect(200)
        .expect(res => {
          expect(res.body.hotels).toBeDefined();
          expect(res.body.total).toBeDefined();
          expect(Array.isArray(res.body.hotels)).toBe(true);
        });
    });

    it('should get autocomplete suggestions via API', () => {
      return request(app.getHttpServer())
        .get('/search/hotels/autocomplete?q=luxury&limit=5')
        .expect(200)
        .expect(res => {
          expect(res.body.suggestions).toBeDefined();
          expect(Array.isArray(res.body.suggestions)).toBe(true);
        });
    });

    it('should handle complex search queries', () => {
      return request(app.getHttpServer())
        .get('/search/hotels?city=Ho Chi Minh City&min_price=50&max_price=200&min_rating=4&sort_by=rating&sort_order=DESC')
        .expect(200)
        .expect(res => {
          expect(res.body.hotels).toBeDefined();
          expect(res.body.aggregations).toBeDefined();
        });
    });
  });

  describe('7. Data Consistency Tests', () => {
    it('should validate data consistency', async () => {
      const result = await dataSyncService.validateDataConsistency();
      expect(result.consistent).toBeDefined();
      expect(Array.isArray(result.issues)).toBe(true);
    });
  });

  describe('8. Error Handling Tests', () => {
    it('should handle invalid search queries gracefully', async () => {
      try {
        await hotelSearchService.searchHotels({
          min_price: -100, // Invalid price
          latitude: 200, // Invalid latitude
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle non-existent document updates', async () => {
      try {
        await searchService.updateDocument('hotels', 'non-existent-id', { name: 'Test' });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
}); 