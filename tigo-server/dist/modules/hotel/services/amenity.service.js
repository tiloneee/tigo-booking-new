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
var AmenityService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmenityService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const hotel_amenity_entity_1 = require("../entities/hotel-amenity.entity");
let AmenityService = AmenityService_1 = class AmenityService {
    amenityRepository;
    logger = new common_1.Logger(AmenityService_1.name);
    constructor(amenityRepository) {
        this.amenityRepository = amenityRepository;
    }
    async create(createAmenityDto) {
        const existingAmenity = await this.amenityRepository.findOne({
            where: { name: createAmenityDto.name },
        });
        if (existingAmenity) {
            throw new common_1.ConflictException('Amenity with this name already exists');
        }
        const amenity = this.amenityRepository.create(createAmenityDto);
        const savedAmenity = await this.amenityRepository.save(amenity);
        this.logger.log(`New amenity created: ${savedAmenity.name} (${savedAmenity.id})`);
        return savedAmenity;
    }
    async findAll(category, isActive) {
        const where = {};
        if (category) {
            where.category = (0, typeorm_2.ILike)(`%${category}%`);
        }
        if (isActive !== undefined) {
            where.is_active = isActive;
        }
        return this.amenityRepository.find({
            where,
            order: { category: 'ASC', name: 'ASC' },
        });
    }
    async findAllActive() {
        return this.findAll(undefined, true);
    }
    async findOne(id) {
        const amenity = await this.amenityRepository.findOne({
            where: { id },
            relations: ['hotels'],
        });
        if (!amenity) {
            throw new common_1.NotFoundException('Amenity not found');
        }
        return amenity;
    }
    async update(id, updateAmenityDto) {
        const amenity = await this.findOne(id);
        if (updateAmenityDto.name && updateAmenityDto.name !== amenity.name) {
            const existingAmenity = await this.amenityRepository.findOne({
                where: { name: updateAmenityDto.name },
            });
            if (existingAmenity) {
                throw new common_1.ConflictException('Amenity with this name already exists');
            }
        }
        await this.amenityRepository.update(id, updateAmenityDto);
        this.logger.log(`Amenity updated: ${id}`);
        return this.findOne(id);
    }
    async delete(id) {
        const amenity = await this.amenityRepository.findOne({
            where: { id },
            relations: ['hotels'],
        });
        if (!amenity) {
            throw new common_1.NotFoundException('Amenity not found');
        }
        if (amenity.hotels && amenity.hotels.length > 0) {
            throw new common_1.BadRequestException(`Cannot delete amenity. It is currently being used by ${amenity.hotels.length} hotel(s)`);
        }
        await this.amenityRepository.delete(id);
        this.logger.log(`Amenity deleted: ${id} (${amenity.name})`);
    }
    async softDelete(id) {
        const amenity = await this.findOne(id);
        await this.amenityRepository.update(id, { is_active: false });
        this.logger.log(`Amenity soft deleted: ${id} (${amenity.name})`);
        return this.findOne(id);
    }
    async activate(id) {
        const amenity = await this.findOne(id);
        await this.amenityRepository.update(id, { is_active: true });
        this.logger.log(`Amenity activated: ${id} (${amenity.name})`);
        return this.findOne(id);
    }
    async getAmenitiesByCategory() {
        const amenities = await this.findAllActive();
        return amenities.reduce((grouped, amenity) => {
            const category = amenity.category || 'Uncategorized';
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(amenity);
            return grouped;
        }, {});
    }
    async search(searchTerm) {
        return this.amenityRepository.find({
            where: [
                { name: (0, typeorm_2.ILike)(`%${searchTerm}%`), is_active: true },
                { description: (0, typeorm_2.ILike)(`%${searchTerm}%`), is_active: true },
                { category: (0, typeorm_2.ILike)(`%${searchTerm}%`), is_active: true },
            ],
            order: { name: 'ASC' },
        });
    }
    async getUsageStatistics() {
        const result = await this.amenityRepository
            .createQueryBuilder('amenity')
            .leftJoin('amenity.hotels', 'hotel')
            .select('amenity.id', 'amenityId')
            .addSelect('amenity.name', 'amenityName')
            .addSelect('COUNT(hotel.id)', 'hotelCount')
            .where('amenity.is_active = :isActive', { isActive: true })
            .groupBy('amenity.id')
            .addGroupBy('amenity.name')
            .orderBy('hotelCount', 'DESC')
            .getRawMany();
        return result.map(row => ({
            amenityId: row.amenityId,
            amenityName: row.amenityName,
            hotelCount: parseInt(row.hotelCount) || 0,
        }));
    }
};
exports.AmenityService = AmenityService;
exports.AmenityService = AmenityService = AmenityService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(hotel_amenity_entity_1.HotelAmenity)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AmenityService);
//# sourceMappingURL=amenity.service.js.map