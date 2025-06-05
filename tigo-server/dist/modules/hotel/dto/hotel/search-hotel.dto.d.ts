export declare class SearchHotelDto {
    city?: string;
    latitude?: number;
    longitude?: number;
    radius_km?: number;
    check_in_date?: string;
    check_out_date?: string;
    number_of_guests?: number;
    amenity_ids?: string[];
    min_price?: number;
    max_price?: number;
    min_rating?: number;
    room_type?: string;
    sort_by?: 'price' | 'rating' | 'distance' | 'name';
    sort_order?: 'ASC' | 'DESC';
    page?: number;
    limit?: number;
}
