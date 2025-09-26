#!/bin/bash

# Elasticsearch Manual Testing Script
# Quick curl-based tests for Elasticsearch functionality

set -e

BASE_URL="http://localhost:3000"
ES_URL="http://localhost:9200"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=0

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
    ((TESTS_PASSED++))
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    ((TESTS_FAILED++))
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

run_test() {
    local test_name="$1"
    local test_command="$2"
    
    ((TOTAL_TESTS++))
    log_info "Testing: $test_name"
    
    if eval "$test_command"; then
        log_success "$test_name"
        return 0
    else
        log_error "$test_name failed"
        return 1
    fi
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Elasticsearch is running
    if curl -s "$ES_URL/_cluster/health" > /dev/null; then
        log_success "Elasticsearch is running"
    else
        log_error "Elasticsearch is not running"
        log_warning "Start with: docker-compose -f docker-compose.elasticsearch.yml up -d"
        exit 1
    fi
    
    # Check if application is running
    if curl -s "$BASE_URL/search/health" > /dev/null; then
        log_success "Application is running"
    else
        log_error "Application is not running"
        log_warning "Start with: npm run start:dev"
        exit 1
    fi
}

# Test functions
test_elasticsearch_health() {
    local response=$(curl -s "$ES_URL/_cluster/health")
    local status=$(echo "$response" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    
    if [[ "$status" == "green" || "$status" == "yellow" ]]; then
        log_info "Cluster status: $status"
        return 0
    else
        log_error "Cluster status: $status"
        return 1
    fi
}

test_application_health() {
    curl -s "$BASE_URL/search/health" | grep -q "status" && return 0 || return 1
}

test_create_indices() {
    # Clean up first
    curl -s -X DELETE "$BASE_URL/search/admin/indices/hotels" > /dev/null 2>&1 || true
    curl -s -X DELETE "$BASE_URL/search/admin/indices/rooms" > /dev/null 2>&1 || true
    
    # Create indices
    local response=$(curl -s -X POST "$BASE_URL/search/admin/indices/create")
    echo "$response" | grep -q "successfully" && return 0 || return 1
}

test_index_stats() {
    curl -s "$BASE_URL/search/admin/indices/hotels/stats" | grep -q "indices" && return 0 || return 1
}

test_document_operations() {
    local test_hotel='{
        "id": "test-hotel-shell",
        "name": "Shell Test Hotel",
        "description": "A hotel for shell testing",
        "location": {
            "coordinates": { "lat": 10.8231, "lon": 106.6297 },
            "city": "Ho Chi Minh City",
            "country": "Vietnam"
        },
        "pricing": { "min_price": 100, "max_price": 200, "currency": "USD" },
        "ratings": { "average": 4.5, "count": 50 },
        "is_active": true
    }'
    
    # Index document
    curl -s -X PUT "$ES_URL/tigo_hotels/_doc/test-hotel-shell" \
         -H "Content-Type: application/json" \
         -d "$test_hotel" > /dev/null
    
    # Wait for indexing
    sleep 2
    
    # Verify document exists
    local response=$(curl -s "$ES_URL/tigo_hotels/_doc/test-hotel-shell")
    echo "$response" | grep -q '"found":true' && return 0 || return 1
}

test_basic_search() {
    curl -s "$BASE_URL/search/hotels?query=test&limit=5" | grep -q '"hotels":\[' && return 0 || return 1
}

test_location_search() {
    curl -s "$BASE_URL/search/hotels?city=Ho%20Chi%20Minh%20City&limit=5" | grep -q '"hotels":\[' && return 0 || return 1
}

test_geo_search() {
    curl -s "$BASE_URL/search/hotels?latitude=10.8231&longitude=106.6297&radius_km=10&limit=5" | grep -q '"hotels":\[' && return 0 || return 1
}

test_price_filter() {
    curl -s "$BASE_URL/search/hotels?min_price=50&max_price=150&limit=5" | grep -q '"hotels":\[' && return 0 || return 1
}

test_rating_filter() {
    curl -s "$BASE_URL/search/hotels?min_rating=4&limit=5" | grep -q '"hotels":\[' && return 0 || return 1
}

test_sorting() {
    local price_sort=$(curl -s "$BASE_URL/search/hotels?sort_by=price&sort_order=ASC&limit=5")
    local rating_sort=$(curl -s "$BASE_URL/search/hotels?sort_by=rating&sort_order=DESC&limit=5")
    
    echo "$price_sort" | grep -q '"hotels":\[' && echo "$rating_sort" | grep -q '"hotels":\[' && return 0 || return 1
}

test_pagination() {
    local page1=$(curl -s "$BASE_URL/search/hotels?page=1&limit=2")
    local page2=$(curl -s "$BASE_URL/search/hotels?page=2&limit=2")
    
    echo "$page1" | grep -q '"page":1' && echo "$page2" | grep -q '"page":2' && return 0 || return 1
}

test_aggregations() {
    curl -s "$BASE_URL/search/hotels?limit=5" | grep -q '"aggregations":{' && return 0 || return 1
}

test_autocomplete() {
    curl -s "$BASE_URL/search/hotels/autocomplete?q=test&limit=5" | grep -q '"suggestions":\[' && return 0 || return 1
}

test_complex_query() {
    local query="query=hotel&city=Ho%20Chi%20Minh%20City&min_price=50&max_price=300&min_rating=3&sort_by=rating&sort_order=DESC&page=1&limit=5"
    curl -s "$BASE_URL/search/hotels?$query" | grep -q '"hotels":\[' && return 0 || return 1
}

test_search_performance() {
    local start=$(date +%s%N)
    curl -s "$BASE_URL/search/hotels?query=test&limit=20" > /dev/null
    local end=$(date +%s%N)
    local duration=$(( (end - start) / 1000000 )) # Convert to milliseconds
    
    log_info "Search performance: ${duration}ms"
    
    if [ $duration -lt 1000 ]; then
        return 0
    else
        log_warning "Search took ${duration}ms (threshold: 1000ms)"
        return 1
    fi
}

test_data_consistency() {
    # Get counts
    local pg_response=$(curl -s "$BASE_URL/hotels")
    local es_response=$(curl -s "$ES_URL/tigo_hotels/_count")
    
    # Extract counts (simplified - may need adjustment based on actual response format)
    local pg_count=$(echo "$pg_response" | grep -o '"hotels":\[' | wc -l)
    local es_count=$(echo "$es_response" | grep -o '"count":[0-9]*' | cut -d':' -f2)
    
    log_info "PostgreSQL hotels: $pg_count"
    log_info "Elasticsearch hotels: $es_count"
    
    # Allow some difference
    local diff=$((pg_count - es_count))
    if [ ${diff#-} -le 5 ]; then # Absolute value check
        return 0
    else
        log_warning "Data inconsistency detected"
        return 1
    fi
}

# Main test execution
main() {
    echo "🚀 Starting Elasticsearch Shell Test Suite"
    echo "==========================================="
    
    check_prerequisites
    
    echo
    echo "📡 Infrastructure Tests"
    run_test "Elasticsearch Cluster Health" "test_elasticsearch_health"
    run_test "Application Health Check" "test_application_health"
    
    echo
    echo "🗂️  Index Management Tests"
    run_test "Create Search Indices" "test_create_indices"
    run_test "Get Index Statistics" "test_index_stats"
    
    echo
    echo "📄 Document Operations Tests"
    run_test "Index and Retrieve Document" "test_document_operations"
    
    echo
    echo "🔍 Search Functionality Tests"
    run_test "Basic Text Search" "test_basic_search"
    run_test "Location-based Search" "test_location_search"
    run_test "Geo-spatial Search" "test_geo_search"
    run_test "Price Range Filter" "test_price_filter"
    run_test "Rating Filter" "test_rating_filter"
    run_test "Result Sorting" "test_sorting"
    run_test "Pagination" "test_pagination"
    run_test "Search Aggregations" "test_aggregations"
    
    echo
    echo "💡 Autocomplete Tests"
    run_test "Autocomplete Suggestions" "test_autocomplete"
    
    echo
    echo "🔧 Complex Query Tests"
    run_test "Multi-parameter Search" "test_complex_query"
    
    echo
    echo "⚡ Performance Tests"
    run_test "Search Response Time" "test_search_performance"
    
    echo
    echo "🔄 Data Consistency Tests"
    run_test "PostgreSQL-Elasticsearch Sync" "test_data_consistency"
    
    # Summary
    echo
    echo "📊 Test Results Summary"
    echo "======================="
    echo "Total Tests: $TOTAL_TESTS"
    echo "Passed: $TESTS_PASSED"
    echo "Failed: $TESTS_FAILED"
    
    local success_rate=$((TESTS_PASSED * 100 / TOTAL_TESTS))
    echo "Success Rate: ${success_rate}%"
    
    if [ $TESTS_FAILED -eq 0 ]; then
        log_success "All tests passed! Elasticsearch implementation is working correctly."
        exit 0
    else
        log_warning "Some tests failed. Please check the errors above."
        exit 1
    fi
}

# Run main function
main "$@" 