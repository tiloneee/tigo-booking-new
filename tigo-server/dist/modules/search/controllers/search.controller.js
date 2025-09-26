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
exports.SearchController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const search_service_1 = require("../services/search.service");
const index_management_service_1 = require("../services/index-management.service");
const hotel_search_service_1 = require("../services/hotel-search.service");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../../common/guards/roles.guard");
const roles_decorator_1 = require("../../../common/decorators/roles.decorator");
let SearchController = class SearchController {
    searchService;
    indexManagementService;
    hotelSearchService;
    constructor(searchService, indexManagementService, hotelSearchService) {
        this.searchService = searchService;
        this.indexManagementService = indexManagementService;
        this.hotelSearchService = hotelSearchService;
    }
    async healthCheck() {
        return this.searchService.healthCheck();
    }
    async createIndices() {
        await this.indexManagementService.createAllIndices();
        return { message: 'All indices created successfully' };
    }
    async deleteIndex(indexName) {
        await this.indexManagementService.deleteIndex(indexName);
        return { message: `Index ${indexName} deleted successfully` };
    }
    async getIndexStats(indexName) {
        return this.indexManagementService.getIndexStats(indexName);
    }
    async searchHotels(searchQuery) {
        return this.hotelSearchService.searchHotels(searchQuery);
    }
    async getAutocompleteSuggestions(query, limit) {
        return this.hotelSearchService.getAutocompleteSuggestions(query, limit);
    }
};
exports.SearchController = SearchController;
__decorate([
    (0, common_1.Get)('health'),
    (0, swagger_1.ApiOperation)({ summary: 'Check Elasticsearch cluster health' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Elasticsearch health status' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "healthCheck", null);
__decorate([
    (0, common_1.Post)('admin/indices/create'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('Admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create all search indices (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Indices created successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "createIndices", null);
__decorate([
    (0, common_1.Delete)('admin/indices/:indexName'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('Admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a specific index (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Index deleted successfully' }),
    __param(0, (0, common_1.Param)('indexName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "deleteIndex", null);
__decorate([
    (0, common_1.Get)('admin/indices/:indexName/stats'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('Admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get index statistics (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Index statistics' }),
    __param(0, (0, common_1.Param)('indexName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "getIndexStats", null);
__decorate([
    (0, common_1.Get)('hotels'),
    (0, swagger_1.ApiOperation)({ summary: 'Search hotels with advanced filters' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Hotel search results with pagination and aggregations',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'query',
        required: false,
        description: 'Search term for hotel name, description, or location',
    }),
    (0, swagger_1.ApiQuery)({ name: 'city', required: false, description: 'Filter by city' }),
    (0, swagger_1.ApiQuery)({
        name: 'latitude',
        required: false,
        type: Number,
        description: 'Latitude for geo search',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'longitude',
        required: false,
        type: Number,
        description: 'Longitude for geo search',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'radius_km',
        required: false,
        type: Number,
        description: 'Search radius in kilometers (default: 50)',
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
        type: Number,
        description: 'Number of guests',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'amenity_ids',
        required: false,
        type: [String],
        description: 'Array of amenity IDs to filter by',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'min_price',
        required: false,
        type: Number,
        description: 'Minimum price per night',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'max_price',
        required: false,
        type: Number,
        description: 'Maximum price per night',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'min_rating',
        required: false,
        type: Number,
        description: 'Minimum average rating',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'room_type',
        required: false,
        description: 'Filter by room type',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'sort_by',
        required: false,
        enum: ['price', 'rating', 'distance', 'name', 'relevance'],
        description: 'Sort field',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'sort_order',
        required: false,
        enum: ['ASC', 'DESC'],
        description: 'Sort order',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'page',
        required: false,
        type: Number,
        description: 'Page number (default: 1)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'limit',
        required: false,
        type: Number,
        description: 'Results per page (default: 10)',
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "searchHotels", null);
__decorate([
    (0, common_1.Get)('hotels/autocomplete'),
    (0, swagger_1.ApiOperation)({ summary: 'Get autocomplete suggestions for hotel search' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Autocomplete suggestions' }),
    (0, swagger_1.ApiQuery)({
        name: 'q',
        required: true,
        description: 'Search query for suggestions',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'limit',
        required: false,
        type: Number,
        description: 'Maximum number of suggestions (default: 10)',
    }),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "getAutocompleteSuggestions", null);
exports.SearchController = SearchController = __decorate([
    (0, swagger_1.ApiTags)('Search'),
    (0, common_1.Controller)('search'),
    __metadata("design:paramtypes", [search_service_1.SearchService,
        index_management_service_1.IndexManagementService,
        hotel_search_service_1.HotelSearchService])
], SearchController);
//# sourceMappingURL=search.controller.js.map