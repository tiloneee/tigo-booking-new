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
exports.HotelRoomController = exports.RoomController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../../common/guards/roles.guard");
const roles_decorator_1 = require("../../../common/decorators/roles.decorator");
const room_service_1 = require("../services/room.service");
const create_room_dto_1 = require("../dto/room/create-room.dto");
const update_room_dto_1 = require("../dto/room/update-room.dto");
const room_availability_dto_1 = require("../dto/room/room-availability.dto");
let RoomController = class RoomController {
    roomService;
    constructor(roomService) {
        this.roomService = roomService;
    }
    create(createRoomDto, req) {
        return this.roomService.create(createRoomDto, req.user.userId, req.user.roles);
    }
    findOne(id) {
        return this.roomService.findOne(id);
    }
    update(id, updateRoomDto, req) {
        return this.roomService.update(id, updateRoomDto, req.user.userId, req.user.roles);
    }
    remove(id, req) {
        return this.roomService.delete(id, req.user.userId, req.user.roles);
    }
    createAvailability(roomId, createAvailabilityDto, req) {
        createAvailabilityDto.room_id = roomId;
        return this.roomService.createAvailability(createAvailabilityDto, req.user.userId, req.user.roles);
    }
    createBulkAvailability(roomId, bulkAvailabilityDto, req) {
        bulkAvailabilityDto.room_id = roomId;
        return this.roomService.createBulkAvailability(bulkAvailabilityDto, req.user.userId, req.user.roles);
    }
    updateAvailability(roomId, date, updateAvailabilityDto, req) {
        return this.roomService.updateAvailability(roomId, date, updateAvailabilityDto, req.user.userId, req.user.roles);
    }
    getAvailability(roomId, startDate, endDate) {
        return this.roomService.getAvailability(roomId, startDate, endDate);
    }
    checkAvailability(roomId, checkInDate, checkOutDate, units = '1') {
        return this.roomService.checkAvailability(roomId, checkInDate, checkOutDate, parseInt(units));
    }
    getPricingBreakdown(roomId, checkInDate, checkOutDate) {
        return this.roomService.getPricingBreakdown(roomId, checkInDate, checkOutDate);
    }
};
exports.RoomController = RoomController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('HotelOwner', 'Admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_room_dto_1.CreateRoomDto, Object]),
    __metadata("design:returntype", void 0)
], RoomController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('HotelOwner', 'Admin'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RoomController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('HotelOwner', 'Admin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_room_dto_1.UpdateRoomDto, Object]),
    __metadata("design:returntype", void 0)
], RoomController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('HotelOwner', 'Admin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RoomController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/availability'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('HotelOwner', 'Admin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, room_availability_dto_1.CreateRoomAvailabilityDto, Object]),
    __metadata("design:returntype", void 0)
], RoomController.prototype, "createAvailability", null);
__decorate([
    (0, common_1.Post)(':id/availability/bulk'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('HotelOwner', 'Admin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, room_availability_dto_1.BulkRoomAvailabilityDto, Object]),
    __metadata("design:returntype", void 0)
], RoomController.prototype, "createBulkAvailability", null);
__decorate([
    (0, common_1.Patch)(':id/availability/:date'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('HotelOwner', 'Admin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('date')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, room_availability_dto_1.UpdateRoomAvailabilityDto, Object]),
    __metadata("design:returntype", void 0)
], RoomController.prototype, "updateAvailability", null);
__decorate([
    (0, common_1.Get)(':id/availability'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('start_date')),
    __param(2, (0, common_1.Query)('end_date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], RoomController.prototype, "getAvailability", null);
__decorate([
    (0, common_1.Get)(':id/availability/check'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('check_in_date')),
    __param(2, (0, common_1.Query)('check_out_date')),
    __param(3, (0, common_1.Query)('units')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], RoomController.prototype, "checkAvailability", null);
__decorate([
    (0, common_1.Get)(':id/pricing-breakdown'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('check_in_date')),
    __param(2, (0, common_1.Query)('check_out_date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], RoomController.prototype, "getPricingBreakdown", null);
exports.RoomController = RoomController = __decorate([
    (0, common_1.Controller)('rooms'),
    __metadata("design:paramtypes", [room_service_1.RoomService])
], RoomController);
let HotelRoomController = class HotelRoomController {
    roomService;
    constructor(roomService) {
        this.roomService = roomService;
    }
    async findPublicRoomsByHotel(hotelId, checkInDate, checkOutDate, numberOfGuests) {
        return this.roomService.findPublicRoomsByHotel(hotelId, checkInDate, checkOutDate, numberOfGuests ? parseInt(numberOfGuests) : undefined);
    }
    findAllByHotel(hotelId, req) {
        return this.roomService.findByHotel(hotelId, req.user.userId, req.user.roles);
    }
    createForHotel(hotelId, createRoomDto, req) {
        if (!hotelId ||
            !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(hotelId)) {
            throw new common_1.BadRequestException('Invalid hotel ID in URL parameter');
        }
        createRoomDto.hotel_id = hotelId;
        return this.roomService.create(createRoomDto, req.user.userId, req.user.roles);
    }
};
exports.HotelRoomController = HotelRoomController;
__decorate([
    (0, common_1.Get)('public'),
    __param(0, (0, common_1.Param)('hotelId')),
    __param(1, (0, common_1.Query)('check_in_date')),
    __param(2, (0, common_1.Query)('check_out_date')),
    __param(3, (0, common_1.Query)('number_of_guests')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], HotelRoomController.prototype, "findPublicRoomsByHotel", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('HotelOwner', 'Admin'),
    __param(0, (0, common_1.Param)('hotelId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], HotelRoomController.prototype, "findAllByHotel", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('HotelOwner', 'Admin'),
    __param(0, (0, common_1.Param)('hotelId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_room_dto_1.CreateRoomDto, Object]),
    __metadata("design:returntype", void 0)
], HotelRoomController.prototype, "createForHotel", null);
exports.HotelRoomController = HotelRoomController = __decorate([
    (0, common_1.Controller)('hotels/:hotelId/rooms'),
    __metadata("design:paramtypes", [room_service_1.RoomService])
], HotelRoomController);
//# sourceMappingURL=room.controller.js.map