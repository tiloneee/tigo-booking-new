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
exports.HotelReview = void 0;
const typeorm_1 = require("typeorm");
const hotel_entity_1 = require("./hotel.entity");
const hotel_booking_entity_1 = require("./hotel-booking.entity");
const user_entity_1 = require("../../user/entities/user.entity");
let HotelReview = class HotelReview {
    id;
    rating;
    comment;
    title;
    cleanliness_rating;
    location_rating;
    service_rating;
    value_rating;
    is_verified_stay;
    stay_date;
    is_approved;
    moderation_notes;
    helpful_votes;
    total_votes;
    hotel;
    hotel_id;
    user;
    user_id;
    booking;
    booking_id;
    created_at;
    updated_at;
};
exports.HotelReview = HotelReview;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], HotelReview.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', width: 1 }),
    __metadata("design:type", Number)
], HotelReview.prototype, "rating", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], HotelReview.prototype, "comment", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200, nullable: true }),
    __metadata("design:type", String)
], HotelReview.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', width: 1, nullable: true }),
    __metadata("design:type", Number)
], HotelReview.prototype, "cleanliness_rating", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', width: 1, nullable: true }),
    __metadata("design:type", Number)
], HotelReview.prototype, "location_rating", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', width: 1, nullable: true }),
    __metadata("design:type", Number)
], HotelReview.prototype, "service_rating", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', width: 1, nullable: true }),
    __metadata("design:type", Number)
], HotelReview.prototype, "value_rating", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], HotelReview.prototype, "is_verified_stay", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], HotelReview.prototype, "stay_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], HotelReview.prototype, "is_approved", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], HotelReview.prototype, "moderation_notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], HotelReview.prototype, "helpful_votes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], HotelReview.prototype, "total_votes", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => hotel_entity_1.Hotel, (hotel) => hotel.reviews),
    (0, typeorm_1.JoinColumn)({ name: 'hotel_id' }),
    __metadata("design:type", hotel_entity_1.Hotel)
], HotelReview.prototype, "hotel", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], HotelReview.prototype, "hotel_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], HotelReview.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], HotelReview.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => hotel_booking_entity_1.HotelBooking, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'booking_id' }),
    __metadata("design:type", hotel_booking_entity_1.HotelBooking)
], HotelReview.prototype, "booking", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Object)
], HotelReview.prototype, "booking_id", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], HotelReview.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], HotelReview.prototype, "updated_at", void 0);
exports.HotelReview = HotelReview = __decorate([
    (0, typeorm_1.Entity)('hotel_reviews'),
    (0, typeorm_1.Unique)(['hotel_id', 'user_id'])
], HotelReview);
//# sourceMappingURL=hotel-review.entity.js.map