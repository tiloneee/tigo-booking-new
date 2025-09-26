import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SearchService } from './search.service';
import { Hotel } from '../../hotel/entities/hotel.entity';
import { Room } from '../../hotel/entities/room.entity';
import { RoomAvailability } from '../../hotel/entities/room-availability.entity';

export interface HotelSearchQuery {
  query?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  radius_km?: number;
  check_in_date?: string;
  check_out_date?: string;
  number_of_guests?: number;
  amenity_ids?: string[];
  min_price?: number;
  max_price?: number;
  min_rating?: number;
  room_type?: string;
  sort_by?: 'price' | 'rating' | 'distance' | 'name' | 'relevance';
  sort_order?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export interface HotelSearchResult {
  hotels: any[];
  total: number;
  page: number;
  limit: number;
  aggregations?: any;
}

export interface AutocompleteResult {
  suggestions: Array<{
    text: string;
    type: 'hotel' | 'city' | 'amenity';
    id?: string;
  }>;
}

@Injectable()
export class HotelSearchService {
  private readonly logger = new Logger(HotelSearchService.name);

  constructor(
    private readonly searchService: SearchService,
    @InjectRepository(Hotel)
    private readonly hotelRepository: Repository<Hotel>,
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(RoomAvailability)
    private readonly roomAvailabilityRepository: Repository<RoomAvailability>,
  ) {}

  /**
   * Search hotels with advanced filters
   */
  async searchHotels(
    searchQuery: HotelSearchQuery,
  ): Promise<HotelSearchResult> {
    const {
      query,
      city,
      latitude,
      longitude,
      radius_km = 50,
      check_in_date,
      check_out_date,
      number_of_guests,
      amenity_ids,
      min_price,
      max_price,
      min_rating,
      room_type,
      sort_by = 'relevance',
      sort_order = 'DESC',
      page = 1,
      limit = 10,
    } = searchQuery;

    const from = (page - 1) * limit;

    try {
      // Build the main query
      const must: any[] = [];
      const filter: any[] = [];

      // Enhanced text search for hotel names and cities
      if (query) {
        must.push({
          bool: {
            should: [
              // Primary search: hotel name (highest boost)
              {
                multi_match: {
                  query: query,
                  fields: [
                    'name^5',           // Hotel name gets highest priority
                    'name.keyword^4',   // Exact match for hotel name
                  ],
                  type: 'best_fields',
                  fuzziness: 'AUTO',
                  boost: 3,
                }
              },
              // Secondary search: city name (high boost)
              {
                multi_match: {
                  query: query,
                  fields: [
                    'location.city^4',     // City name high priority
                    'location.city.keyword^3', // Exact city match
                  ],
                  type: 'best_fields',
                  fuzziness: 'AUTO',
                  boost: 2,
                }
              },
              // Tertiary search: address and description
              {
                multi_match: {
                  query: query,
                  fields: [
                    'location.address^2',
                    'description^1',
                  ],
                  type: 'best_fields',
                  fuzziness: 'AUTO',
                  boost: 1,
                }
              }
            ],
            minimum_should_match: 1,
          }
        });
      }

      // Specific city filter (only use if explicitly different from query)
      if (city && city !== query) {
        must.push({
          match: {
            'location.city': {
              query: city,
              operator: 'and'
            }
          },
        });
      }

      // Geospatial search
      if (latitude && longitude) {
        filter.push({
          geo_distance: {
            distance: `${radius_km}km`,
            'location.coordinates': {
              lat: latitude,
              lon: longitude,
            },
          },
        });
      }

      // Active hotels only
      filter.push({
        term: { is_active: true },
      });

      // Rating filter
      if (min_rating) {
        filter.push({
          range: {
            'ratings.average': { gte: min_rating },
          },
        });
      }

      // Price range filter
      if (min_price || max_price) {
        const priceRange: any = {};
        if (min_price) priceRange.gte = min_price;
        if (max_price) priceRange.lte = max_price;

        filter.push({
          range: {
            'pricing.min_price': priceRange,
          },
        });
      }

      // Amenities filter
      if (amenity_ids && amenity_ids.length > 0) {
        filter.push({
          nested: {
            path: 'amenities',
            query: {
              terms: {
                'amenities.id': amenity_ids,
              },
            },
          },
        });
      }

      // Availability filter
      if (check_in_date && check_out_date && number_of_guests) {
        must.push({
          nested: {
            path: 'availability',
            query: {
              bool: {
                must: [
                  {
                    range: {
                      'availability.date': {
                        gte: check_in_date,
                        lte: check_out_date,
                      },
                    },
                  },
                  {
                    range: {
                      'availability.available_rooms': { gt: 0 },
                    },
                  },
                ],
              },
            },
          },
        });
      }

      // Build sort
      const sort = this.buildSort(sort_by, sort_order, latitude, longitude);

      // Build aggregations
      const aggregations = {
        price_ranges: {
          range: {
            field: 'pricing.min_price',
            ranges: [
              { to: 50 },
              { from: 50, to: 100 },
              { from: 100, to: 200 },
              { from: 200, to: 500 },
              { from: 500 },
            ],
          },
        },
        rating_distribution: {
          range: {
            field: 'ratings.average',
            ranges: [
              { from: 4.5 },
              { from: 4.0, to: 4.5 },
              { from: 3.5, to: 4.0 },
              { from: 3.0, to: 3.5 },
              { to: 3.0 },
            ],
          },
        },
        amenities: {
          nested: {
            path: 'amenities',
          },
          aggs: {
            amenity_names: {
              terms: {
                field: 'amenities.name',
                size: 20,
              },
            },
          },
        },
        cities: {
          terms: {
            field: 'location.city',
            size: 10,
          },
        },
      };

      const searchParams = {
        index: this.searchService.getIndexName('hotels'),
        body: {
          query: {
            bool: {
              must,
              filter,
            },
          },
          sort,
          from,
          size: limit,
          aggs: aggregations,
        },
      };



      const result = await this.searchService.search(searchParams);
      console.log(result, "HOTEL SEARCH RESULT: ");
      console.log(result.hits.hits, "HOTEL SEARCH HITS Hit: ");
      console.log(result.hits, "HOTEL SEARCH HITS: ");

      return {
        hotels: result.hits.hits.map((hit: any) => ({
          id: hit._id,
          score: hit._score,
          ...hit._source,
        })),
        total: result.hits.total.value,
        page,
        limit,
        aggregations: result.aggregations,
      };
    } catch (error) {
      this.logger.error('Hotel search failed', error);
      throw error;
    }
  }

  /**
   * Get hotel suggestions for autocomplete
   */
  async getAutocompleteSuggestions(
    query: string,
    limit: number = 10,
  ): Promise<AutocompleteResult> {
    try {
      const searchParams = {
        index: this.searchService.getIndexName('hotels'),
        body: {
          query: {
            bool: {
              should: [
                {
                  match_phrase_prefix: {
                    'name': {
                      query: query,
                      boost: 3,
                    },
                  },
                },
                {
                  wildcard: {
                    'name': {
                      value: `*${query.toLowerCase()}*`,
                      case_insensitive: true,
                      boost: 2,
                    },
                  },
                },
                {
                  wildcard: {
                    'location.city': {
                      value: `*${query.toLowerCase()}*`,
                      case_insensitive: true,
                      boost: 2,
                    },
                  },
                },
                {
                  nested: {
                    path: 'amenities',
                    query: {
                      wildcard: {
                        'amenities.name': {
                          value: `*${query.toLowerCase()}*`,
                          case_insensitive: true,
                        },
                      },
                    },
                  },
                },
              ],
              minimum_should_match: 1,
            },
          },
          size: 10,
        },
      };

      const result = await this.searchService.search(searchParams);
      const suggestions: AutocompleteResult['suggestions'] = [];

      // Hotel name suggestions
      result.hits.hits.forEach((hit: any) => {
        const hotelName = hit._source.name;
        if (
          hotelName &&
          hotelName.toLowerCase().includes(query.toLowerCase()) &&
          !suggestions.some((s) => s.text === hotelName && s.type === 'hotel')
        ) {
          suggestions.push({
            text: hotelName,
            type: 'hotel',
            id: hit._source.id,
          });
        }
      });

      // City suggestions
      result.hits.hits.forEach((hit: any) => {
        const city = hit._source.location.city;
        if (
          city &&
          city.toLowerCase().includes(query.toLowerCase()) &&
          !suggestions.some((s) => s.text === city && s.type === 'city')
        ) {
          suggestions.push({
            text: city,
            type: 'city',
          });
        }
      });

      // Amenity suggestions
      result.hits.hits.forEach((hit: any) => {
        if (hit._source.amenities) {
          hit._source.amenities.forEach((amenity: any) => {
            if (
              amenity.name &&
              amenity.name.toLowerCase().includes(query.toLowerCase()) &&
              !suggestions.some((s) => s.text === amenity.name && s.type === 'amenity')
            ) {
              suggestions.push({
                text: amenity.name,
                type: 'amenity',
                id: amenity.id,
              });
            }
          });
        }
      });

      return { suggestions: suggestions.slice(0, limit) };
    } catch (error) {
      this.logger.error('Autocomplete search failed', error);
      throw error;
    }
  }

  /**
   * Index a hotel document
   */
  async indexHotel(hotel: Hotel): Promise<void> {
    try {
      // Calculate price range from rooms
      const rooms = await this.roomRepository.find({
        where: { hotel_id: hotel.id, is_active: true },
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

      const hotelDocument = {
        id: hotel.id,
        name: hotel.name,
        description: hotel.description,
        location: {
          coordinates:
            hotel.latitude && hotel.longitude
              ? { lat: hotel.latitude, lon: hotel.longitude }
              : null,
          address: hotel.address,
          city: hotel.city,
          state: hotel.state,
          country: hotel.country,
        },
        amenities:
          hotel.amenities?.map((amenity) => ({
            id: amenity.id,
            name: amenity.name,
            category: amenity.category,
          })) || [],
        pricing: {
          min_price,
          max_price,
          currency: 'USD', // TODO: Make this configurable
        },
        ratings: {
          average: hotel.avg_rating,
          count: hotel.total_reviews,
        },
        owner_id: hotel.owner_id,
        phone_number: hotel.phone_number,
        created_at: hotel.created_at,
        updated_at: hotel.updated_at,
        is_active: hotel.is_active,
      };

      await this.searchService.indexDocument('hotels', hotelDocument, hotel.id);
      this.logger.debug(`Hotel ${hotel.id} indexed successfully`);
    } catch (error) {
      this.logger.error(`Failed to index hotel ${hotel.id}`, error);
      throw error;
    }
  }

  /**
   * Update hotel document
   */
  async updateHotel(hotelId: string, updates: Partial<any>): Promise<void> {
    try {
      await this.searchService.updateDocument('hotels', hotelId, updates);
      this.logger.debug(`Hotel ${hotelId} updated successfully`);
    } catch (error) {
      this.logger.error(`Failed to update hotel ${hotelId}`, error);
      throw error;
    }
  }

  /**
   * Remove hotel from index
   */
  async removeHotel(hotelId: string): Promise<void> {
    try {
      await this.searchService.deleteDocument('hotels', hotelId);
      this.logger.debug(`Hotel ${hotelId} removed from index`);
    } catch (error) {
      this.logger.error(`Failed to remove hotel ${hotelId}`, error);
      throw error;
    }
  }

  /**
   * Bulk index hotels
   */
  async bulkIndexHotels(hotels: Hotel[]): Promise<void> {
    try {
      const operations: any[] = [];

      for (const hotel of hotels) {
        // Calculate price range
        const rooms = await this.roomRepository.find({
          where: { hotel_id: hotel.id, is_active: true },
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

        const hotelDocument = {
          id: hotel.id,
          name: hotel.name,
          description: hotel.description,
          location: {
            coordinates:
              hotel.latitude && hotel.longitude
                ? { lat: hotel.latitude, lon: hotel.longitude }
                : null,
            address: hotel.address,
            city: hotel.city,
            state: hotel.state,
            country: hotel.country,
          },
          amenities:
            hotel.amenities?.map((amenity) => ({
              id: amenity.id,
              name: amenity.name,
              category: amenity.category,
            })) || [],
          pricing: {
            min_price,
            max_price,
            currency: 'USD',
          },
          ratings: {
            average: hotel.avg_rating,
            count: hotel.total_reviews,
          },
          owner_id: hotel.owner_id,
          phone_number: hotel.phone_number,
          created_at: hotel.created_at,
          updated_at: hotel.updated_at,
          is_active: hotel.is_active,
        };

        operations.push(
          {
            index: {
              _index: this.searchService.getIndexName('hotels'),
              _id: hotel.id,
            },
          },
          hotelDocument,
        );
      }

      await this.searchService.bulk(operations);
      this.logger.log(`Bulk indexed ${hotels.length} hotels`);
    } catch (error) {
      this.logger.error('Bulk hotel indexing failed', error);
      throw error;
    }
  }

  /**
   * Build sort configuration
   */
  private buildSort(
    sort_by: string,
    sort_order: string,
    latitude?: number,
    longitude?: number,
  ): any[] {
    const order = sort_order.toLowerCase() === 'asc' ? 'asc' : 'desc';

    switch (sort_by) {
      case 'price':
        return [{ 'pricing.min_price': { order } }];

      case 'rating':
        return [
          { 'ratings.average': { order } },
          { 'ratings.count': { order } },
        ];

      case 'distance':
        if (latitude && longitude) {
          return [
            {
              _geo_distance: {
                'location.coordinates': {
                  lat: latitude,
                  lon: longitude,
                },
                order,
                unit: 'km',
              },
            },
          ];
        }
        return [{ _score: { order: 'desc' } }];

      case 'name':
        return [{ 'name.keyword': { order } }];

      case 'relevance':
      default:
        return [{ _score: { order: 'desc' } }];
    }
  }
}
