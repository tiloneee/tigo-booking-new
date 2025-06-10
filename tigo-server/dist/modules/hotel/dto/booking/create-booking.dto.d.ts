export declare class CreateBookingDto {
    hotel_id: string;
    room_id: string;
    check_in_date: string;
    check_out_date: string;
    number_of_guests: number;
    special_requests?: string;
    guest_name?: string;
    guest_phone?: string;
    guest_email?: string;
    units_requested?: number;
    total_price?: number;
    status?: string;
}
