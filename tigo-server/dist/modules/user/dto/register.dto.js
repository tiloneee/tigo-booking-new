"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_user_dto_1 = require("./create-user.dto");
class RegisterDto extends (0, mapped_types_1.OmitType)(create_user_dto_1.CreateUserDto, ['role']) {
}
exports.RegisterDto = RegisterDto;
//# sourceMappingURL=register.dto.js.map