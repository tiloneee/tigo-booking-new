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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Hotel = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../user/entities/user.entity");
const room_entity_1 = require("./room.entity");
const hotel_booking_entity_1 = require("./hotel-booking.entity");
const hotel_review_entity_1 = require("./hotel-review.entity");
const hotel_amenity_entity_1 = require("./hotel-amenity.entity");
let Hotel = class Hotel {
    id;
    name;
    description;
    address;
    city;
    state;
    zip_code;
    country;
    phone_number;
    latitude;
    longitude;
    avg_rating;
    total_reviews;
    is_active;
    owner;
    owner_id;
    rooms;
    bookings;
    reviews;
    amenities;
    created_at;
    updated_at;
};
exports.Hotel = Hotel;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Hotel.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200 }),
    __metadata("design:type", String)
], Hotel.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Hotel.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500 }),
    __metadata("design:type", String)
], Hotel.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], Hotel.prototype, "city", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], Hotel.prototype, "state", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20 }),
    __metadata("design:type", String)
], Hotel.prototype, "zip_code", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], Hotel.prototype, "country", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20 }),
    __metadata("design:type", String)
], Hotel.prototype, "phone_number", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 8, nullable: true }),
    __metadata("design:type", Object)
], Hotel.prototype, "latitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 11, scale: 8, nullable: true }),
    __metadata("design:type", Object)
], Hotel.prototype, "longitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 3, scale: 2, default: 0.0 }),
    __metadata("design:type", Number)
], Hotel.prototype, "avg_rating", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Hotel.prototype, "total_reviews", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Hotel.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { eager: true }),
    (0, typeorm_1.JoinColumn)({ name: 'owner_id' }),
    __metadata("design:type", user_entity_1.User)
], Hotel.prototype, "owner", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Hotel.prototype, "owner_id", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => room_entity_1.Room, room => room.hotel, { cascade: true }),
    __metadata("design:type", Array)
], Hotel.prototype, "rooms", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => hotel_booking_entity_1.HotelBooking, booking => booking.hotel),
    __metadata("design:type", Array)
], Hotel.prototype, "bookings", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => hotel_review_entity_1.HotelReview, review => review.hotel),
    __metadata("design:type", Array)
], Hotel.prototype, "reviews", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => hotel_amenity_entity_1.HotelAmenity, amenity => amenity.hotels),
    (0, typeorm_1.JoinTable)({
        name: 'hotel_amenity_mappings',
        joinColumn: { name: 'hotel_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'amenity_id', referencedColumnName: 'id' },
    }),
    __metadata("design:type", Array)
], Hotel.prototype, "amenities", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Hotel.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Hotel.prototype, "updated_at", void 0);
exports.Hotel = Hotel = __decorate([
    (0, typeorm_1.Entity)('hotels')
], Hotel);
//# sourceMappingURL=hotel.entity.js.map