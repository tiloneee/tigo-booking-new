import { HotelService } from '../services/hotel.service';
import { CreateHotelDto } from '../dto/hotel/create-hotel.dto';
import { UpdateHotelDto } from '../dto/hotel/update-hotel.dto';
import { SearchHotelDto } from '../dto/hotel/search-hotel.dto';
export declare class HotelController {
    private readonly hotelService;
    constructor(hotelService: HotelService);
    create(createHotelDto: CreateHotelDto, req: any): Promise<import("../entities/hotel.entity").Hotel>;
    getMyHotels(req: any): Promise<import("../entities/hotel.entity").Hotel[]>;
    search(searchDto: SearchHotelDto): Promise<{
        hotels: import("../entities/hotel.entity").Hotel[];
        total: number;
        page: number;
        limit: number;
    }>;
    getPublicHotelDetails(id: string): Promise<import("../entities/hotel.entity").Hotel>;
    findOne(id: string): Promise<import("../entities/hotel.entity").Hotel>;
    update(id: string, updateHotelDto: UpdateHotelDto, req: any): Promise<import("../entities/hotel.entity").Hotel>;
    remove(id: string, req: any): Promise<void>;
    findAll(): Promise<import("../entities/hotel.entity").Hotel[]>;
}
