import { RoomService } from '../services/room.service';
import { CreateRoomDto } from '../dto/room/create-room.dto';
import { UpdateRoomDto } from '../dto/room/update-room.dto';
import { CreateRoomAvailabilityDto, UpdateRoomAvailabilityDto, BulkRoomAvailabilityDto } from '../dto/room/room-availability.dto';
export declare class RoomController {
    private readonly roomService;
    constructor(roomService: RoomService);
    create(createRoomDto: CreateRoomDto, req: any): Promise<import("../entities/room.entity").Room>;
    findOne(id: string): Promise<import("../entities/room.entity").Room>;
    update(id: string, updateRoomDto: UpdateRoomDto, req: any): Promise<import("../entities/room.entity").Room>;
    remove(id: string, req: any): Promise<void>;
    createAvailability(roomId: string, createAvailabilityDto: CreateRoomAvailabilityDto, req: any): Promise<import("../entities/room-availability.entity").RoomAvailability>;
    createBulkAvailability(roomId: string, bulkAvailabilityDto: BulkRoomAvailabilityDto, req: any): Promise<import("../entities/room-availability.entity").RoomAvailability[]>;
    updateAvailability(roomId: string, date: string, updateAvailabilityDto: UpdateRoomAvailabilityDto, req: any): Promise<import("../entities/room-availability.entity").RoomAvailability>;
    getAvailability(roomId: string, startDate?: string, endDate?: string): Promise<import("../entities/room-availability.entity").RoomAvailability[]>;
    checkAvailability(roomId: string, checkInDate: string, checkOutDate: string, units?: string): Promise<{
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
export declare class HotelRoomController {
    private readonly roomService;
    constructor(roomService: RoomService);
    findPublicRoomsByHotel(hotelId: string, checkInDate?: string, checkOutDate?: string, numberOfGuests?: string): Promise<{
        data: any[];
    }>;
    findAllByHotel(hotelId: string, req: any): Promise<import("../entities/room.entity").Room[]>;
    createForHotel(hotelId: string, createRoomDto: CreateRoomDto, req: any): Promise<import("../entities/room.entity").Room>;
}
