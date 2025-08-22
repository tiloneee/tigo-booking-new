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
exports.CreateChatRoomDto = void 0;
const class_validator_1 = require("class-validator");
const chat_room_entity_1 = require("../entities/chat-room.entity");
class CreateChatRoomDto {
    type;
    participant1_id;
    participant2_id;
    hotel_id;
}
exports.CreateChatRoomDto = CreateChatRoomDto;
__decorate([
    (0, class_validator_1.IsEnum)(chat_room_entity_1.ChatRoomType),
    __metadata("design:type", String)
], CreateChatRoomDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateChatRoomDto.prototype, "participant1_id", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateChatRoomDto.prototype, "participant2_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateChatRoomDto.prototype, "hotel_id", void 0);
//# sourceMappingURL=create-chat-room.dto.js.map