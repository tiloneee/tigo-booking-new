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
exports.HotelOwnershipGuard = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const hotel_entity_1 = require("../entities/hotel.entity");
let HotelOwnershipGuard = class HotelOwnershipGuard {
    hotelRepository;
    constructor(hotelRepository) {
        this.hotelRepository = hotelRepository;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const hotelId = request.params.id;
        if (user.roles && user.roles.includes('Admin')) {
            return true;
        }
        if (user.roles && user.roles.includes('HotelOwner')) {
            const hotel = await this.hotelRepository.findOne({
                where: { id: hotelId },
            });
            if (!hotel) {
                throw new common_1.NotFoundException('Hotel not found');
            }
            return hotel.owner_id === user.userId;
        }
        return false;
    }
};
exports.HotelOwnershipGuard = HotelOwnershipGuard;
exports.HotelOwnershipGuard = HotelOwnershipGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(hotel_entity_1.Hotel)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], HotelOwnershipGuard);
//# sourceMappingURL=hotel-ownership.guard.js.map