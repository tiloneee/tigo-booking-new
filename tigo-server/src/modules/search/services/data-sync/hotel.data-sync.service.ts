import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HotelSearchService } from '../hotel-search.service';
import { Hotel } from '../../../hotel/entities/hotel.entity';
import { Room } from '../../../hotel/entities/room.entity';
import { HotelReview } from '../../../hotel/entities/hotel-review.entity';
import { HotelBooking } from '../../../hotel/entities/hotel-booking.entity';

@Injectable()
export class HotelDataSyncService implements OnModuleInit {
  private readonly logger = new Logger(HotelDataSyncService.name);

  constructor(
    private readonly hotelSearchService: HotelSearchService,
    @InjectRepository(Hotel)
    private readonly hotelRepository: Repository<Hotel>,
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(HotelReview)
    private readonly reviewRepository: Repository<HotelReview>,
    @InjectRepository(HotelBooking)
    private readonly bookingRepository: Repository<HotelBooking>,
  ) {}

  async onModuleInit() {
    this.logger.log('DataSyncService initialized');
  }

  /**
   * Sync a single hotel to Elasticsearch
   */
  async syncHotel(hotelId: string): Promise<void> {
    try {
      const hotel = await this.hotelRepository.findOne({
        where: { id: hotelId },
        relations: ['amenities', 'owner'],
      });

      if (!hotel) {
        this.logger.warn(`Hotel ${hotelId} not found for sync`);
        return;
      }

      await this.hotelSearchService.indexHotel(hotel);
      this.logger.debug(`Hotel ${hotelId} synced successfully`);
    } catch (error) {
      this.logger.error(`Failed to sync hotel ${hotelId}`, error);
      throw error;
    }
  }

  /**
   * Remove hotel from Elasticsearch
   */
  async removeHotelFromIndex(hotelId: string): Promise<void> {
    try {
      await this.hotelSearchService.removeHotel(hotelId);
      this.logger.debug(`Hotel ${hotelId} removed from index`);
    } catch (error) {
      this.logger.error(`Failed to remove hotel ${hotelId} from index`, error);
      throw error;
    }
  }

  /**
   * Update hotel rating in Elasticsearch when reviews change
   */
  async updateHotelRating(hotelId: string): Promise<void> {
    try {
      const hotel = await this.hotelRepository.findOne({
        where: { id: hotelId },
      });

      if (!hotel) {
        this.logger.warn(`Hotel ${hotelId} not found for rating update`);
        return;
      }

      // Calculate average rating from reviews
      const reviews = await this.reviewRepository.find({
        where: { hotel_id: hotelId, is_approved: true },
      });

      let avgRating = 0;
      if (reviews.length > 0) {
        const totalRating = reviews.reduce(
          (sum, review) => sum + review.rating,
          0,
        );
        avgRating = totalRating / reviews.length;
      }

      const ratingDistribution = {
        '1': reviews.filter((r) => r.rating === 1).length,
        '2': reviews.filter((r) => r.rating === 2).length,
        '3': reviews.filter((r) => r.rating === 3).length,
        '4': reviews.filter((r) => r.rating === 4).length,
        '5': reviews.filter((r) => r.rating === 5).length,
      };

      await this.hotelSearchService.updateHotel(hotelId, {
        ratings: {
          average: avgRating,
          count: reviews.length,
          distribution: ratingDistribution,
        },
      });

      this.logger.debug(`Hotel ${hotelId} rating updated in index`);
    } catch (error) {
      this.logger.error(`Failed to update hotel ${hotelId} rating`, error);
      throw error;
    }
  }

  /**
   * Update hotel pricing when room availability changes
   */
  async updateHotelPricing(hotelId: string): Promise<void> {
    try {
      const rooms = await this.roomRepository.find({
        where: { hotel_id: hotelId, is_active: true },
        relations: ['availability'],
      });

      let min_price = Number.MAX_VALUE;
      let max_price = 0;

      rooms.forEach((room) => {
        room.availability?.forEach((avail) => {
          if (avail.price_per_night < min_price) {
            min_price = avail.price_per_night;
          }
          if (avail.price_per_night > max_price) {
            max_price = avail.price_per_night;
          }
        });
      });

      if (min_price === Number.MAX_VALUE) {
        min_price = 0;
      }

      await this.hotelSearchService.updateHotel(hotelId, {
        pricing: {
          min_price,
          max_price,
          currency: 'USD',
        },
      });

      this.logger.debug(`Hotel ${hotelId} pricing updated in index`);
    } catch (error) {
      this.logger.error(`Failed to update hotel ${hotelId} pricing`, error);
      throw error;
    }
  }

  /**
   * Bulk sync all hotels to Elasticsearch
   */
  async bulkSyncAllHotels(): Promise<void> {
    try {
      const hotels = await this.hotelRepository.find({
        relations: ['amenities', 'owner'],
      });

      this.logger.log(`Starting bulk sync of ${hotels.length} hotels`);

      // Process in batches of 100
      const batchSize = 100;
      for (let i = 0; i < hotels.length; i += batchSize) {
        const batch = hotels.slice(i, i + batchSize);
        await this.hotelSearchService.bulkIndexHotels(batch);
        this.logger.log(
          `Synced batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(hotels.length / batchSize)}`,
        );
      }

      this.logger.log('Bulk sync completed successfully');
    } catch (error) {
      this.logger.error('Bulk sync failed', error);
      throw error;
    }
  }

  /**
   * Sync hotels that have been updated since a specific date
   */
  async syncUpdatedHotels(since: Date): Promise<void> {
    try {
      const hotels = await this.hotelRepository.find({
        where: {
          updated_at: { $gte: since } as any,
        },
        relations: ['amenities', 'owner'],
      });

      this.logger.log(`Syncing ${hotels.length} hotels updated since ${since}`);

      for (const hotel of hotels) {
        await this.syncHotel(hotel.id);
      }

      this.logger.log('Incremental sync completed');
    } catch (error) {
      this.logger.error('Incremental sync failed', error);
      throw error;
    }
  }

  /**
   * Handle hotel created event
   */
  async onHotelCreated(hotel: Hotel): Promise<void> {
    try {
      await this.syncHotel(hotel.id);
      this.logger.debug(`Hotel created event processed: ${hotel.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to process hotel created event: ${hotel.id}`,
        error,
      );
    }
  }

  /**
   * Handle hotel updated event
   */
  async onHotelUpdated(hotel: Hotel): Promise<void> {
    try {
      await this.syncHotel(hotel.id);
      this.logger.debug(`Hotel updated event processed: ${hotel.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to process hotel updated event: ${hotel.id}`,
        error,
      );
    }
  }

  /**
   * Handle hotel deleted event
   */
  async onHotelDeleted(hotelId: string): Promise<void> {
    try {
      await this.removeHotelFromIndex(hotelId);
      this.logger.debug(`Hotel deleted event processed: ${hotelId}`);
    } catch (error) {
      this.logger.error(
        `Failed to process hotel deleted event: ${hotelId}`,
        error,
      );
    }
  }

  /**
   * Handle room availability changed event
   */
  async onRoomAvailabilityChanged(roomId: string): Promise<void> {
    try {
      const room = await this.roomRepository.findOne({
        where: { id: roomId },
      });

      if (room) {
        await this.updateHotelPricing(room.hotel_id);
        this.logger.debug(`Room availability change processed: ${roomId}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to process room availability change: ${roomId}`,
        error,
      );
    }
  }

  /**
   * Handle booking created/cancelled event
   */
  async onBookingStatusChanged(booking: HotelBooking): Promise<void> {
    try {
      // Update hotel availability data
      await this.updateHotelPricing(booking.hotel_id);
      this.logger.debug(`Booking status change processed: ${booking.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to process booking status change: ${booking.id}`,
        error,
      );
    }
  }

  /**
   * Handle review created/updated/deleted event
   */
  async onReviewChanged(review: HotelReview): Promise<void> {
    try {
      await this.updateHotelRating(review.hotel_id);
      this.logger.debug(`Review change processed: ${review.id}`);
    } catch (error) {
      this.logger.error(`Failed to process review change: ${review.id}`, error);
    }
  }

  /**
   * Validate data consistency between PostgreSQL and Elasticsearch
   */
  async validateDataConsistency(): Promise<{
    consistent: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    try {
      // Get count from PostgreSQL
      const pgHotelCount = await this.hotelRepository.count();

      // Get count from Elasticsearch
      const esResult = await this.hotelSearchService['searchService'].search({
        index: this.hotelSearchService['searchService'].getIndexName('hotels'),
        body: {
          query: { match_all: {} },
          size: 0,
        },
      });

      const esHotelCount = esResult.hits.total.value;

      if (pgHotelCount !== esHotelCount) {
        issues.push(
          `Hotel count mismatch: PostgreSQL=${pgHotelCount}, Elasticsearch=${esHotelCount}`,
        );
      }

      // Sample check: verify a few random hotels
      const sampleHotels = await this.hotelRepository.find({
        take: 10,
        relations: ['amenities'],
      });

      for (const hotel of sampleHotels) {
        try {
          const esResult = await this.hotelSearchService[
            'searchService'
          ].search({
            index:
              this.hotelSearchService['searchService'].getIndexName('hotels'),
            body: {
              query: {
                term: { id: hotel.id },
              },
            },
          });

          if (esResult.hits.total.value === 0) {
            issues.push(
              `Hotel ${hotel.id} exists in PostgreSQL but not in Elasticsearch`,
            );
          } else {
            const esHotel = esResult.hits.hits[0]._source;
            if (esHotel.name !== hotel.name) {
              issues.push(
                `Hotel ${hotel.id} name mismatch: PG="${hotel.name}", ES="${esHotel.name}"`,
              );
            }
          }
        } catch (error) {
          issues.push(`Failed to check hotel ${hotel.id}: ${error.message}`);
        }
      }

      const consistent = issues.length === 0;
      this.logger.log(
        `Data consistency check completed: ${consistent ? 'CONSISTENT' : 'ISSUES FOUND'}`,
      );

      return { consistent, issues };
    } catch (error) {
      this.logger.error('Data consistency check failed', error);
      throw error;
    }
  }
}
