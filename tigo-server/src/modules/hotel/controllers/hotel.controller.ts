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

@ApiTags('Hotels')
@Controller('hotels')
export class HotelController {
  constructor(private readonly hotelService: HotelService) {}

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
  search(@Query() searchDto: SearchHotelDto) {
    return this.hotelService.search(searchDto);
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
