"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HotelModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const hotel_entity_1 = require("./entities/hotel.entity");
const hotel_amenity_entity_1 = require("./entities/hotel-amenity.entity");
const room_entity_1 = require("./entities/room.entity");
const room_availability_entity_1 = require("./entities/room-availability.entity");
const hotel_booking_entity_1 = require("./entities/hotel-booking.entity");
const hotel_review_entity_1 = require("./entities/hotel-review.entity");
const hotel_service_1 = require("./services/hotel.service");
const room_service_1 = require("./services/room.service");
const geocoding_service_1 = require("./services/geocoding.service");
const hotel_controller_1 = require("./controllers/hotel.controller");
const room_controller_1 = require("./controllers/room.controller");
const hotel_ownership_guard_1 = require("./guards/hotel-ownership.guard");
let HotelModule = class HotelModule {
};
exports.HotelModule = HotelModule;
exports.HotelModule = HotelModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                hotel_entity_1.Hotel,
                hotel_amenity_entity_1.HotelAmenity,
                room_entity_1.Room,
                room_availability_entity_1.RoomAvailability,
                hotel_booking_entity_1.HotelBooking,
                hotel_review_entity_1.HotelReview,
            ]),
        ],
        controllers: [
            hotel_controller_1.HotelController,
            room_controller_1.RoomController,
            room_controller_1.HotelRoomController,
        ],
        providers: [
            hotel_service_1.HotelService,
            room_service_1.RoomService,
            geocoding_service_1.GeocodingService,
            hotel_ownership_guard_1.HotelOwnershipGuard,
        ],
        exports: [
            hotel_service_1.HotelService,
            room_service_1.RoomService,
            geocoding_service_1.GeocodingService,
            typeorm_1.TypeOrmModule,
        ],
    })
], HotelModule);
//# sourceMappingURL=hotel.module.js.map