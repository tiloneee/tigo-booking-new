import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { HotelOwnershipGuard } from '../guards/hotel-ownership.guard';
import { HotelService } from '../services/hotel.service';
import { CreateHotelDto } from '../dto/hotel/create-hotel.dto';
import { UpdateHotelDto } from '../dto/hotel/update-hotel.dto';
import { SearchHotelDto } from '../dto/hotel/search-hotel.dto';
import { CreateHotelRequestDto } from '../dto/hotel/create-hotel-request.dto';
import { ReviewHotelRequestDto } from '../dto/hotel/review-hotel-request.dto';
import { CreateHotelDeletionRequestDto } from '../dto/hotel/create-hotel-deletion-request.dto';
import { ReviewHotelDeletionRequestDto } from '../dto/hotel/review-hotel-deletion-request.dto';
import { HotelRequestStatus } from '../entities/hotel-request.entity';
import { HotelDeletionRequestStatus } from '../entities/hotel-deletion-request.entity';
import { HotelSearchService } from '../../search/services/hotel-search.service';

@ApiTags('Hotels')
@Controller('hotels')
export class HotelController {
  constructor(
    private readonly hotelService: HotelService,
    private readonly hotelSearchService: HotelSearchService,
  ) {}

  // Create hotel (HotelOwner, Admin)
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HotelOwner', 'Admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new hotel',
    description:
      'Create a new hotel listing. Only hotel owners and admins can create hotels.',
  })
  @ApiBody({ type: CreateHotelDto })
  @ApiResponse({
    status: 201,
    description: 'Hotel created successfully',
    schema: {
      example: {
        id: 'uuid-string',
        name: 'Grand Saigon Hotel',
        description: 'A luxurious 5-star hotel...',
        address: '123 Nguyen Hue Boulevard',
        city: 'Ho Chi Minh City',
        state: 'Ho Chi Minh',
        zip_code: '70000',
        country: 'Vietnam',
        phone_number: '+84283829999',
        latitude: 10.762622,
        longitude: 106.660172,
        avg_rating: 0,
        total_reviews: 0,
        is_active: true,
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-15T10:30:00Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({ status: 409, description: 'Conflict - hotel already exists' })
  create(@Body() createHotelDto: CreateHotelDto, @Request() req) {
    return this.hotelService.create(createHotelDto, req.user.userId);
  }

  // Get own hotels (HotelOwner)
  @Get('mine')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HotelOwner', 'Admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get own hotels',
    description: 'Retrieve all hotels owned by the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of owned hotels retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          avg_rating: { type: 'number' },
          total_reviews: { type: 'number' },
          is_active: { type: 'boolean' },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMyHotels(@Request() req) {
    return this.hotelService.findByOwner(req.user.userId);
  }

  // Get all hotels (Public)
  @Get('all')
  @ApiOperation({
    summary: 'Get all hotels (Public)',
    description:
      'Retrieve all active hotels without search filters. This endpoint is public and does not require authentication.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of hotels per page (default: 12)',
  })
  @ApiQuery({
    name: 'sort_by',
    required: false,
    description: 'Sort by: name, rating (default: name)',
  })
  @ApiQuery({
    name: 'sort_order',
    required: false,
    description: 'Sort order: ASC, DESC (default: ASC)',
  })
  @ApiResponse({
    status: 200,
    description: 'Hotels retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { type: 'object' },
        },
        pagination: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            page: { type: 'number' },
            limit: { type: 'number' },
            has_more: { type: 'boolean' },
          },
        },
      },
    },
  })
  async getAllHotelsPublic(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort_by') sortBy?: string,
    @Query('sort_order') sortOrder?: 'ASC' | 'DESC',
  ) {
    // Normalize sort_order to uppercase
    const normalizedSortOrder = sortOrder 
      ? (sortOrder.toUpperCase() as 'ASC' | 'DESC')
      : 'ASC';
    
    const searchDto = {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 12,
      sort_by: (sortBy as 'name' | 'rating') || 'name',
      sort_order: normalizedSortOrder,
    };

    const result = await this.hotelService.findAllActive(searchDto);
    
    return {
      data: result.hotels,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        has_more: result.page * result.limit < result.total,
      },
    };
  }

  // Search hotels (Public)
  @Get('search')
  @ApiOperation({
    summary: 'Search hotels (Public)',
    description:
      'Search for hotels with various filters. This endpoint is public and does not require authentication.',
  })
  @ApiQuery({
    name: 'city',
    required: false,
    description: 'City name to search in',
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
    description: 'Number of guests',
  })
  @ApiQuery({
    name: 'min_price',
    required: false,
    description: 'Minimum price per night',
  })
  @ApiQuery({
    name: 'max_price',
    required: false,
    description: 'Maximum price per night',
  })
  @ApiQuery({
    name: 'min_rating',
    required: false,
    description: 'Minimum rating (1-5)',
  })
  @ApiQuery({
    name: 'latitude',
    required: false,
    description: 'Latitude for geospatial search',
  })
  @ApiQuery({
    name: 'longitude',
    required: false,
    description: 'Longitude for geospatial search',
  })
  @ApiQuery({
    name: 'radius_km',
    required: false,
    description: 'Search radius in kilometers',
  })
  @ApiQuery({
    name: 'sort_by',
    required: false,
    enum: ['price', 'rating', 'distance', 'name'],
  })
  @ApiQuery({ name: 'sort_order', required: false, enum: ['ASC', 'DESC'] })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page (default: 10, max: 100)',
  })
  @ApiResponse({
    status: 200,
    description: 'Search results retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        hotels: { type: 'array' },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
      },
    },
  })
  async search(@Query() searchDto: SearchHotelDto) {
    // Convert SearchHotelDto to HotelSearchQuery for Elasticsearch
    const searchQuery = {
      query: searchDto.city, // Use city as general search term
      city: searchDto.city,
      latitude: searchDto.latitude,
      longitude: searchDto.longitude,
      radius_km: searchDto.radius_km,
      check_in_date: searchDto.check_in_date,
      check_out_date: searchDto.check_out_date,
      number_of_guests: searchDto.number_of_guests,
      min_price: searchDto.min_price,
      max_price: searchDto.max_price,
      min_rating: searchDto.min_rating,
      sort_by: (searchDto.sort_by as 'price' | 'rating' | 'distance' | 'name' | 'relevance') || 'relevance',
      sort_order: searchDto.sort_order || 'DESC',
      page: searchDto.page || 1,
      limit: searchDto.limit || 10,
    };

    return this.hotelSearchService.searchHotels(searchQuery);
  }

  // ==================== HOTEL REQUEST ENDPOINTS ====================

  // Create hotel request (authenticated users)
  @Post('requests')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Submit a hotel request',
    description:
      'Submit a request to add a new hotel to the platform. Requires authentication.',
  })
  @ApiBody({ type: CreateHotelRequestDto })
  @ApiResponse({
    status: 201,
    description: 'Hotel request submitted successfully',
    schema: {
      example: {
        id: 'uuid-string',
        name: 'Grand Saigon Hotel',
        description: 'A luxurious 5-star hotel...',
        address: '123 Nguyen Hue Boulevard',
        city: 'Ho Chi Minh City',
        state: 'Ho Chi Minh',
        zip_code: '70000',
        country: 'Vietnam',
        phone_number: '+84283829999',
        status: 'pending',
        requested_by_user_id: 'uuid-string',
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-15T10:30:00Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  createHotelRequest(
    @Body() createHotelRequestDto: CreateHotelRequestDto,
    @Request() req,
  ) {
    return this.hotelService.createHotelRequest(
      createHotelRequestDto,
      req.user.userId,
    );
  }

  // Get all hotel requests (Admin only)
  @Get('requests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all hotel requests (Admin only)',
    description: 'Retrieve all hotel requests. Admin access only.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: HotelRequestStatus,
    description: 'Filter by request status',
  })
  @ApiResponse({
    status: 200,
    description: 'Hotel requests retrieved successfully',
    schema: {
      type: 'array',
      items: { type: 'object' },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - admin access required',
  })
  getAllHotelRequests(@Query('status') status?: HotelRequestStatus) {
    return this.hotelService.getAllHotelRequests(status);
  }

  // Get own hotel requests (authenticated users)
  @Get('requests/mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get own hotel requests',
    description: 'Retrieve all hotel requests submitted by the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'User hotel requests retrieved successfully',
    schema: {
      type: 'array',
      items: { type: 'object' },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMyHotelRequests(@Request() req) {
    return this.hotelService.getHotelRequestsByUser(req.user.userId);
  }

  // Get hotel request by ID (Admin only)
  @Get('requests/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get hotel request details (Admin only)',
    description: 'Get detailed information about a specific hotel request.',
  })
  @ApiParam({ name: 'id', description: 'Hotel request UUID' })
  @ApiResponse({
    status: 200,
    description: 'Hotel request details retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required' })
  @ApiResponse({ status: 404, description: 'Hotel request not found' })
  getHotelRequestById(@Param('id') id: string) {
    return this.hotelService.getHotelRequestById(id);
  }

  // Review hotel request (Admin only)
  @Patch('requests/:id/review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Review hotel request (Admin only)',
    description:
      'Approve or reject a hotel request. If approved, a new hotel will be created automatically.',
  })
  @ApiParam({ name: 'id', description: 'Hotel request UUID' })
  @ApiBody({ type: ReviewHotelRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Hotel request reviewed successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required' })
  @ApiResponse({ status: 404, description: 'Hotel request not found' })
  reviewHotelRequest(
    @Param('id') id: string,
    @Body() reviewDto: ReviewHotelRequestDto,
    @Request() req,
  ) {
    return this.hotelService.reviewHotelRequest(id, reviewDto, req.user.userId);
  }

  // Create hotel deletion request (HotelOwner for their own hotel)
  @Post(':id/deletion-request')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HotelOwner', 'Admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Request hotel deletion',
    description:
      'Hotel owners can request deletion of their hotel. Admin approval required to deactivate the hotel.',
  })
  @ApiParam({ name: 'id', description: 'Hotel UUID' })
  @ApiBody({ type: CreateHotelDeletionRequestDto })
  @ApiResponse({
    status: 201,
    description: 'Hotel deletion request created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - you do not own this hotel',
  })
  @ApiResponse({ status: 404, description: 'Hotel not found' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - pending deletion request already exists',
  })
  createHotelDeletionRequest(
    @Param('id') hotelId: string,
    @Body() createDto: CreateHotelDeletionRequestDto,
    @Request() req,
  ) {
    return this.hotelService.createHotelDeletionRequest(
      hotelId,
      createDto,
      req.user.userId,
    );
  }

  // Get all hotel deletion requests (Admin only)
  @Get('deletion-requests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all hotel deletion requests (Admin only)',
    description: 'Retrieve all hotel deletion requests with optional status filter.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: HotelDeletionRequestStatus,
    description: 'Filter by request status',
  })
  @ApiResponse({
    status: 200,
    description: 'Hotel deletion requests retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required' })
  getAllHotelDeletionRequests(@Query('status') status?: HotelDeletionRequestStatus) {
    return this.hotelService.getAllHotelDeletionRequests(status);
  }

  // Get own hotel deletion requests (HotelOwner)
  @Get('deletion-requests/mine')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HotelOwner', 'Admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get own hotel deletion requests',
    description: 'Retrieve all hotel deletion requests submitted by the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Hotel deletion requests retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getOwnHotelDeletionRequests(@Request() req) {
    return this.hotelService.getHotelDeletionRequestsByOwner(req.user.userId);
  }

  // Get hotel deletion request by ID (Admin)
  @Get('deletion-requests/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get hotel deletion request by ID (Admin only)',
    description: 'Get detailed information about a specific hotel deletion request.',
  })
  @ApiParam({ name: 'id', description: 'Hotel deletion request UUID' })
  @ApiResponse({
    status: 200,
    description: 'Hotel deletion request details retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required' })
  @ApiResponse({ status: 404, description: 'Hotel deletion request not found' })
  getHotelDeletionRequestById(@Param('id') id: string) {
    return this.hotelService.getHotelDeletionRequestById(id);
  }

  // Review hotel deletion request (Admin only)
  @Patch('deletion-requests/:id/review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Review hotel deletion request (Admin only)',
    description:
      'Approve or reject a hotel deletion request. If approved, the hotel will be deactivated (soft delete).',
  })
  @ApiParam({ name: 'id', description: 'Hotel deletion request UUID' })
  @ApiBody({ type: ReviewHotelDeletionRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Hotel deletion request reviewed successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required' })
  @ApiResponse({ status: 404, description: 'Hotel deletion request not found' })
  reviewHotelDeletionRequest(
    @Param('id') id: string,
    @Body() reviewDto: ReviewHotelDeletionRequestDto,
    @Request() req,
  ) {
    return this.hotelService.reviewHotelDeletionRequest(
      id,
      reviewDto,
      req.user.userId,
    );
  }

  // Get hotel details for public (Public)
  @Get(':id/public')
  @ApiOperation({
    summary: 'Get public hotel details',
    description:
      'Get detailed hotel information for public viewing. No authentication required.',
  })
  @ApiParam({ name: 'id', description: 'Hotel UUID' })
  @ApiResponse({
    status: 200,
    description: 'Hotel details retrieved successfully',
    schema: {
      example: {
        id: 'uuid-string',
        name: 'Grand Saigon Hotel',
        description: 'A luxurious 5-star hotel...',
        address: '123 Nguyen Hue Boulevard',
        city: 'Ho Chi Minh City',
        avg_rating: 4.5,
        total_reviews: 123,
        amenities: [
          { id: 'uuid', name: 'Free WiFi', category: 'Technology' },
          { id: 'uuid', name: 'Swimming Pool', category: 'Recreation' },
        ],
        rooms: [{ id: 'uuid', room_type: 'Deluxe King', max_occupancy: 2 }],
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Hotel not found' })
  getPublicHotelDetails(@Param('id') id: string) {
    return this.hotelService.findOneForPublic(id);
  }

  // Get hotel details (Owner/Admin)
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, HotelOwnershipGuard)
  @Roles('HotelOwner', 'Admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get hotel details (Owner/Admin)',
    description:
      'Get detailed hotel information including management data. Requires ownership or admin role.',
  })
  @ApiParam({ name: 'id', description: 'Hotel UUID' })
  @ApiResponse({
    status: 200,
    description: 'Hotel details retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not owner or admin' })
  @ApiResponse({ status: 404, description: 'Hotel not found' })
  findOne(@Param('id') id: string) {
    return this.hotelService.findOne(id);
  }

  // Update hotel (Owner/Admin)
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, HotelOwnershipGuard)
  @Roles('HotelOwner', 'Admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update hotel',
    description:
      'Update hotel information. Only the owner or admin can update hotel details.',
  })
  @ApiParam({ name: 'id', description: 'Hotel UUID' })
  @ApiBody({ type: UpdateHotelDto })
  @ApiResponse({ status: 200, description: 'Hotel updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not owner or admin' })
  @ApiResponse({ status: 404, description: 'Hotel not found' })
  update(
    @Param('id') id: string,
    @Body() updateHotelDto: UpdateHotelDto,
    @Request() req,
  ) {
    return this.hotelService.update(
      id,
      updateHotelDto,
      req.user.userId,
      req.user.roles,
    );
  }

  // Delete hotel (Owner/Admin)
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, HotelOwnershipGuard)
  @Roles('HotelOwner', 'Admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete hotel',
    description:
      'Permanently delete a hotel. Only the owner or admin can delete hotels.',
  })
  @ApiParam({ name: 'id', description: 'Hotel UUID' })
  @ApiResponse({ status: 200, description: 'Hotel deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not owner or admin' })
  @ApiResponse({ status: 404, description: 'Hotel not found' })
  remove(@Param('id') id: string, @Request() req) {
    return this.hotelService.delete(id, req.user.userId, req.user.roles);
  }

  // Admin-only endpoints
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all hotels (Admin only)',
    description: 'Retrieve all hotels in the system. Admin access only.',
  })
  @ApiResponse({
    status: 200,
    description: 'All hotels retrieved successfully',
    schema: {
      type: 'array',
      items: { type: 'object' },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - admin access required',
  })
  findAll() {
    return this.hotelService.findAll();
  }

  // Health check endpoint
  @Get('health')
  @ApiOperation({
    summary: 'Hotel service health check',
    description:
      'Check the health status of the hotel service for monitoring purposes.',
  })
  @ApiResponse({
    status: 200,
    description: 'Health check completed',
    schema: {
      example: {
        status: 'healthy',
        details: {
          totalHotels: 150,
          activeHotels: 142,
          timestamp: '2024-01-15T10:30:00Z',
        },
      },
    },
  })
  healthCheck() {
    return this.hotelService.healthCheck();
  }
}
