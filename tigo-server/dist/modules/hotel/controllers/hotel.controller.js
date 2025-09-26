"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HotelController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../../common/guards/roles.guard");
const roles_decorator_1 = require("../../../common/decorators/roles.decorator");
const hotel_ownership_guard_1 = require("../guards/hotel-ownership.guard");
const hotel_service_1 = require("../services/hotel.service");
const create_hotel_dto_1 = require("../dto/hotel/create-hotel.dto");
const update_hotel_dto_1 = require("../dto/hotel/update-hotel.dto");
const search_hotel_dto_1 = require("../dto/hotel/search-hotel.dto");
const hotel_search_service_1 = require("../../search/services/hotel-search.service");
let HotelController = class HotelController {
    hotelService;
    hotelSearchService;
    constructor(hotelService, hotelSearchService) {
        this.hotelService = hotelService;
        this.hotelSearchService = hotelSearchService;
    }
    create(createHotelDto, req) {
        return this.hotelService.create(createHotelDto, req.user.userId);
    }
    getMyHotels(req) {
        return this.hotelService.findByOwner(req.user.userId);
    }
    async getAllHotelsPublic(page, limit, sortBy, sortOrder) {
        const searchDto = {
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 12,
            sort_by: sortBy || 'name',
            sort_order: sortOrder || 'ASC',
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
    async search(searchDto) {
        const searchQuery = {
            query: searchDto.city,
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
            sort_by: searchDto.sort_by || 'relevance',
            sort_order: searchDto.sort_order || 'DESC',
            page: searchDto.page || 1,
            limit: searchDto.limit || 10,
        };
        return this.hotelSearchService.searchHotels(searchQuery);
    }
    getPublicHotelDetails(id) {
        return this.hotelService.findOneForPublic(id);
    }
    findOne(id) {
        return this.hotelService.findOne(id);
    }
    update(id, updateHotelDto, req) {
        return this.hotelService.update(id, updateHotelDto, req.user.userId, req.user.roles);
    }
    remove(id, req) {
        return this.hotelService.delete(id, req.user.userId, req.user.roles);
    }
    findAll() {
        return this.hotelService.findAll();
    }
    healthCheck() {
        return this.hotelService.healthCheck();
    }
};
exports.HotelController = HotelController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('HotelOwner', 'Admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Create a new hotel',
        description: 'Create a new hotel listing. Only hotel owners and admins can create hotels.',
    }),
    (0, swagger_1.ApiBody)({ type: create_hotel_dto_1.CreateHotelDto }),
    (0, swagger_1.ApiResponse)({
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
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request - validation failed' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden - insufficient permissions',
    }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Conflict - hotel already exists' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_hotel_dto_1.CreateHotelDto, Object]),
    __metadata("design:returntype", void 0)
], HotelController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('mine'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('HotelOwner', 'Admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get own hotels',
        description: 'Retrieve all hotels owned by the authenticated user.',
    }),
    (0, swagger_1.ApiResponse)({
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
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], HotelController.prototype, "getMyHotels", null);
__decorate([
    (0, common_1.Get)('all'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get all hotels (Public)',
        description: 'Retrieve all active hotels without search filters. This endpoint is public and does not require authentication.',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'page',
        required: false,
        description: 'Page number (default: 1)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'limit',
        required: false,
        description: 'Number of hotels per page (default: 12)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'sort_by',
        required: false,
        description: 'Sort by: name, rating (default: name)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'sort_order',
        required: false,
        description: 'Sort order: ASC, DESC (default: ASC)',
    }),
    (0, swagger_1.ApiResponse)({
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
    }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('sort_by')),
    __param(3, (0, common_1.Query)('sort_order')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], HotelController.prototype, "getAllHotelsPublic", null);
__decorate([
    (0, common_1.Get)('search'),
    (0, swagger_1.ApiOperation)({
        summary: 'Search hotels (Public)',
        description: 'Search for hotels with various filters. This endpoint is public and does not require authentication.',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'city',
        required: false,
        description: 'City name to search in',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'check_in_date',
        required: false,
        description: 'Check-in date (YYYY-MM-DD)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'check_out_date',
        required: false,
        description: 'Check-out date (YYYY-MM-DD)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'number_of_guests',
        required: false,
        description: 'Number of guests',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'min_price',
        required: false,
        description: 'Minimum price per night',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'max_price',
        required: false,
        description: 'Maximum price per night',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'min_rating',
        required: false,
        description: 'Minimum rating (1-5)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'latitude',
        required: false,
        description: 'Latitude for geospatial search',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'longitude',
        required: false,
        description: 'Longitude for geospatial search',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'radius_km',
        required: false,
        description: 'Search radius in kilometers',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'sort_by',
        required: false,
        enum: ['price', 'rating', 'distance', 'name'],
    }),
    (0, swagger_1.ApiQuery)({ name: 'sort_order', required: false, enum: ['ASC', 'DESC'] }),
    (0, swagger_1.ApiQuery)({
        name: 'page',
        required: false,
        description: 'Page number (default: 1)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'limit',
        required: false,
        description: 'Items per page (default: 10, max: 100)',
    }),
    (0, swagger_1.ApiResponse)({
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
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [search_hotel_dto_1.SearchHotelDto]),
    __metadata("design:returntype", Promise)
], HotelController.prototype, "search", null);
__decorate([
    (0, common_1.Get)(':id/public'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get public hotel details',
        description: 'Get detailed hotel information for public viewing. No authentication required.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Hotel UUID' }),
    (0, swagger_1.ApiResponse)({
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
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Hotel not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], HotelController.prototype, "getPublicHotelDetails", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, hotel_ownership_guard_1.HotelOwnershipGuard),
    (0, roles_decorator_1.Roles)('HotelOwner', 'Admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get hotel details (Owner/Admin)',
        description: 'Get detailed hotel information including management data. Requires ownership or admin role.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Hotel UUID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Hotel details retrieved successfully',
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - not owner or admin' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Hotel not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], HotelController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, hotel_ownership_guard_1.HotelOwnershipGuard),
    (0, roles_decorator_1.Roles)('HotelOwner', 'Admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Update hotel',
        description: 'Update hotel information. Only the owner or admin can update hotel details.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Hotel UUID' }),
    (0, swagger_1.ApiBody)({ type: update_hotel_dto_1.UpdateHotelDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Hotel updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request - validation failed' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - not owner or admin' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Hotel not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_hotel_dto_1.UpdateHotelDto, Object]),
    __metadata("design:returntype", void 0)
], HotelController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, hotel_ownership_guard_1.HotelOwnershipGuard),
    (0, roles_decorator_1.Roles)('HotelOwner', 'Admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Delete hotel',
        description: 'Permanently delete a hotel. Only the owner or admin can delete hotels.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Hotel UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Hotel deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - not owner or admin' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Hotel not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], HotelController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('Admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get all hotels (Admin only)',
        description: 'Retrieve all hotels in the system. Admin access only.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'All hotels retrieved successfully',
        schema: {
            type: 'array',
            items: { type: 'object' },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden - admin access required',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HotelController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('health'),
    (0, swagger_1.ApiOperation)({
        summary: 'Hotel service health check',
        description: 'Check the health status of the hotel service for monitoring purposes.',
    }),
    (0, swagger_1.ApiResponse)({
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
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HotelController.prototype, "healthCheck", null);
exports.HotelController = HotelController = __decorate([
    (0, swagger_1.ApiTags)('Hotels'),
    (0, common_1.Controller)('hotels'),
    __metadata("design:paramtypes", [hotel_service_1.HotelService,
        hotel_search_service_1.HotelSearchService])
], HotelController);
//# sourceMappingURL=hotel.controller.js.map