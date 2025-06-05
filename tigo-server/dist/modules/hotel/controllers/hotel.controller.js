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
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../../common/guards/roles.guard");
const roles_decorator_1 = require("../../../common/decorators/roles.decorator");
const hotel_ownership_guard_1 = require("../guards/hotel-ownership.guard");
const hotel_service_1 = require("../services/hotel.service");
const create_hotel_dto_1 = require("../dto/hotel/create-hotel.dto");
const update_hotel_dto_1 = require("../dto/hotel/update-hotel.dto");
const search_hotel_dto_1 = require("../dto/hotel/search-hotel.dto");
let HotelController = class HotelController {
    hotelService;
    constructor(hotelService) {
        this.hotelService = hotelService;
    }
    create(createHotelDto, req) {
        return this.hotelService.create(createHotelDto, req.user.userId);
    }
    getMyHotels(req) {
        return this.hotelService.findByOwner(req.user.userId);
    }
    search(searchDto) {
        return this.hotelService.search(searchDto);
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
};
exports.HotelController = HotelController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('HotelOwner', 'Admin'),
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
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], HotelController.prototype, "getMyHotels", null);
__decorate([
    (0, common_1.Get)('search'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [search_hotel_dto_1.SearchHotelDto]),
    __metadata("design:returntype", void 0)
], HotelController.prototype, "search", null);
__decorate([
    (0, common_1.Get)(':id/public'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], HotelController.prototype, "getPublicHotelDetails", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, hotel_ownership_guard_1.HotelOwnershipGuard),
    (0, roles_decorator_1.Roles)('HotelOwner', 'Admin'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], HotelController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, hotel_ownership_guard_1.HotelOwnershipGuard),
    (0, roles_decorator_1.Roles)('HotelOwner', 'Admin'),
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
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HotelController.prototype, "findAll", null);
exports.HotelController = HotelController = __decorate([
    (0, common_1.Controller)('hotels'),
    __metadata("design:paramtypes", [hotel_service_1.HotelService])
], HotelController);
//# sourceMappingURL=hotel.controller.js.map