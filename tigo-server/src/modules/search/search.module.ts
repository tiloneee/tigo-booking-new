import { Module } from '@nestjs/common';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchService } from './services/search.service';
import { HotelSearchService } from './services/hotel-search.service';
import { IndexManagementService } from './services/index-management.service';
import { HotelDataSyncService } from './services/data-sync/hotel.data-sync.service';
import { SearchController } from './controllers/search.controller';
import { Hotel } from '../hotel/entities/hotel.entity';
import { Room } from '../hotel/entities/room.entity';
import { HotelAmenity } from '../hotel/entities/hotel-amenity.entity';
import { HotelReview } from '../hotel/entities/hotel-review.entity';
import { HotelBooking } from '../hotel/entities/hotel-booking.entity';
import { RoomAvailability } from '../hotel/entities/room-availability.entity';

@Module({
  imports: [
    ElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const username = configService.get<string>('ELASTICSEARCH_USERNAME');
        const password = configService.get<string>('ELASTICSEARCH_PASSWORD');

        const config: {
          node: string;
          requestTimeout: number;
          auth?: { username: string; password: string };
        } = {
          node: `http://${configService.get('ELASTICSEARCH_HOST', 'localhost')}:${configService.get('ELASTICSEARCH_PORT', 9200)}`,
          requestTimeout: parseInt(
            configService.get('SEARCH_TIMEOUT', '30000'),
          ),
        };

        if (username && password) {
          config.auth = {
            username,
            password,
          };
        }

        return config;
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      Hotel,
      Room,
      HotelAmenity,
      HotelReview,
      HotelBooking,
      RoomAvailability,
    ]),
  ],
  providers: [
    SearchService,
    HotelSearchService,
    IndexManagementService,
    HotelDataSyncService,
  ],
  controllers: [SearchController],
  exports: [
    SearchService,
    HotelSearchService,
    IndexManagementService,
    HotelDataSyncService,
  ],
})
export class SearchModule {}
