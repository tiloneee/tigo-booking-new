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
import { BookingService } from '../services/booking.service';
import { CreateBookingDto } from '../dto/booking/create-booking.dto';
import { UpdateBookingDto } from '../dto/booking/update-booking.dto';
import { SearchBookingDto } from '../dto/booking/search-booking.dto';

@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  // Create booking (Customer)
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Customer', 'Admin')
  create(@Body() createBookingDto: CreateBookingDto, @Request() req) {
    return this.bookingService.create(createBookingDto, req.user.userId);
  }

  // Get own bookings (Customer)
  @Get('mine')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Customer', 'Admin')
  getMyBookings(@Request() req) {
    return this.bookingService.findByUser(req.user.userId);
  }

  // Cancel own booking (Customer)
  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Customer', 'Admin')
  cancelBooking(
    @Param('id') id: string,
    @Body('cancellation_reason') cancellationReason: string,
    @Request() req,
  ) {
    return this.bookingService.cancelBooking(
      id,
      req.user.userId,
      cancellationReason,
    );
  }

  // Update booking status (Owner/Admin)
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HotelOwner', 'Admin')
  updateBookingStatus(
    @Param('id') id: string,
    @Body() updateBookingDto: UpdateBookingDto,
    @Request() req,
  ) {
    return this.bookingService.updateStatus(
      id,
      updateBookingDto,
      req.user.userId,
      req.user.roles,
    );
  }

  // Search bookings with filters (Owner/Admin)
  @Get('search')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HotelOwner', 'Admin')
  searchBookings(@Query() searchDto: SearchBookingDto, @Request() req) {
    // If not admin, filter to only own hotels
    if (!req.user.roles.includes('Admin')) {
      // This will be handled in the service to filter by owned hotels
      return this.bookingService.findByHotelOwner(req.user.userId);
    }
    return this.bookingService.search(searchDto);
  }

  // Get specific booking details
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @Request() req) {
    return this.bookingService.findOne(id);
  }

  // Admin-only endpoints
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  findAll() {
    return this.bookingService.findAll();
  }
}

@Controller('hotels/:hotelId/bookings')
export class HotelBookingController {
  constructor(private readonly bookingService: BookingService) {}

  // // Get all bookings for a specific hotel owner (Owner/Admin)
  // @Get()
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('HotelOwner', 'Admin')
  // getHotelBookingsByOwner(@Param('hotelId') hotelId: string, @Request() req) {
  //   return this.bookingService.findByHotelOwner(req.user.userId, hotelId);
  // }

  // Get all bookings for a specific hotel (Admin/owner)
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HotelOwner', 'Admin')
  getHotelBookingsByHotel(@Param('hotelId') hotelId: string, @Request() req) {
    return this.bookingService.findByHotel(hotelId);
  }
}
