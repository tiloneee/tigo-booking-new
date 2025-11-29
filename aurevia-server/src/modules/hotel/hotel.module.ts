import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { Hotel } from './entities/hotel.entity';
import { HotelAmenity } from './entities/hotel-amenity.entity';
import { Room } from './entities/room.entity';
import { RoomAvailability } from './entities/room-availability.entity';
import { HotelBooking } from './entities/hotel-booking.entity';
import { HotelReview } from './entities/hotel-review.entity';
import { HotelRequest } from './entities/hotel-request.entity';
import { HotelDeletionRequest } from './entities/hotel-deletion-request.entity';
import { User } from '../user/entities/user.entity';

// Modules
import { SearchModule } from '../search/search.module';
import { NotificationModule } from '../notification/notification.module';
import { TransactionModule } from '../transaction/transaction.module';

// Services
import { HotelService } from './services/hotel.service';
import { RoomService } from './services/room.service';
import { GeocodingService } from './services/geocoding.service';
import { BookingService } from './services/booking.service';
import { AmenityService } from './services/amenity.service';
import { ReviewService } from './services/review.service';
import { UserService } from '../user/services/user.service';

// Controllers
import { HotelController } from './controllers/hotel.controller';
import {
  RoomController,
  HotelRoomController,
} from './controllers/room.controller';
import {
  BookingController,
  HotelBookingController,
} from './controllers/booking.controller';
import { AmenityController } from './controllers/amenity.controller';
import {
  ReviewController,
  HotelReviewController,
} from './controllers/review.controller';

// Guards
import { HotelOwnershipGuard } from './guards/hotel-ownership.guard';
import { Role } from '../user/entities/role.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Hotel,
      HotelAmenity,
      Room,
      RoomAvailability,
      HotelBooking,
      HotelReview,
      HotelRequest,
      HotelDeletionRequest,
      User,
      Role
    ]),
    SearchModule,
    NotificationModule,
    TransactionModule,
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
    UserService,
  ],
  exports: [
    HotelService,
    RoomService,
    GeocodingService,
    BookingService,
    AmenityService,
    ReviewService,
    UserService,
    // Export repositories for use in other modules
    TypeOrmModule,
  ],
})
export class HotelModule {}
