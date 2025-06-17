import { CreateBookingDto } from './create-booking.dto';
declare const UpdateBookingDto_base: import("@nestjs/mapped-types").MappedType<Partial<Omit<CreateBookingDto, "room_id" | "hotel_id">>>;
export declare class UpdateBookingDto extends UpdateBookingDto_base {
    status?: string;
    payment_status?: string;
    cancellation_reason?: string;
    admin_notes?: string;
    confirmed_at?: Date;
    cancelled_at?: Date;
}
export {};
