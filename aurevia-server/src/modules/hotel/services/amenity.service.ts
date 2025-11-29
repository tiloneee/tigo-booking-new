import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { HotelAmenity } from '../entities/hotel-amenity.entity';
import { CreateAmenityDto } from '../dto/amenity/create-amenity.dto';
import { UpdateAmenityDto } from '../dto/amenity/update-amenity.dto';

@Injectable()
export class AmenityService {
  private readonly logger = new Logger(AmenityService.name);

  constructor(
    @InjectRepository(HotelAmenity)
    private amenityRepository: Repository<HotelAmenity>,
  ) {}

  async create(createAmenityDto: CreateAmenityDto): Promise<HotelAmenity> {
    // Check if amenity with same name already exists
    const existingAmenity = await this.amenityRepository.findOne({
      where: { name: createAmenityDto.name },
    });

    if (existingAmenity) {
      throw new ConflictException('Amenity with this name already exists');
    }

    const amenity = this.amenityRepository.create(createAmenityDto);
    const savedAmenity = await this.amenityRepository.save(amenity);

    this.logger.log(
      `New amenity created: ${savedAmenity.name} (${savedAmenity.id})`,
    );
    return savedAmenity;
  }

  async findAll(
    category?: string,
    isActive?: boolean,
  ): Promise<HotelAmenity[]> {
    const where: any = {};

    if (category) {
      where.category = ILike(`%${category}%`);
    }

    if (isActive !== undefined) {
      where.is_active = isActive;
    }

    return this.amenityRepository.find({
      where,
      order: { category: 'ASC', name: 'ASC' },
    });
  }

  async findAllActive(): Promise<HotelAmenity[]> {
    return this.findAll(undefined, true);
  }

  async findOne(id: string): Promise<HotelAmenity> {
    const amenity = await this.amenityRepository.findOne({
      where: { id },
      relations: ['hotels'],
    });

    if (!amenity) {
      throw new NotFoundException('Amenity not found');
    }

    return amenity;
  }

  async update(
    id: string,
    updateAmenityDto: UpdateAmenityDto,
  ): Promise<HotelAmenity> {
    const amenity = await this.findOne(id);

    // Check if new name conflicts with existing amenity
    if (updateAmenityDto.name && updateAmenityDto.name !== amenity.name) {
      const existingAmenity = await this.amenityRepository.findOne({
        where: { name: updateAmenityDto.name },
      });

      if (existingAmenity) {
        throw new ConflictException('Amenity with this name already exists');
      }
    }

    await this.amenityRepository.update(id, updateAmenityDto);

    this.logger.log(`Amenity updated: ${id}`);
    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    const amenity = await this.amenityRepository.findOne({
      where: { id },
      relations: ['hotels'],
    });

    if (!amenity) {
      throw new NotFoundException('Amenity not found');
    }

    // Check if amenity is being used by any hotels
    if (amenity.hotels && amenity.hotels.length > 0) {
      throw new BadRequestException(
        `Cannot delete amenity. It is currently being used by ${amenity.hotels.length} hotel(s)`,
      );
    }

    await this.amenityRepository.delete(id);
    this.logger.log(`Amenity deleted: ${id} (${amenity.name})`);
  }

  async softDelete(id: string): Promise<HotelAmenity> {
    const amenity = await this.findOne(id);

    await this.amenityRepository.update(id, { is_active: false });

    this.logger.log(`Amenity soft deleted: ${id} (${amenity.name})`);
    return this.findOne(id);
  }

  async activate(id: string): Promise<HotelAmenity> {
    const amenity = await this.findOne(id);

    await this.amenityRepository.update(id, { is_active: true });

    this.logger.log(`Amenity activated: ${id} (${amenity.name})`);
    return this.findOne(id);
  }

  async getAmenitiesByCategory(): Promise<{
    [category: string]: HotelAmenity[];
  }> {
    const amenities = await this.findAllActive();

    return amenities.reduce(
      (grouped, amenity) => {
        const category = amenity.category || 'Uncategorized';
        if (!grouped[category]) {
          grouped[category] = [];
        }
        grouped[category].push(amenity);
        return grouped;
      },
      {} as { [category: string]: HotelAmenity[] },
    );
  }

  async search(searchTerm: string): Promise<HotelAmenity[]> {
    return this.amenityRepository.find({
      where: [
        { name: ILike(`%${searchTerm}%`), is_active: true },
        { description: ILike(`%${searchTerm}%`), is_active: true },
        { category: ILike(`%${searchTerm}%`), is_active: true },
      ],
      order: { name: 'ASC' },
    });
  }

  async getUsageStatistics(): Promise<
    { amenityId: string; amenityName: string; hotelCount: number }[]
  > {
    const result = await this.amenityRepository
      .createQueryBuilder('amenity')
      .leftJoin('amenity.hotels', 'hotel')
      .select('amenity.id', 'amenityId')
      .addSelect('amenity.name', 'amenityName')
      .addSelect('COUNT(hotel.id)', 'hotelCount')
      .where('amenity.is_active = :isActive', { isActive: true })
      .groupBy('amenity.id')
      .addGroupBy('amenity.name')
      .orderBy('"hotelCount"', 'DESC')
      .getRawMany();

    return result.map((row) => ({
      amenityId: row.amenityId,
      amenityName: row.amenityName,
      hotelCount: parseInt(row.hotelCount) || 0,
    }));
  }
}
