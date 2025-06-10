import { Repository, DataSource } from 'typeorm';
import { HotelBooking } from '../entities/hotel-booking.entity';
import { Hotel } from '../entities/hotel.entity';
import { Room } from '../entities/room.entity';
import { RoomAvailability } from '../entities/room-availability.entity';
import { User } from '../../user/entities/user.entity';
import { CreateBookingDto } from '../dto/booking/create-booking.dto';
import { UpdateBookingDto } from '../dto/booking/update-booking.dto';
import { SearchBookingDto } from '../dto/booking/search-booking.dto';
export declare class BookingService {
    private bookingRepository;
    private hotelRepository;
    private roomRepository;
    private roomAvailabilityRepository;
    private userRepository;
    private dataSource;
    private readonly logger;
    constructor(bookingRepository: Repository<HotelBooking>, hotelRepository: Repository<Hotel>, roomRepository: Repository<Room>, roomAvailabilityRepository: Repository<RoomAvailability>, userRepository: Repository<User>, dataSource: DataSource);
    create(createBookingDto: CreateBookingDto, userId: string): Promise<HotelBooking>;
    findByUser(userId: string): Promise<HotelBooking[]>;
    findByHotelOwner(ownerId: string, hotelId?: string): Promise<HotelBooking[]>;
    findAll(): Promise<HotelBooking[]>;
    findOne(id: string): Promise<HotelBooking>;
    updateStatus(id: string, updateBookingDto: UpdateBookingDto, userId: string, userRoles: string[]): Promise<HotelBooking>;
    cancelBooking(id: string, userId: string, cancellationReason?: string): Promise<HotelBooking>;
    search(searchDto: SearchBookingDto): Promise<{
        bookings: HotelBooking[];
        total: number;
        page: number;
        limit: number;
    }>;
    private restoreAvailability;
}
