export declare class SearchBookingDto {
    hotel_id?: string;
    room_id?: string;
    user_id?: string;
    check_in_from?: string;
    check_in_to?: string;
    check_out_from?: string;
    check_out_to?: string;
    created_from?: string;
    created_to?: string;
    status?: string[];
    payment_status?: string[];
    min_price?: number;
    max_price?: number;
    guest_name?: string;
    guest_email?: string;
    guest_phone?: string;
    sort_by?: string;
    sort_order?: 'ASC' | 'DESC';
    page?: number;
    limit?: number;
}
