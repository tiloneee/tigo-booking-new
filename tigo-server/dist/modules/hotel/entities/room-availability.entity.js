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
exports.RoomAvailability = void 0;
const typeorm_1 = require("typeorm");
const room_entity_1 = require("./room.entity");
let RoomAvailability = class RoomAvailability {
    id;
    date;
    price_per_night;
    available_units;
    status;
    total_units;
    room;
    room_id;
    created_at;
    updated_at;
};
exports.RoomAvailability = RoomAvailability;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], RoomAvailability.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", String)
], RoomAvailability.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], RoomAvailability.prototype, "price_per_night", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], RoomAvailability.prototype, "available_units", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['Available', 'Booked', 'Maintenance', 'Blocked'],
        default: 'Available',
    }),
    __metadata("design:type", String)
], RoomAvailability.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], RoomAvailability.prototype, "total_units", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => room_entity_1.Room, (room) => room.availability, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'room_id' }),
    __metadata("design:type", room_entity_1.Room)
], RoomAvailability.prototype, "room", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], RoomAvailability.prototype, "room_id", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], RoomAvailability.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], RoomAvailability.prototype, "updated_at", void 0);
exports.RoomAvailability = RoomAvailability = __decorate([
    (0, typeorm_1.Entity)('room_availability'),
    (0, typeorm_1.Unique)(['room_id', 'date']),
    (0, typeorm_1.Index)(['room_id', 'date', 'status']),
    (0, typeorm_1.Index)(['date', 'available_units', 'status']),
    (0, typeorm_1.Index)(['price_per_night', 'status']),
    (0, typeorm_1.Index)(['room_id', 'date', 'available_units'])
], RoomAvailability);
//# sourceMappingURL=room-availability.entity.js.map