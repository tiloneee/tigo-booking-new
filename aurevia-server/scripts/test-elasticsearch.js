#!/usr/bin/env node

/**
 * Elasticsearch Testing Script
 * Run this script to manually test all Elasticsearch functionality
 * 
 * Usage: node scripts/test-elasticsearch.js
 */

const axios = require('axios');
const chalk = require('chalk');

const BASE_URL = 'http://localhost:3000';
const ES_URL = 'http://localhost:9200';

class ElasticsearchTester {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0,
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: chalk.blue,
      success: chalk.green,
      error: chalk.red,
      warning: chalk.yellow,
    };
    console.log(`[${timestamp}] ${colors[type](message)}`);
  }

  async test(name, testFn) {
    this.testResults.total++;
    try {
      this.log(`Testing: ${name}`, 'info');
      await testFn();
      this.testResults.passed++;
      this.log(`✓ ${name}`, 'success');
    } catch (error) {
      this.testResults.failed++;
      this.log(`✗ ${name}`, 'error');
      this.log(`  Error: ${error.message}`, 'error');
    }
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 1. Infrastructure Tests
  async testElasticsearchHealth() {
    const response = await axios.get(`${ES_URL}/_cluster/health`);
    if (!['green', 'yellow'].includes(response.data.status)) {
      throw new Error(`Cluster status is ${response.data.status}`);
    }
  }

  async testApplicationHealth() {
    const response = await axios.get(`${BASE_URL}/search/health`);
    if (!response.data.status) {
      throw new Error('Application health check failed');
    }
  }

  // 2. Index Management Tests
  async testCreateIndices() {
    // Delete existing indices first
    try {
      await axios.delete(`${BASE_URL}/search/admin/indices/hotels`);
      await axios.delete(`${BASE_URL}/search/admin/indices/rooms`);
    } catch (error) {
      // Ignore if indices don't exist
    }

    // Create indices
    const response = await axios.post(`${BASE_URL}/search/admin/indices/create`);
    if (!response.data.message.includes('successfully')) {
      throw new Error('Failed to create indices');
    }
  }

  async testIndexStats() {
    const response = await axios.get(`${BASE_URL}/search/admin/indices/hotels/stats`);
    if (!response.data.indices) {
      throw new Error('Index stats not returned properly');
    }
  }

  // 3. Document Operations Tests
  async testDocumentOperations() {
    const testHotel = {
      id: 'test-hotel-manual',
      name: 'Manual Test Hotel',
      description: 'A hotel for manual testing',
      location: {
        coordinates: { lat: 10.8231, lon: 106.6297 },
        city: 'Ho Chi Minh City',
        country: 'Vietnam'
      },
      pricing: { min_price: 100, max_price: 200, currency: 'USD' },
      ratings: { average: 4.5, count: 50 },
      is_active: true
    };

    // Index document directly via Elasticsearch
    await axios.put(`${ES_URL}/tigo_hotels/_doc/${testHotel.id}`, testHotel);
    
    // Wait for indexing
    await this.sleep(2000);
    
    // Verify document exists
    const response = await axios.get(`${ES_URL}/tigo_hotels/_doc/${testHotel.id}`);
    if (!response.data.found) {
      throw new Error('Document was not indexed');
    }
    
    if (response.data._source.name !== testHotel.name) {
      throw new Error('Document content mismatch');
    }
  }

  // 4. Search Functionality Tests
  async testBasicSearch() {
    const response = await axios.get(`${BASE_URL}/search/hotels?query=manual&limit=5`);
    
    if (!response.data.hotels || !Array.isArray(response.data.hotels)) {
      throw new Error('Search response format incorrect');
    }
    
    if (typeof response.data.total !== 'number') {
      throw new Error('Search total count missing');
    }
  }

  async testLocationSearch() {
    const response = await axios.get(`${BASE_URL}/search/hotels?city=Ho Chi Minh City&limit=5`);
    
    if (!response.data.hotels || !Array.isArray(response.data.hotels)) {
      throw new Error('Location search failed');
    }
  }

  async testGeoSearch() {
    const response = await axios.get(
      `${BASE_URL}/search/hotels?latitude=10.8231&longitude=106.6297&radius_km=10&limit=5`
    );
    
    if (!response.data.hotels || !Array.isArray(response.data.hotels)) {
      throw new Error('Geo search failed');
    }
  }

  async testPriceFilter() {
    const response = await axios.get(`${BASE_URL}/search/hotels?min_price=50&max_price=150&limit=5`);
    
    if (!response.data.hotels || !Array.isArray(response.data.hotels)) {
      throw new Error('Price filter search failed');
    }
  }

  async testRatingFilter() {
    const response = await axios.get(`${BASE_URL}/search/hotels?min_rating=4&limit=5`);
    
    if (!response.data.hotels || !Array.isArray(response.data.hotels)) {
      throw new Error('Rating filter search failed');
    }
  }

  async testSorting() {
    const priceSort = await axios.get(`${BASE_URL}/search/hotels?sort_by=price&sort_order=ASC&limit=5`);
    const ratingSort = await axios.get(`${BASE_URL}/search/hotels?sort_by=rating&sort_order=DESC&limit=5`);
    
    if (!priceSort.data.hotels || !ratingSort.data.hotels) {
      throw new Error('Sorting failed');
    }
  }

  async testPagination() {
    const page1 = await axios.get(`${BASE_URL}/search/hotels?page=1&limit=2`);
    const page2 = await axios.get(`${BASE_URL}/search/hotels?page=2&limit=2`);
    
    if (page1.data.page !== 1 || page2.data.page !== 2) {
      throw new Error('Pagination metadata incorrect');
    }
  }

  async testAggregations() {
    const response = await axios.get(`${BASE_URL}/search/hotels?limit=5`);
    
    if (!response.data.aggregations) {
      throw new Error('Aggregations not returned');
    }
    
    if (!response.data.aggregations.price_ranges || !response.data.aggregations.rating_distribution) {
      throw new Error('Required aggregations missing');
    }
  }

  // 5. Autocomplete Tests
  async testAutocomplete() {
    const response = await axios.get(`${BASE_URL}/search/hotels/autocomplete?q=manual&limit=5`);
    
    if (!response.data.suggestions || !Array.isArray(response.data.suggestions)) {
      throw new Error('Autocomplete failed');
    }
  }

  // 6. Complex Query Tests
  async testComplexQuery() {
    const queryParams = [
      'query=hotel',
      'city=Ho Chi Minh City',
      'min_price=50',
      'max_price=300',
      'min_rating=3',
      'sort_by=rating',
      'sort_order=DESC',
      'page=1',
      'limit=5'
    ].join('&');
    
    const response = await axios.get(`${BASE_URL}/search/hotels?${queryParams}`);
    
    if (!response.data.hotels || !response.data.aggregations) {
      throw new Error('Complex query failed');
    }
  }

  // 7. Performance Tests
  async testSearchPerformance() {
    const start = Date.now();
    await axios.get(`${BASE_URL}/search/hotels?query=test&limit=20`);
    const duration = Date.now() - start;
    
    if (duration > 1000) { // 1 second threshold
      throw new Error(`Search too slow: ${duration}ms`);
    }
    
    this.log(`Search performance: ${duration}ms`, 'info');
  }

  // 8. Error Handling Tests
  async testErrorHandling() {
    try {
      // Test invalid parameters
      await axios.get(`${BASE_URL}/search/hotels?min_price=-100`);
      throw new Error('Should have thrown an error for invalid price');
    } catch (error) {
      if (error.message.includes('Should have thrown')) {
        throw error;
      }
      // Expected error - validation should catch this
    }
  }

  // 9. Data Consistency Tests
  async testDataConsistency() {
    // Get hotel count from PostgreSQL via API
    const pgCount = await axios.get(`${BASE_URL}/hotels`);
    
    // Get hotel count from Elasticsearch
    const esCount = await axios.get(`${ES_URL}/tigo_hotels/_count`);
    
    this.log(`PostgreSQL hotels: ${pgCount.data.length}`, 'info');
    this.log(`Elasticsearch hotels: ${esCount.data.count}`, 'info');
    
    // Allow some difference due to timing/sync issues
    const difference = Math.abs(pgCount.data.length - esCount.data.count);
    if (difference > 5) {
      throw new Error(`Data inconsistency: PG=${pgCount.data.length}, ES=${esCount.data.count}`);
    }
  }

  // Run all tests
  async runAllTests() {
    this.log('🚀 Starting Elasticsearch Test Suite', 'info');
    this.log('=====================================', 'info');

    // Infrastructure Tests
    this.log('\n📡 Infrastructure Tests', 'info');
    await this.test('Elasticsearch Cluster Health', () => this.testElasticsearchHealth());
    await this.test('Application Health Check', () => this.testApplicationHealth());

    // Index Management Tests
    this.log('\n🗂️  Index Management Tests', 'info');
    await this.test('Create Search Indices', () => this.testCreateIndices());
    await this.test('Get Index Statistics', () => this.testIndexStats());

    // Document Operations Tests
    this.log('\n📄 Document Operations Tests', 'info');
    await this.test('Index and Retrieve Document', () => this.testDocumentOperations());

    // Search Functionality Tests
    this.log('\n🔍 Search Functionality Tests', 'info');
    await this.test('Basic Text Search', () => this.testBasicSearch());
    await this.test('Location-based Search', () => this.testLocationSearch());
    await this.test('Geo-spatial Search', () => this.testGeoSearch());
    await this.test('Price Range Filter', () => this.testPriceFilter());
    await this.test('Rating Filter', () => this.testRatingFilter());
    await this.test('Result Sorting', () => this.testSorting());
    await this.test('Pagination', () => this.testPagination());
    await this.test('Search Aggregations', () => this.testAggregations());

    // Autocomplete Tests
    this.log('\n💡 Autocomplete Tests', 'info');
    await this.test('Autocomplete Suggestions', () => this.testAutocomplete());

    // Complex Query Tests
    this.log('\n🔧 Complex Query Tests', 'info');
    await this.test('Multi-parameter Search', () => this.testComplexQuery());

    // Performance Tests
    this.log('\n⚡ Performance Tests', 'info');
    await this.test('Search Response Time', () => this.testSearchPerformance());

    // Error Handling Tests
    this.log('\n🛡️  Error Handling Tests', 'info');
    await this.test('Invalid Parameter Handling', () => this.testErrorHandling());

    // Data Consistency Tests
    this.log('\n🔄 Data Consistency Tests', 'info');
    await this.test('PostgreSQL-Elasticsearch Sync', () => this.testDataConsistency());

    // Summary
    this.printSummary();
  }

  printSummary() {
    this.log('\n📊 Test Results Summary', 'info');
    this.log('========================', 'info');
    this.log(`Total Tests: ${this.testResults.total}`, 'info');
    this.log(`Passed: ${this.testResults.passed}`, 'success');
    this.log(`Failed: ${this.testResults.failed}`, this.testResults.failed > 0 ? 'error' : 'info');
    
    const successRate = ((this.testResults.passed / this.testResults.total) * 100).toFixed(1);
    this.log(`Success Rate: ${successRate}%`, successRate >= 90 ? 'success' : 'warning');
    
    if (this.testResults.failed === 0) {
      this.log('\n🎉 All tests passed! Elasticsearch implementation is working correctly.', 'success');
    } else {
      this.log('\n⚠️  Some tests failed. Please check the errors above.', 'warning');
    }
  }
}

// Helper function to check prerequisites
async function checkPrerequisites() {
  console.log(chalk.blue('🔍 Checking prerequisites...'));
  
  try {
    // Check if Elasticsearch is running
    await axios.get(`${ES_URL}/_cluster/health`, { timeout: 5000 });
    console.log(chalk.green('✓ Elasticsearch is running'));
  } catch (error) {
    console.log(chalk.red('✗ Elasticsearch is not running'));
    console.log(chalk.yellow('Please start Elasticsearch: docker-compose -f docker-compose.elasticsearch.yml up -d'));
    process.exit(1);
  }
  
  try {
    // Check if application is running
    await axios.get(`${BASE_URL}/search/health`, { timeout: 5000 });
    console.log(chalk.green('✓ Application is running'));
  } catch (error) {
    console.log(chalk.red('✗ Application is not running'));
    console.log(chalk.yellow('Please start the application: npm run start:dev'));
    process.exit(1);
  }
}

// Main execution
async function main() {
  try {
    await checkPrerequisites();
    
    const tester = new ElasticsearchTester();
    await tester.runAllTests();
    
    process.exit(tester.testResults.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error(chalk.red('Test suite failed:'), error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = ElasticsearchTester; 