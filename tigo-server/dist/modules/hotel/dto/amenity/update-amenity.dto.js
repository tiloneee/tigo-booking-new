"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateAmenityDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_amenity_dto_1 = require("./create-amenity.dto");
class UpdateAmenityDto extends (0, mapped_types_1.PartialType)(create_amenity_dto_1.CreateAmenityDto) {
}
exports.UpdateAmenityDto = UpdateAmenityDto;
//# sourceMappingURL=update-amenity.dto.js.map