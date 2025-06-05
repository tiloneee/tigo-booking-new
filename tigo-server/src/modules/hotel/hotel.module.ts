import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { Hotel } from './entities/hotel.entity';
import { HotelAmenity } from './entities/hotel-amenity.entity';
import { Room } from './entities/room.entity';
import { RoomAvailability } from './entities/room-availability.entity';
import { HotelBooking } from './entities/hotel-booking.entity';
import { HotelReview } from './entities/hotel-review.entity';

// Services
import { HotelService } from './services/hotel.service';
import { RoomService } from './services/room.service';
import { GeocodingService } from './services/geocoding.service';

// Controllers
import { HotelController } from './controllers/hotel.controller';
import { RoomController, HotelRoomController } from './controllers/room.controller';

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
    ]),
  ],
  controllers: [
    HotelController,
    RoomController,
    HotelRoomController,
  ],
  providers: [
    HotelService,
    RoomService,
    GeocodingService,
    HotelOwnershipGuard,
  ],
  exports: [
    HotelService,
    RoomService,
    GeocodingService,
    // Export repositories for use in other modules
    TypeOrmModule,
  ],
})
export class HotelModule {} 