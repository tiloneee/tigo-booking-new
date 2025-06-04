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
const user_entity_1 = require("../../user/entities/user.entity");
let HotelReview = class HotelReview {
    id;
    rating;
    comment;
    hotel;
    hotel_id;
    user;
    user_id;
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
    (0, typeorm_1.ManyToOne)(() => hotel_entity_1.Hotel, hotel => hotel.reviews),
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
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], HotelReview.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], HotelReview.prototype, "updated_at", void 0);
exports.HotelReview = HotelReview = __decorate([
    (0, typeorm_1.Entity)('hotel_reviews')
], HotelReview);
//# sourceMappingURL=hotel-review.entity.js.map