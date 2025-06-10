import { AmenityService } from '../services/amenity.service';
import { CreateAmenityDto } from '../dto/amenity/create-amenity.dto';
import { UpdateAmenityDto } from '../dto/amenity/update-amenity.dto';
export declare class AmenityController {
    private readonly amenityService;
    constructor(amenityService: AmenityService);
    findAllActive(category?: string): Promise<import("../entities/hotel-amenity.entity").HotelAmenity[]>;
    getAmenitiesByCategory(): Promise<{
        [category: string]: import("../entities/hotel-amenity.entity").HotelAmenity[];
    }>;
    searchAmenities(searchTerm: string): Promise<import("../entities/hotel-amenity.entity").HotelAmenity[]>;
    getUsageStatistics(): Promise<{
        amenityId: string;
        amenityName: string;
        hotelCount: number;
    }[]>;
    findOne(id: string): Promise<import("../entities/hotel-amenity.entity").HotelAmenity>;
    create(createAmenityDto: CreateAmenityDto): Promise<import("../entities/hotel-amenity.entity").HotelAmenity>;
    findAllForAdmin(category?: string, isActive?: string): Promise<import("../entities/hotel-amenity.entity").HotelAmenity[]>;
    update(id: string, updateAmenityDto: UpdateAmenityDto): Promise<import("../entities/hotel-amenity.entity").HotelAmenity>;
    deactivate(id: string): Promise<import("../entities/hotel-amenity.entity").HotelAmenity>;
    activate(id: string): Promise<import("../entities/hotel-amenity.entity").HotelAmenity>;
    remove(id: string): Promise<void>;
}
