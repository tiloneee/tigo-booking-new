import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { SearchService } from '../services/search.service';
import { IndexManagementService } from '../services/index-management.service';
import {
  HotelSearchService,
  HotelSearchQuery,
} from '../services/hotel-search.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(
    private readonly searchService: SearchService,
    private readonly indexManagementService: IndexManagementService,
    private readonly hotelSearchService: HotelSearchService,
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Check Elasticsearch cluster health' })
  @ApiResponse({ status: 200, description: 'Elasticsearch health status' })
  async healthCheck() {
    return this.searchService.healthCheck();
  }

  @Post('admin/indices/create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create all search indices (Admin only)' })
  @ApiResponse({ status: 201, description: 'Indices created successfully' })
  async createIndices() {
    await this.indexManagementService.createAllIndices();
    return { message: 'All indices created successfully' };
  }

  @Delete('admin/indices/:indexName')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a specific index (Admin only)' })
  @ApiResponse({ status: 200, description: 'Index deleted successfully' })
  async deleteIndex(@Param('indexName') indexName: string) {
    await this.indexManagementService.deleteIndex(indexName);
    return { message: `Index ${indexName} deleted successfully` };
  }

  @Get('admin/indices/:indexName/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get index statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Index statistics' })
  async getIndexStats(@Param('indexName') indexName: string) {
    return this.indexManagementService.getIndexStats(indexName);
  }

  @Get('hotels')
  @ApiOperation({ summary: 'Search hotels with advanced filters' })
  @ApiResponse({
    status: 200,
    description: 'Hotel search results with pagination and aggregations',
  })
  @ApiQuery({
    name: 'query',
    required: false,
    description: 'Search term for hotel name, description, or location',
  })
  @ApiQuery({ name: 'city', required: false, description: 'Filter by city' })
  @ApiQuery({
    name: 'latitude',
    required: false,
    type: Number,
    description: 'Latitude for geo search',
  })
  @ApiQuery({
    name: 'longitude',
    required: false,
    type: Number,
    description: 'Longitude for geo search',
  })
  @ApiQuery({
    name: 'radius_km',
    required: false,
    type: Number,
    description: 'Search radius in kilometers (default: 50)',
  })
  @ApiQuery({
    name: 'check_in_date',
    required: false,
    description: 'Check-in date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'check_out_date',
    required: false,
    description: 'Check-out date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'number_of_guests',
    required: false,
    type: Number,
    description: 'Number of guests',
  })
  @ApiQuery({
    name: 'amenity_ids',
    required: false,
    type: [String],
    description: 'Array of amenity IDs to filter by',
  })
  @ApiQuery({
    name: 'min_price',
    required: false,
    type: Number,
    description: 'Minimum price per night',
  })
  @ApiQuery({
    name: 'max_price',
    required: false,
    type: Number,
    description: 'Maximum price per night',
  })
  @ApiQuery({
    name: 'min_rating',
    required: false,
    type: Number,
    description: 'Minimum average rating',
  })
  @ApiQuery({
    name: 'room_type',
    required: false,
    description: 'Filter by room type',
  })
  @ApiQuery({
    name: 'sort_by',
    required: false,
    enum: ['price', 'rating', 'distance', 'name', 'relevance'],
    description: 'Sort field',
  })
  @ApiQuery({
    name: 'sort_order',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sort order',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Results per page (default: 10)',
  })
  async searchHotels(@Query() searchQuery: HotelSearchQuery) {
    return this.hotelSearchService.searchHotels(searchQuery);
  }

  @Get('hotels/autocomplete')
  @ApiOperation({ summary: 'Get autocomplete suggestions for hotel search' })
  @ApiResponse({ status: 200, description: 'Autocomplete suggestions' })
  @ApiQuery({
    name: 'q',
    required: true,
    description: 'Search query for suggestions',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of suggestions (default: 10)',
  })
  async getAutocompleteSuggestions(
    @Query('q') query: string,
    @Query('limit') limit?: number,
  ) {
    return this.hotelSearchService.getAutocompleteSuggestions(query, limit);
  }
}
