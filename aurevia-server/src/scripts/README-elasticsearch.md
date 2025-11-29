# Elasticsearch Setup for Hotel Search

This guide will help you set up Elasticsearch for advanced hotel search capabilities in your Tigo Booking application.

## Prerequisites

1. **Elasticsearch Server**: You need Elasticsearch running locally or remotely.

### Quick Start with Docker

```bash
# Start Elasticsearch with Docker
docker run -d \
  --name elasticsearch \
  -p 9200:9200 \
  -p 9300:9300 \
  -e "discovery.type=single-node" \
  -e "xpack.security.enabled=false" \
  -e "ES_JAVA_OPTS=-Xms512m -Xmx512m" \
  elasticsearch:8.11.0
```

## Environment Configuration

Add these environment variables to your `.env` file:

```env
# Elasticsearch Configuration
ELASTICSEARCH_HOST=localhost
ELASTICSEARCH_PORT=9200
ELASTICSEARCH_INDEX_PREFIX=tigo_
SEARCH_TIMEOUT=30000

# Optional Authentication (if enabled in Elasticsearch)
# ELASTICSEARCH_USERNAME=your_username
# ELASTICSEARCH_PASSWORD=your_password
```

## Setup Scripts

### Initial Setup
Run this script to set up Elasticsearch indices and sync existing data:

```bash
cd tigo-server
npx ts-node src/scripts/elasticsearch-setup.ts
```

This script will:
- ✅ Check Elasticsearch connection
- 🏗️ Create hotel and room indices with proper mappings
- 🔄 Sync all existing hotels from PostgreSQL to Elasticsearch
- 🔍 Validate data consistency

### Reset/Reindex
If you need to reset the indices and reindex all data:

```bash
cd tigo-server
npx ts-node src/scripts/elasticsearch-reset.ts
```

This script will:
- 🗑️ Delete existing indices
- 🏗️ Recreate indices
- 🔄 Resync all hotel data

## API Endpoints

Once set up, you'll have access to these endpoints:

### Public Search Endpoints
- `GET /hotels/search` - Hotel search (now powered by Elasticsearch)
- `GET /search/hotels` - Advanced hotel search with aggregations
- `GET /search/hotels/autocomplete` - Autocomplete suggestions

### Admin Endpoints (require authentication)
- `GET /search/health` - Check Elasticsearch health
- `POST /search/admin/indices/create` - Create indices
- `DELETE /search/admin/indices/:name` - Delete an index
- `GET /search/admin/indices/:name/stats` - Get index statistics

## Search Features

### Advanced Search Capabilities
- **Full-text search** across hotel names, descriptions, and locations
- **Geospatial search** with radius filtering
- **Date-based availability** filtering
- **Price range** filtering
- **Rating** filtering
- **Amenities** filtering
- **Autocomplete** suggestions
- **Aggregations** for faceted search

### Search Parameters
```typescript
{
  query?: string;           // Full-text search
  city?: string;           // City filter
  latitude?: number;       // Geo search
  longitude?: number;      // Geo search
  radius_km?: number;      // Geo radius (default: 50km)
  check_in_date?: string;  // YYYY-MM-DD
  check_out_date?: string; // YYYY-MM-DD
  number_of_guests?: number;
  amenity_ids?: string[];  // Array of amenity IDs
  min_price?: number;      // Per night
  max_price?: number;      // Per night
  min_rating?: number;     // 1-5 scale
  sort_by?: 'price' | 'rating' | 'distance' | 'name' | 'relevance';
  sort_order?: 'ASC' | 'DESC';
  page?: number;           // Pagination
  limit?: number;          // Results per page
}
```

## Data Synchronization

The system automatically syncs data between PostgreSQL and Elasticsearch:

- **Hotel Created**: Automatically indexed in Elasticsearch
- **Hotel Updated**: Index is updated with new data
- **Hotel Deleted**: Removed from Elasticsearch index
- **Room Availability Changes**: Hotel pricing is updated
- **Review Changes**: Hotel ratings are recalculated and updated

## Monitoring & Maintenance

### Health Check
```bash
curl http://localhost:3000/search/health
```

### Data Consistency Validation
The setup script includes a data consistency check that compares:
- Hotel count between PostgreSQL and Elasticsearch
- Sample hotel data consistency
- Index health status

### Troubleshooting

1. **Connection Issues**: 
   - Ensure Elasticsearch is running on the configured host/port
   - Check firewall settings

2. **Index Issues**:
   - Run the reset script to recreate indices
   - Check Elasticsearch logs for errors

3. **Data Sync Issues**:
   - Manually trigger a bulk sync with the setup script
   - Check application logs for sync errors

4. **Performance Issues**:
   - Monitor Elasticsearch resource usage
   - Consider adjusting the `SEARCH_TIMEOUT` setting
   - Implement index optimization for large datasets

## Production Considerations

1. **Security**: Enable authentication and SSL in production
2. **Backup**: Set up regular Elasticsearch snapshots
3. **Monitoring**: Use Elasticsearch monitoring tools
4. **Scaling**: Consider cluster setup for high availability
5. **Resource Allocation**: Allocate sufficient memory and CPU

## Example Usage

```bash
# Search hotels in Ho Chi Minh City with availability
curl "http://localhost:3000/hotels/search?city=Ho+Chi+Minh+City&check_in_date=2024-03-15&check_out_date=2024-03-17&number_of_guests=2"

# Autocomplete suggestions
curl "http://localhost:3000/search/hotels/autocomplete?q=grand"

# Advanced search with geolocation
curl "http://localhost:3000/search/hotels?latitude=10.8231&longitude=106.6297&radius_km=10&min_rating=4&sort_by=distance"
```
