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
const user_entity_1 = require("../user/entities/user.entity");
const search_module_1 = require("../search/search.module");
const hotel_service_1 = require("./services/hotel.service");
const room_service_1 = require("./services/room.service");
const geocoding_service_1 = require("./services/geocoding.service");
const booking_service_1 = require("./services/booking.service");
const amenity_service_1 = require("./services/amenity.service");
const review_service_1 = require("./services/review.service");
const hotel_controller_1 = require("./controllers/hotel.controller");
const room_controller_1 = require("./controllers/room.controller");
const booking_controller_1 = require("./controllers/booking.controller");
const amenity_controller_1 = require("./controllers/amenity.controller");
const review_controller_1 = require("./controllers/review.controller");
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
                user_entity_1.User,
            ]),
            search_module_1.SearchModule,
        ],
        controllers: [
            hotel_controller_1.HotelController,
            room_controller_1.RoomController,
            room_controller_1.HotelRoomController,
            booking_controller_1.BookingController,
            booking_controller_1.HotelBookingController,
            amenity_controller_1.AmenityController,
            review_controller_1.ReviewController,
            review_controller_1.HotelReviewController,
        ],
        providers: [
            hotel_service_1.HotelService,
            room_service_1.RoomService,
            geocoding_service_1.GeocodingService,
            booking_service_1.BookingService,
            amenity_service_1.AmenityService,
            review_service_1.ReviewService,
            hotel_ownership_guard_1.HotelOwnershipGuard,
        ],
        exports: [
            hotel_service_1.HotelService,
            room_service_1.RoomService,
            geocoding_service_1.GeocodingService,
            booking_service_1.BookingService,
            amenity_service_1.AmenityService,
            review_service_1.ReviewService,
            typeorm_1.TypeOrmModule,
        ],
    })
], HotelModule);
//# sourceMappingURL=hotel.module.js.map