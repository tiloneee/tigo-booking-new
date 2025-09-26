import { Repository } from 'typeorm';
import { Hotel } from '../entities/hotel.entity';
import { HotelAmenity } from '../entities/hotel-amenity.entity';
import { Room } from '../entities/room.entity';
import { RoomAvailability } from '../entities/room-availability.entity';
import { CreateHotelDto } from '../dto/hotel/create-hotel.dto';
import { UpdateHotelDto } from '../dto/hotel/update-hotel.dto';
import { SearchHotelDto } from '../dto/hotel/search-hotel.dto';
import { GeocodingService } from './geocoding.service';
import { HotelDataSyncService } from '../../search/services/data-sync/hotel.data-sync.service';
export declare class HotelService {
    private hotelRepository;
    private amenityRepository;
    private roomRepository;
    private roomAvailabilityRepository;
    private geocodingService;
    private hotelDataSyncService;
    private readonly logger;
    constructor(hotelRepository: Repository<Hotel>, amenityRepository: Repository<HotelAmenity>, roomRepository: Repository<Room>, roomAvailabilityRepository: Repository<RoomAvailability>, geocodingService: GeocodingService, hotelDataSyncService: HotelDataSyncService);
    private sanitizeHotelOwnerData;
    private sanitizeHotelsOwnerData;
    create(createHotelDto: CreateHotelDto, ownerId: string): Promise<Hotel>;
    findAll(): Promise<Hotel[]>;
    findAllActive(options: {
        page: number;
        limit: number;
        sort_by?: string;
        sort_order?: 'ASC' | 'DESC';
    }): Promise<{
        hotels: Hotel[];
        total: number;
        page: number;
        limit: number;
    }>;
    findByOwner(ownerId: string): Promise<Hotel[]>;
    findOne(id: string): Promise<Hotel>;
    update(id: string, updateHotelDto: UpdateHotelDto, userId: string, userRoles: string[]): Promise<Hotel>;
    delete(id: string, userId: string, userRoles: string[]): Promise<void>;
    search(searchDto: SearchHotelDto): Promise<{
        hotels: Hotel[];
        total: number;
        page: number;
        limit: number;
    }>;
    calculateAverageRating(hotelId: string): Promise<void>;
    findOneForPublic(id: string): Promise<Hotel>;
    healthCheck(): Promise<{
        status: string;
        details: any;
    }>;
}
