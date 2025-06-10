import { Repository } from 'typeorm';
import { HotelAmenity } from '../entities/hotel-amenity.entity';
import { CreateAmenityDto } from '../dto/amenity/create-amenity.dto';
import { UpdateAmenityDto } from '../dto/amenity/update-amenity.dto';
export declare class AmenityService {
    private amenityRepository;
    private readonly logger;
    constructor(amenityRepository: Repository<HotelAmenity>);
    create(createAmenityDto: CreateAmenityDto): Promise<HotelAmenity>;
    findAll(category?: string, isActive?: boolean): Promise<HotelAmenity[]>;
    findAllActive(): Promise<HotelAmenity[]>;
    findOne(id: string): Promise<HotelAmenity>;
    update(id: string, updateAmenityDto: UpdateAmenityDto): Promise<HotelAmenity>;
    delete(id: string): Promise<void>;
    softDelete(id: string): Promise<HotelAmenity>;
    activate(id: string): Promise<HotelAmenity>;
    getAmenitiesByCategory(): Promise<{
        [category: string]: HotelAmenity[];
    }>;
    search(searchTerm: string): Promise<HotelAmenity[]>;
    getUsageStatistics(): Promise<{
        amenityId: string;
        amenityName: string;
        hotelCount: number;
    }[]>;
}
