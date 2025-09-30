import { Repository, DataSource } from 'typeorm';
import { Room } from '../entities/room.entity';
import { RoomAvailability } from '../entities/room-availability.entity';
import { Hotel } from '../entities/hotel.entity';
import { CreateRoomDto } from '../dto/room/create-room.dto';
import { UpdateRoomDto } from '../dto/room/update-room.dto';
import { CreateRoomAvailabilityDto, UpdateRoomAvailabilityDto, BulkRoomAvailabilityDto } from '../dto/room/room-availability.dto';
import { HotelDataSyncService } from '../../search/services/data-sync/hotel.data-sync.service';
export declare class RoomService {
    private roomRepository;
    private roomAvailabilityRepository;
    private hotelRepository;
    private dataSource;
    private hotelDataSyncService;
    private readonly logger;
    private readonly SENSITIVE_OWNER_FIELDS;
    constructor(roomRepository: Repository<Room>, roomAvailabilityRepository: Repository<RoomAvailability>, hotelRepository: Repository<Hotel>, dataSource: DataSource, hotelDataSyncService: HotelDataSyncService);
    private sanitizeUserObject;
    private sanitizeRoomOwnerData;
    private sanitizeRoomsOwnerData;
    create(createRoomDto: CreateRoomDto, userId: string, userRoles: string[]): Promise<Room>;
    findPublicRoomsByHotel(hotelId: string, checkInDate?: string, checkOutDate?: string, numberOfGuests?: number): Promise<{
        data: any[];
    }>;
    findByHotel(hotelId: string, userId: string, userRoles: string[]): Promise<Room[]>;
    findOne(id: string): Promise<Room>;
    update(id: string, updateRoomDto: UpdateRoomDto, userId: string, userRoles: string[]): Promise<Room>;
    delete(id: string, userId: string, userRoles: string[]): Promise<void>;
    createAvailability(createAvailabilityDto: CreateRoomAvailabilityDto, userId: string, userRoles: string[]): Promise<RoomAvailability>;
    createBulkAvailability(bulkAvailabilityDto: BulkRoomAvailabilityDto, userId: string, userRoles: string[]): Promise<RoomAvailability[]>;
    updateAvailability(roomId: string, date: string, updateAvailabilityDto: UpdateRoomAvailabilityDto, userId: string, userRoles: string[]): Promise<RoomAvailability>;
    getAvailability(roomId: string, startDate?: string, endDate?: string): Promise<RoomAvailability[]>;
    checkAvailability(roomId: string, checkInDate: string, checkOutDate: string, requiredUnits?: number): Promise<{
        available: boolean;
        totalPrice?: number;
        unavailableDates?: string[];
    }>;
    getPricingBreakdown(roomId: string, checkInDate: string, checkOutDate: string): Promise<{
        nights: Array<{
            date: string;
            dayName: string;
            price: number;
        }>;
        subtotal: number;
        numberOfNights: number;
    }>;
}
