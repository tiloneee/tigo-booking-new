import { HotelService } from '../services/hotel.service';
import { CreateHotelDto } from '../dto/hotel/create-hotel.dto';
import { UpdateHotelDto } from '../dto/hotel/update-hotel.dto';
import { SearchHotelDto } from '../dto/hotel/search-hotel.dto';
import { HotelSearchService } from '../../search/services/hotel-search.service';
export declare class HotelController {
    private readonly hotelService;
    private readonly hotelSearchService;
    constructor(hotelService: HotelService, hotelSearchService: HotelSearchService);
    create(createHotelDto: CreateHotelDto, req: any): Promise<import("../entities/hotel.entity").Hotel>;
    getMyHotels(req: any): Promise<import("../entities/hotel.entity").Hotel[]>;
    getAllHotelsPublic(page?: string, limit?: string, sortBy?: string, sortOrder?: 'ASC' | 'DESC'): Promise<{
        data: import("../entities/hotel.entity").Hotel[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            has_more: boolean;
        };
    }>;
    search(searchDto: SearchHotelDto): Promise<import("../../search/services/hotel-search.service").HotelSearchResult>;
    getPublicHotelDetails(id: string): Promise<import("../entities/hotel.entity").Hotel>;
    findOne(id: string): Promise<import("../entities/hotel.entity").Hotel>;
    update(id: string, updateHotelDto: UpdateHotelDto, req: any): Promise<import("../entities/hotel.entity").Hotel>;
    remove(id: string, req: any): Promise<void>;
    findAll(): Promise<import("../entities/hotel.entity").Hotel[]>;
    healthCheck(): Promise<{
        status: string;
        details: any;
    }>;
}
