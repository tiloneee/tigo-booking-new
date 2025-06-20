"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateReviewDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_review_dto_1 = require("./create-review.dto");
class UpdateReviewDto extends (0, mapped_types_1.PartialType)((0, mapped_types_1.OmitType)(create_review_dto_1.CreateReviewDto, ['hotel_id', 'booking_id'])) {
}
exports.UpdateReviewDto = UpdateReviewDto;
//# sourceMappingURL=update-review.dto.js.map