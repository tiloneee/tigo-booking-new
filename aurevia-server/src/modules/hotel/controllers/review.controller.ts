import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { ReviewService } from '../services/review.service';
import { CreateReviewDto } from '../dto/review/create-review.dto';
import { UpdateReviewDto } from '../dto/review/update-review.dto';

@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  // Create review (Customer)
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Customer', 'Admin')
  create(@Body() createReviewDto: CreateReviewDto, @Request() req) {
    return this.reviewService.create(createReviewDto, req.user.userId);
  }

  // Get user's own reviews (Customer)
  @Get('mine')
  @UseGuards(JwtAuthGuard)
  getMyReviews(@Request() req) {
    return this.reviewService.findByUser(req.user.userId);
  }

  // Get specific review details
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reviewService.findOne(id);
  }

  // Update review (Customer - own only)
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Customer', 'Admin')
  update(
    @Param('id') id: string,
    @Body() updateReviewDto: UpdateReviewDto,
    @Request() req,
  ) {
    return this.reviewService.update(id, updateReviewDto, req.user.userId);
  }

  // Delete review (Customer - own only, Admin - any)
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Customer', 'Admin')
  remove(@Param('id') id: string, @Request() req) {
    return this.reviewService.delete(id, req.user.userId, req.user.roles);
  }

  // Vote helpful on review (Customer)
  @Post(':id/vote')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Customer', 'Admin')
  voteHelpful(
    @Param('id') id: string,
    @Body('is_helpful') isHelpful: boolean,
    @Request() req,
  ) {
    return this.reviewService.voteHelpful(id, req.user.userId, isHelpful);
  }

  // Admin endpoints for moderation
  @Patch(':id/moderate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  moderateReview(
    @Param('id') id: string,
    @Body('is_approved') isApproved: boolean,
    @Body('moderation_notes') moderationNotes?: string,
  ) {
    return this.reviewService.moderateReview(id, isApproved, moderationNotes);
  }
}

@Controller('hotels/:hotelId/reviews')
export class HotelReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  // Get all reviews for a hotel (Public)
  @Get()
  getHotelReviews(
    @Param('hotelId') hotelId: string,
    @Query('include_pending') includePending?: string,
  ) {
    const isApprovedOnly = includePending !== 'true';
    return this.reviewService.findByHotel(hotelId, isApprovedOnly);
  }

  // Submit review for specific hotel (Customer)
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Customer', 'Admin')
  createHotelReview(
    @Body() createReviewDto: CreateReviewDto,
    @Request() req,
  ) {
    // Note: hotelId is now derived from the booking in the service
    return this.reviewService.create(createReviewDto, req.user.userId);
  }

  // Get review statistics for a hotel (Public)
  @Get('statistics')
  getReviewStatistics(@Param('hotelId') hotelId: string) {
    return this.reviewService.getReviewStatistics(hotelId);
  }
}
