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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HotelReviewController = exports.ReviewController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../../common/guards/roles.guard");
const roles_decorator_1 = require("../../../common/decorators/roles.decorator");
const review_service_1 = require("../services/review.service");
const create_review_dto_1 = require("../dto/review/create-review.dto");
const update_review_dto_1 = require("../dto/review/update-review.dto");
let ReviewController = class ReviewController {
    reviewService;
    constructor(reviewService) {
        this.reviewService = reviewService;
    }
    create(createReviewDto, req) {
        return this.reviewService.create(createReviewDto, req.user.userId);
    }
    getMyReviews(req) {
        return this.reviewService.findByUser(req.user.userId);
    }
    findOne(id) {
        return this.reviewService.findOne(id);
    }
    update(id, updateReviewDto, req) {
        return this.reviewService.update(id, updateReviewDto, req.user.userId);
    }
    remove(id, req) {
        return this.reviewService.delete(id, req.user.userId, req.user.roles);
    }
    voteHelpful(id, isHelpful, req) {
        return this.reviewService.voteHelpful(id, req.user.userId, isHelpful);
    }
    moderateReview(id, isApproved, moderationNotes) {
        return this.reviewService.moderateReview(id, isApproved, moderationNotes);
    }
};
exports.ReviewController = ReviewController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('Customer', 'Admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_review_dto_1.CreateReviewDto, Object]),
    __metadata("design:returntype", void 0)
], ReviewController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('mine'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('Customer', 'Admin'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ReviewController.prototype, "getMyReviews", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ReviewController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('Customer', 'Admin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_review_dto_1.UpdateReviewDto, Object]),
    __metadata("design:returntype", void 0)
], ReviewController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('Customer', 'Admin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ReviewController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/vote'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('Customer', 'Admin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('is_helpful')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean, Object]),
    __metadata("design:returntype", void 0)
], ReviewController.prototype, "voteHelpful", null);
__decorate([
    (0, common_1.Patch)(':id/moderate'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('Admin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('is_approved')),
    __param(2, (0, common_1.Body)('moderation_notes')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean, String]),
    __metadata("design:returntype", void 0)
], ReviewController.prototype, "moderateReview", null);
exports.ReviewController = ReviewController = __decorate([
    (0, common_1.Controller)('reviews'),
    __metadata("design:paramtypes", [review_service_1.ReviewService])
], ReviewController);
let HotelReviewController = class HotelReviewController {
    reviewService;
    constructor(reviewService) {
        this.reviewService = reviewService;
    }
    getHotelReviews(hotelId, includePending) {
        const isApprovedOnly = includePending !== 'true';
        return this.reviewService.findByHotel(hotelId, isApprovedOnly);
    }
    createHotelReview(hotelId, createReviewDto, req) {
        createReviewDto.hotel_id = hotelId;
        return this.reviewService.create(createReviewDto, req.user.userId);
    }
    getReviewStatistics(hotelId) {
        return this.reviewService.getReviewStatistics(hotelId);
    }
};
exports.HotelReviewController = HotelReviewController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Param)('hotelId')),
    __param(1, (0, common_1.Query)('include_pending')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], HotelReviewController.prototype, "getHotelReviews", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('Customer', 'Admin'),
    __param(0, (0, common_1.Param)('hotelId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_review_dto_1.CreateReviewDto, Object]),
    __metadata("design:returntype", void 0)
], HotelReviewController.prototype, "createHotelReview", null);
__decorate([
    (0, common_1.Get)('statistics'),
    __param(0, (0, common_1.Param)('hotelId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], HotelReviewController.prototype, "getReviewStatistics", null);
exports.HotelReviewController = HotelReviewController = __decorate([
    (0, common_1.Controller)('hotels/:hotelId/reviews'),
    __metadata("design:paramtypes", [review_service_1.ReviewService])
], HotelReviewController);
//# sourceMappingURL=review.controller.js.map