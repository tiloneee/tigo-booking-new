# 🧪 Elasticsearch Testing Guide

This guide provides comprehensive testing strategies to verify your Elasticsearch implementation is working correctly.

## 📋 **Prerequisites**

Before running any tests, ensure the following are set up:

### 1. **Start Docker Desktop**
Make sure Docker Desktop is running on your system.

### 2. **Start Elasticsearch & Kibana**
```bash
# Navigate to the project directory
cd tigo-server

# Start Elasticsearch and Kibana
docker-compose -f docker-compose.elasticsearch.yml up -d

# Verify Elasticsearch is running
curl -X GET "localhost:9200/_cluster/health?pretty"
```

### 3. **Start the Application**
```bash
# Start the NestJS application
npm run start:dev

# Or build and start
npm run build
npm run start:prod
```

### 4. **Install Testing Dependencies (if needed)**
```bash
npm install axios chalk --save-dev
```

## 🚀 **Testing Methods**

We provide three different testing approaches:

### **Method 1: Automated JavaScript Test Suite** ⚡

The most comprehensive testing method with detailed reporting:

```bash
# Run the automated test suite
node scripts/test-elasticsearch.js
```

**Features:**
- ✅ 20+ comprehensive tests
- ✅ Performance monitoring
- ✅ Data consistency validation
- ✅ Detailed error reporting
- ✅ Colored output with timestamps

### **Method 2: Shell Script (Curl-based)** 🔧

Quick and lightweight testing using curl commands:

```bash
# Run the shell-based tests
./scripts/test-elasticsearch.sh
```

**Features:**
- ✅ No additional dependencies
- ✅ Fast execution
- ✅ Platform-independent
- ✅ Easy to customize

### **Method 3: NestJS E2E Tests** 🧪

Jest-based end-to-end testing:

```bash
# Run the E2E test suite
npm run test:e2e -- elasticsearch.e2e-spec.ts
```

**Features:**
- ✅ Integrated with Jest
- ✅ Mocking capabilities
- ✅ Test isolation
- ✅ CI/CD compatible

## 📊 **Test Coverage Areas**

### 1. **Infrastructure Tests**
- ✅ Elasticsearch cluster health
- ✅ Application connectivity
- ✅ Service availability

### 2. **Index Management Tests**
- ✅ Create hotel and room indices
- ✅ Index mapping validation
- ✅ Index statistics retrieval
- ✅ Index deletion and recreation

### 3. **Document Operations Tests**
- ✅ Document indexing
- ✅ Document updates
- ✅ Document deletion
- ✅ Bulk operations

### 4. **Search Functionality Tests**
- ✅ Basic text search
- ✅ Location-based search
- ✅ Geo-spatial search (distance-based)
- ✅ Price range filtering
- ✅ Rating filtering
- ✅ Multi-field sorting
- ✅ Pagination
- ✅ Search aggregations

### 5. **Advanced Features Tests**
- ✅ Autocomplete suggestions
- ✅ Complex multi-parameter queries
- ✅ Fuzzy search
- ✅ Search highlighting

### 6. **Performance Tests**
- ✅ Search response time (< 1000ms)
- ✅ Bulk indexing performance
- ✅ Memory usage monitoring

### 7. **Data Consistency Tests**
- ✅ PostgreSQL-Elasticsearch synchronization
- ✅ Real-time data updates
- ✅ Consistency validation

### 8. **Error Handling Tests**
- ✅ Invalid parameter handling
- ✅ Network error resilience
- ✅ Graceful degradation

## 🔧 **Manual Testing Commands**

### **Basic Health Checks**

```bash
# Check Elasticsearch health
curl -X GET "localhost:9200/_cluster/health?pretty"

# Check application health
curl -X GET "localhost:3000/search/health"
```

### **Index Management**

```bash
# Create all indices
curl -X POST "localhost:3000/search/admin/indices/create"

# Get hotel index stats
curl -X GET "localhost:3000/search/admin/indices/hotels/stats"

# Delete an index
curl -X DELETE "localhost:3000/search/admin/indices/hotels"
```

### **Search Testing**

```bash
# Basic text search
curl -X GET "localhost:3000/search/hotels?query=luxury&limit=5"

# Location search
curl -X GET "localhost:3000/search/hotels?city=Ho%20Chi%20Minh%20City&limit=5"

# Price filter
curl -X GET "localhost:3000/search/hotels?min_price=100&max_price=300&limit=5"

# Geo search
curl -X GET "localhost:3000/search/hotels?latitude=10.8231&longitude=106.6297&radius_km=10&limit=5"

# Complex search
curl -X GET "localhost:3000/search/hotels?query=hotel&city=Ho%20Chi%20Minh%20City&min_price=50&max_price=200&min_rating=4&sort_by=rating&sort_order=DESC&page=1&limit=10"

# Autocomplete
curl -X GET "localhost:3000/search/hotels/autocomplete?q=luxury&limit=5"
```

## 📈 **Performance Benchmarks**

### **Expected Performance Metrics:**

| Operation | Expected Time | Threshold |
|-----------|---------------|-----------|
| Search Query | < 100ms | < 1000ms |
| Autocomplete | < 50ms | < 500ms |
| Index Creation | < 5s | < 30s |
| Bulk Indexing (100 docs) | < 2s | < 10s |

### **Monitoring Commands:**

```bash
# Check search performance
time curl -X GET "localhost:3000/search/hotels?query=test"

# Monitor Elasticsearch performance
curl -X GET "localhost:9200/_nodes/stats?pretty"

# Check index size
curl -X GET "localhost:9200/tigo_hotels/_stats?pretty"
```

## 🐛 **Troubleshooting**

### **Common Issues:**

#### **1. Elasticsearch Not Running**
```bash
# Check if Elasticsearch is running
docker ps | grep elasticsearch

# Start Elasticsearch
docker-compose -f docker-compose.elasticsearch.yml up -d

# Check logs
docker-compose -f docker-compose.elasticsearch.yml logs elasticsearch
```

#### **2. Application Connection Errors**
```bash
# Check environment variables
echo $ELASTICSEARCH_HOST
echo $ELASTICSEARCH_PORT

# Test direct connection
curl -X GET "localhost:9200"
```

#### **3. Index Not Found Errors**
```bash
# List all indices
curl -X GET "localhost:9200/_cat/indices?v"

# Create missing indices
curl -X POST "localhost:3000/search/admin/indices/create"
```

#### **4. Search Returns No Results**
```bash
# Check document count
curl -X GET "localhost:9200/tigo_hotels/_count"

# Check if data is indexed
curl -X GET "localhost:9200/tigo_hotels/_search?pretty"

# Sync data from PostgreSQL
curl -X POST "localhost:3000/search/admin/sync/hotels"
```

#### **5. Performance Issues**
```bash
# Check cluster stats
curl -X GET "localhost:9200/_cluster/stats?pretty"

# Check node health
curl -X GET "localhost:9200/_nodes/stats?pretty"

# Optimize indices
curl -X POST "localhost:9200/tigo_hotels/_forcemerge"
```

## 📊 **Test Result Interpretation**

### **Success Criteria:**
- ✅ All infrastructure tests pass
- ✅ Index creation succeeds
- ✅ Search queries return results
- ✅ Performance metrics within thresholds
- ✅ Data consistency maintained
- ✅ Error handling works correctly

### **Warning Signs:**
- ⚠️ Search response time > 500ms
- ⚠️ Data inconsistency > 5 documents
- ⚠️ Elasticsearch cluster status "yellow"
- ⚠️ Memory usage > 80%

### **Failure Indicators:**
- ❌ Cannot connect to Elasticsearch
- ❌ Index creation fails
- ❌ Search queries timeout
- ❌ Data synchronization broken
- ❌ Multiple test failures

## 🔄 **Continuous Testing**

### **CI/CD Integration:**

Add to your `package.json`:

```json
{
  "scripts": {
    "test:elasticsearch": "node scripts/test-elasticsearch.js",
    "test:elasticsearch:shell": "./scripts/test-elasticsearch.sh",
    "test:elasticsearch:e2e": "npm run test:e2e -- elasticsearch.e2e-spec.ts"
  }
}
```

### **GitHub Actions Example:**

```yaml
name: Elasticsearch Tests
on: [push, pull_request]

jobs:
  elasticsearch-tests:
    runs-on: ubuntu-latest
    
    services:
      elasticsearch:
        image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
        env:
          discovery.type: single-node
          xpack.security.enabled: false
        ports:
          - 9200:9200
    
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Wait for Elasticsearch
        run: |
          until curl -s localhost:9200; do
            echo "Waiting for Elasticsearch..."
            sleep 5
          done
      
      - name: Run Elasticsearch tests
        run: npm run test:elasticsearch
```

## 🎯 **Best Practices**

1. **Run tests in order**: Infrastructure → Index → Document → Search
2. **Clean up test data**: Remove test documents after testing
3. **Monitor performance**: Track response times and resource usage
4. **Test with real data**: Use production-like datasets when possible
5. **Automate testing**: Include tests in your CI/CD pipeline
6. **Document issues**: Keep track of common problems and solutions

## 📚 **Additional Resources**

- [Elasticsearch Official Documentation](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
- [NestJS Elasticsearch Documentation](https://docs.nestjs.com/techniques/search)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)

---

**Happy Testing! 🚀**

If you encounter any issues or need help with specific test scenarios, please check the troubleshooting section or refer to the application logs. 