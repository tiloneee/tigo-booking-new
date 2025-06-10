import { BookingService } from '../services/booking.service';
import { CreateBookingDto } from '../dto/booking/create-booking.dto';
import { UpdateBookingDto } from '../dto/booking/update-booking.dto';
import { SearchBookingDto } from '../dto/booking/search-booking.dto';
export declare class BookingController {
    private readonly bookingService;
    constructor(bookingService: BookingService);
    create(createBookingDto: CreateBookingDto, req: any): Promise<import("../entities/hotel-booking.entity").HotelBooking>;
    getMyBookings(req: any): Promise<import("../entities/hotel-booking.entity").HotelBooking[]>;
    cancelBooking(id: string, cancellationReason: string, req: any): Promise<import("../entities/hotel-booking.entity").HotelBooking>;
    updateBookingStatus(id: string, updateBookingDto: UpdateBookingDto, req: any): Promise<import("../entities/hotel-booking.entity").HotelBooking>;
    searchBookings(searchDto: SearchBookingDto, req: any): Promise<import("../entities/hotel-booking.entity").HotelBooking[]> | Promise<{
        bookings: import("../entities/hotel-booking.entity").HotelBooking[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string, req: any): Promise<import("../entities/hotel-booking.entity").HotelBooking>;
    findAll(): Promise<import("../entities/hotel-booking.entity").HotelBooking[]>;
}
export declare class HotelBookingController {
    private readonly bookingService;
    constructor(bookingService: BookingService);
    getHotelBookings(hotelId: string, req: any): Promise<import("../entities/hotel-booking.entity").HotelBooking[]>;
}
