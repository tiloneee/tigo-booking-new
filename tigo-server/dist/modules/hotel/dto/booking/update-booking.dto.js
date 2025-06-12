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
exports.UpdateBookingDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_booking_dto_1 = require("./create-booking.dto");
const class_validator_1 = require("class-validator");
class UpdateBookingDto extends (0, mapped_types_1.PartialType)((0, mapped_types_1.OmitType)(create_booking_dto_1.CreateBookingDto, ['hotel_id', 'room_id'])) {
    status;
    payment_status;
    cancellation_reason;
    admin_notes;
    confirmed_at;
    cancelled_at;
}
exports.UpdateBookingDto = UpdateBookingDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)([
        'Pending',
        'Confirmed',
        'Cancelled',
        'Completed',
        'CheckedIn',
        'CheckedOut',
        'NoShow',
    ]),
    __metadata("design:type", String)
], UpdateBookingDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['Pending', 'Paid', 'Refunded', 'PartialRefund', 'Failed']),
    __metadata("design:type", String)
], UpdateBookingDto.prototype, "payment_status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 500),
    __metadata("design:type", String)
], UpdateBookingDto.prototype, "cancellation_reason", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 500),
    __metadata("design:type", String)
], UpdateBookingDto.prototype, "admin_notes", void 0);
//# sourceMappingURL=update-booking.dto.js.map