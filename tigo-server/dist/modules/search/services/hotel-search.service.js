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
var HotelSearchService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HotelSearchService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const search_service_1 = require("./search.service");
const hotel_entity_1 = require("../../hotel/entities/hotel.entity");
const room_entity_1 = require("../../hotel/entities/room.entity");
const room_availability_entity_1 = require("../../hotel/entities/room-availability.entity");
let HotelSearchService = HotelSearchService_1 = class HotelSearchService {
    searchService;
    hotelRepository;
    roomRepository;
    roomAvailabilityRepository;
    logger = new common_1.Logger(HotelSearchService_1.name);
    constructor(searchService, hotelRepository, roomRepository, roomAvailabilityRepository) {
        this.searchService = searchService;
        this.hotelRepository = hotelRepository;
        this.roomRepository = roomRepository;
        this.roomAvailabilityRepository = roomAvailabilityRepository;
    }
    async searchHotels(searchQuery) {
        const { query, city, latitude, longitude, radius_km = 50, check_in_date, check_out_date, number_of_guests, amenity_ids, min_price, max_price, min_rating, room_type, sort_by = 'relevance', sort_order = 'DESC', page = 1, limit = 10, } = searchQuery;
        const from = (page - 1) * limit;
        try {
            const must = [];
            const filter = [];
            if (query) {
                must.push({
                    bool: {
                        should: [
                            {
                                multi_match: {
                                    query: query,
                                    fields: [
                                        'name^5',
                                        'name.keyword^4',
                                    ],
                                    type: 'best_fields',
                                    fuzziness: 'AUTO',
                                    boost: 3,
                                }
                            },
                            {
                                multi_match: {
                                    query: query,
                                    fields: [
                                        'location.city^4',
                                        'location.city.keyword^3',
                                    ],
                                    type: 'best_fields',
                                    fuzziness: 'AUTO',
                                    boost: 2,
                                }
                            },
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
            filter.push({
                term: { is_active: true },
            });
            if (min_rating) {
                filter.push({
                    range: {
                        'ratings.average': { gte: min_rating },
                    },
                });
            }
            if (min_price || max_price) {
                const priceRange = {};
                if (min_price)
                    priceRange.gte = min_price;
                if (max_price)
                    priceRange.lte = max_price;
                filter.push({
                    range: {
                        'pricing.min_price': priceRange,
                    },
                });
            }
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
            const sort = this.buildSort(sort_by, sort_order, latitude, longitude);
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
                hotels: result.hits.hits.map((hit) => ({
                    id: hit._id,
                    score: hit._score,
                    ...hit._source,
                })),
                total: result.hits.total.value,
                page,
                limit,
                aggregations: result.aggregations,
            };
        }
        catch (error) {
            this.logger.error('Hotel search failed', error);
            throw error;
        }
    }
    async getAutocompleteSuggestions(query, limit = 10) {
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
            const suggestions = [];
            result.hits.hits.forEach((hit) => {
                const hotelName = hit._source.name;
                if (hotelName &&
                    hotelName.toLowerCase().includes(query.toLowerCase()) &&
                    !suggestions.some((s) => s.text === hotelName && s.type === 'hotel')) {
                    suggestions.push({
                        text: hotelName,
                        type: 'hotel',
                        id: hit._source.id,
                    });
                }
            });
            result.hits.hits.forEach((hit) => {
                const city = hit._source.location.city;
                if (city &&
                    city.toLowerCase().includes(query.toLowerCase()) &&
                    !suggestions.some((s) => s.text === city && s.type === 'city')) {
                    suggestions.push({
                        text: city,
                        type: 'city',
                    });
                }
            });
            result.hits.hits.forEach((hit) => {
                if (hit._source.amenities) {
                    hit._source.amenities.forEach((amenity) => {
                        if (amenity.name &&
                            amenity.name.toLowerCase().includes(query.toLowerCase()) &&
                            !suggestions.some((s) => s.text === amenity.name && s.type === 'amenity')) {
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
        }
        catch (error) {
            this.logger.error('Autocomplete search failed', error);
            throw error;
        }
    }
    async indexHotel(hotel) {
        try {
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
                    coordinates: hotel.latitude && hotel.longitude
                        ? { lat: hotel.latitude, lon: hotel.longitude }
                        : null,
                    address: hotel.address,
                    city: hotel.city,
                    state: hotel.state,
                    country: hotel.country,
                },
                amenities: hotel.amenities?.map((amenity) => ({
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
            await this.searchService.indexDocument('hotels', hotelDocument, hotel.id);
            this.logger.debug(`Hotel ${hotel.id} indexed successfully`);
        }
        catch (error) {
            this.logger.error(`Failed to index hotel ${hotel.id}`, error);
            throw error;
        }
    }
    async updateHotel(hotelId, updates) {
        try {
            await this.searchService.updateDocument('hotels', hotelId, updates);
            this.logger.debug(`Hotel ${hotelId} updated successfully`);
        }
        catch (error) {
            this.logger.error(`Failed to update hotel ${hotelId}`, error);
            throw error;
        }
    }
    async removeHotel(hotelId) {
        try {
            await this.searchService.deleteDocument('hotels', hotelId);
            this.logger.debug(`Hotel ${hotelId} removed from index`);
        }
        catch (error) {
            this.logger.error(`Failed to remove hotel ${hotelId}`, error);
            throw error;
        }
    }
    async bulkIndexHotels(hotels) {
        try {
            const operations = [];
            for (const hotel of hotels) {
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
                        coordinates: hotel.latitude && hotel.longitude
                            ? { lat: hotel.latitude, lon: hotel.longitude }
                            : null,
                        address: hotel.address,
                        city: hotel.city,
                        state: hotel.state,
                        country: hotel.country,
                    },
                    amenities: hotel.amenities?.map((amenity) => ({
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
                operations.push({
                    index: {
                        _index: this.searchService.getIndexName('hotels'),
                        _id: hotel.id,
                    },
                }, hotelDocument);
            }
            await this.searchService.bulk(operations);
            this.logger.log(`Bulk indexed ${hotels.length} hotels`);
        }
        catch (error) {
            this.logger.error('Bulk hotel indexing failed', error);
            throw error;
        }
    }
    buildSort(sort_by, sort_order, latitude, longitude) {
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
};
exports.HotelSearchService = HotelSearchService;
exports.HotelSearchService = HotelSearchService = HotelSearchService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(hotel_entity_1.Hotel)),
    __param(2, (0, typeorm_1.InjectRepository)(room_entity_1.Room)),
    __param(3, (0, typeorm_1.InjectRepository)(room_availability_entity_1.RoomAvailability)),
    __metadata("design:paramtypes", [search_service_1.SearchService,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], HotelSearchService);
//# sourceMappingURL=hotel-search.service.js.map