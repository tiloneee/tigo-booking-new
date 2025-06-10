import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { Hotel } from './entities/hotel.entity';
import { HotelAmenity } from './entities/hotel-amenity.entity';
import { Room } from './entities/room.entity';
import { RoomAvailability } from './entities/room-availability.entity';
import { HotelBooking } from './entities/hotel-booking.entity';
import { HotelReview } from './entities/hotel-review.entity';
import { User } from '../user/entities/user.entity';

// Services
import { HotelService } from './services/hotel.service';
import { RoomService } from './services/room.service';
import { GeocodingService } from './services/geocoding.service';
import { BookingService } from './services/booking.service';
import { AmenityService } from './services/amenity.service';
import { ReviewService } from './services/review.service';

// Controllers
import { HotelController } from './controllers/hotel.controller';
import { RoomController, HotelRoomController } from './controllers/room.controller';
import { BookingController, HotelBookingController } from './controllers/booking.controller';
import { AmenityController } from './controllers/amenity.controller';
import { ReviewController, HotelReviewController } from './controllers/review.controller';

// Guards
import { HotelOwnershipGuard } from './guards/hotel-ownership.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Hotel,
      HotelAmenity,
      Room,
      RoomAvailability,
      HotelBooking,
      HotelReview,
      User,
    ]),
  ],
  controllers: [
    HotelController,
    RoomController,
    HotelRoomController,
    BookingController,
    HotelBookingController,
    AmenityController,
    ReviewController,
    HotelReviewController,
  ],
  providers: [
    HotelService,
    RoomService,
    GeocodingService,
    BookingService,
    AmenityService,
    ReviewService,
    HotelOwnershipGuard,
  ],
  exports: [
    HotelService,
    RoomService,
    GeocodingService,
    BookingService,
    AmenityService,
    ReviewService,
    // Export repositories for use in other modules
    TypeOrmModule,
  ],
})
export class HotelModule {} 