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
var HotelService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HotelService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const hotel_entity_1 = require("../entities/hotel.entity");
const hotel_amenity_entity_1 = require("../entities/hotel-amenity.entity");
const room_entity_1 = require("../entities/room.entity");
const room_availability_entity_1 = require("../entities/room-availability.entity");
const geocoding_service_1 = require("./geocoding.service");
const typeorm_3 = require("typeorm");
let HotelService = HotelService_1 = class HotelService {
    hotelRepository;
    amenityRepository;
    roomRepository;
    roomAvailabilityRepository;
    geocodingService;
    logger = new common_1.Logger(HotelService_1.name);
    constructor(hotelRepository, amenityRepository, roomRepository, roomAvailabilityRepository, geocodingService) {
        this.hotelRepository = hotelRepository;
        this.amenityRepository = amenityRepository;
        this.roomRepository = roomRepository;
        this.roomAvailabilityRepository = roomAvailabilityRepository;
        this.geocodingService = geocodingService;
    }
    async create(createHotelDto, ownerId) {
        try {
            const existingHotel = await this.hotelRepository.findOne({
                where: {
                    name: createHotelDto.name,
                    address: createHotelDto.address,
                },
            });
            if (existingHotel) {
                throw new common_1.ConflictException('Hotel with this name and address already exists');
            }
            const coordinates = await this.geocodingService.geocodeAddress(createHotelDto.address, createHotelDto.city, createHotelDto.state, createHotelDto.country);
            const hotelData = {
                name: createHotelDto.name,
                description: createHotelDto.description,
                address: createHotelDto.address,
                city: createHotelDto.city,
                state: createHotelDto.state,
                zip_code: createHotelDto.zip_code,
                country: createHotelDto.country,
                phone_number: createHotelDto.phone_number,
                owner_id: ownerId,
                latitude: coordinates?.latitude || null,
                longitude: coordinates?.longitude || null,
            };
            const hotel = this.hotelRepository.create(hotelData);
            const savedHotel = await this.hotelRepository.save(hotel);
            if (createHotelDto.amenity_ids && createHotelDto.amenity_ids.length > 0) {
                const amenities = await this.amenityRepository.find({
                    where: { id: (0, typeorm_3.In)(createHotelDto.amenity_ids) }
                });
                savedHotel.amenities = amenities;
                await this.hotelRepository.save(savedHotel);
            }
            return this.findOne(savedHotel.id);
        }
        catch (error) {
            if (error instanceof common_1.ConflictException) {
                throw error;
            }
            this.logger.error('Failed to create hotel', error);
            throw new common_1.BadRequestException('Failed to create hotel');
        }
    }
    async findAll() {
        return this.hotelRepository.find({
            relations: ['owner', 'amenities', 'rooms'],
            order: { created_at: 'DESC' },
        });
    }
    async findByOwner(ownerId) {
        return this.hotelRepository.find({
            where: { owner_id: ownerId },
            relations: ['amenities', 'rooms'],
            order: { created_at: 'DESC' },
        });
    }
    async findOne(id) {
        const hotel = await this.hotelRepository.findOne({
            where: { id },
            relations: ['owner', 'amenities', 'rooms', 'rooms.availability'],
        });
        if (!hotel) {
            throw new common_1.NotFoundException('Hotel not found');
        }
        return hotel;
    }
    async findOneForPublic(id) {
        const hotel = await this.hotelRepository.findOne({
            where: { id, is_active: true },
            relations: ['amenities', 'rooms'],
        });
        if (!hotel) {
            throw new common_1.NotFoundException('Hotel not found');
        }
        return hotel;
    }
    async update(id, updateHotelDto, userId, userRoles) {
        const hotel = await this.findOne(id);
        if (hotel.owner_id !== userId && !userRoles.includes('Admin')) {
            throw new common_1.ForbiddenException('You can only update your own hotels');
        }
        const needsGeocoding = updateHotelDto.address || updateHotelDto.city ||
            updateHotelDto.state || updateHotelDto.country;
        let coordinates = null;
        if (needsGeocoding) {
            coordinates = await this.geocodingService.geocodeAddress(updateHotelDto.address || hotel.address, updateHotelDto.city || hotel.city, updateHotelDto.state || hotel.state, updateHotelDto.country || hotel.country);
        }
        const updateData = {
            ...updateHotelDto,
        };
        if (coordinates) {
            updateData.latitude = coordinates.latitude;
            updateData.longitude = coordinates.longitude;
        }
        await this.hotelRepository.update(id, updateData);
        if (updateHotelDto.amenity_ids !== undefined) {
            const updatedHotel = await this.findOne(id);
            if (updateHotelDto.amenity_ids.length > 0) {
                const amenities = await this.amenityRepository.find({
                    where: { id: (0, typeorm_3.In)(updateHotelDto.amenity_ids) }
                });
                updatedHotel.amenities = amenities;
            }
            else {
                updatedHotel.amenities = [];
            }
            await this.hotelRepository.save(updatedHotel);
        }
        return this.findOne(id);
    }
    async delete(id, userId, userRoles) {
        const hotel = await this.findOne(id);
        if (hotel.owner_id !== userId && !userRoles.includes('Admin')) {
            throw new common_1.ForbiddenException('You can only delete your own hotels');
        }
        await this.hotelRepository.delete(id);
    }
    async search(searchDto) {
        const queryBuilder = this.hotelRepository.createQueryBuilder('hotel')
            .leftJoinAndSelect('hotel.amenities', 'amenities')
            .leftJoinAndSelect('hotel.rooms', 'rooms')
            .leftJoinAndSelect('rooms.availability', 'availability')
            .where('hotel.is_active = :isActive', { isActive: true });
        if (searchDto.city) {
            queryBuilder.andWhere('LOWER(hotel.city) LIKE LOWER(:city)', {
                city: `%${searchDto.city}%`
            });
        }
        if (searchDto.latitude && searchDto.longitude && searchDto.radius_km) {
            queryBuilder.andWhere(`
        (6371 * acos(cos(radians(:lat)) * cos(radians(hotel.latitude)) * 
        cos(radians(hotel.longitude) - radians(:lng)) + 
        sin(radians(:lat)) * sin(radians(hotel.latitude)))) <= :radius
      `, {
                lat: searchDto.latitude,
                lng: searchDto.longitude,
                radius: searchDto.radius_km,
            });
        }
        if (searchDto.min_rating) {
            queryBuilder.andWhere('hotel.avg_rating >= :minRating', {
                minRating: searchDto.min_rating
            });
        }
        if (searchDto.room_type) {
            queryBuilder.andWhere('rooms.room_type = :roomType', {
                roomType: searchDto.room_type
            });
        }
        if (searchDto.check_in_date && searchDto.check_out_date) {
            queryBuilder.andWhere('availability.date >= :checkIn AND availability.date < :checkOut', {
                checkIn: searchDto.check_in_date,
                checkOut: searchDto.check_out_date
            });
            queryBuilder.andWhere('availability.available_units > 0');
            queryBuilder.andWhere('availability.status = :status', { status: 'Available' });
            if (searchDto.min_price) {
                queryBuilder.andWhere('availability.price_per_night >= :minPrice', {
                    minPrice: searchDto.min_price
                });
            }
            if (searchDto.max_price) {
                queryBuilder.andWhere('availability.price_per_night <= :maxPrice', {
                    maxPrice: searchDto.max_price
                });
            }
        }
        if (searchDto.amenity_ids && searchDto.amenity_ids.length > 0) {
            queryBuilder.andWhere('amenities.id IN (:...amenityIds)', {
                amenityIds: searchDto.amenity_ids
            });
        }
        if (searchDto.sort_by) {
            const order = searchDto.sort_order || 'ASC';
            switch (searchDto.sort_by) {
                case 'price':
                    queryBuilder.orderBy('MIN(availability.price_per_night)', order);
                    break;
                case 'rating':
                    queryBuilder.orderBy('hotel.avg_rating', order);
                    break;
                case 'name':
                    queryBuilder.orderBy('hotel.name', order);
                    break;
                case 'distance':
                    if (searchDto.latitude && searchDto.longitude) {
                        queryBuilder.orderBy(`
              (6371 * acos(cos(radians(${searchDto.latitude})) * cos(radians(hotel.latitude)) * 
              cos(radians(hotel.longitude) - radians(${searchDto.longitude})) + 
              sin(radians(${searchDto.latitude})) * sin(radians(hotel.latitude))))
            `, order);
                    }
                    break;
                default:
                    queryBuilder.orderBy('hotel.created_at', 'DESC');
            }
        }
        else {
            queryBuilder.orderBy('hotel.created_at', 'DESC');
        }
        queryBuilder.groupBy('hotel.id');
        queryBuilder.addGroupBy('amenities.id');
        queryBuilder.addGroupBy('rooms.id');
        queryBuilder.addGroupBy('availability.id');
        const page = searchDto.page || 1;
        const limit = searchDto.limit || 10;
        const skip = (page - 1) * limit;
        queryBuilder.skip(skip).take(limit);
        const [hotels, total] = await queryBuilder.getManyAndCount();
        return {
            hotels,
            total,
            page,
            limit,
        };
    }
    async calculateAverageRating(hotelId) {
        const result = await this.hotelRepository
            .createQueryBuilder('hotel')
            .leftJoin('hotel.reviews', 'review')
            .select('AVG(review.rating)', 'avgRating')
            .addSelect('COUNT(review.id)', 'totalReviews')
            .where('hotel.id = :hotelId', { hotelId })
            .getRawOne();
        const avgRating = parseFloat(result.avgRating) || 0;
        const totalReviews = parseInt(result.totalReviews) || 0;
        await this.hotelRepository.update(hotelId, {
            avg_rating: Math.round(avgRating * 100) / 100,
            total_reviews: totalReviews,
        });
    }
};
exports.HotelService = HotelService;
exports.HotelService = HotelService = HotelService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(hotel_entity_1.Hotel)),
    __param(1, (0, typeorm_1.InjectRepository)(hotel_amenity_entity_1.HotelAmenity)),
    __param(2, (0, typeorm_1.InjectRepository)(room_entity_1.Room)),
    __param(3, (0, typeorm_1.InjectRepository)(room_availability_entity_1.RoomAvailability)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        geocoding_service_1.GeocodingService])
], HotelService);
//# sourceMappingURL=hotel.service.js.map