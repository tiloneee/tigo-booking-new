import { Repository } from 'typeorm';
import { SearchService } from './search.service';
import { Hotel } from '../../hotel/entities/hotel.entity';
import { Room } from '../../hotel/entities/room.entity';
import { RoomAvailability } from '../../hotel/entities/room-availability.entity';
export interface HotelSearchQuery {
    query?: string;
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
    sort_by?: 'price' | 'rating' | 'distance' | 'name' | 'relevance';
    sort_order?: 'ASC' | 'DESC';
    page?: number;
    limit?: number;
}
export interface HotelSearchResult {
    hotels: any[];
    total: number;
    page: number;
    limit: number;
    aggregations?: any;
}
export interface AutocompleteResult {
    suggestions: Array<{
        text: string;
        type: 'hotel' | 'city' | 'amenity';
        id?: string;
    }>;
}
export declare class HotelSearchService {
    private readonly searchService;
    private readonly hotelRepository;
    private readonly roomRepository;
    private readonly roomAvailabilityRepository;
    private readonly logger;
    constructor(searchService: SearchService, hotelRepository: Repository<Hotel>, roomRepository: Repository<Room>, roomAvailabilityRepository: Repository<RoomAvailability>);
    searchHotels(searchQuery: HotelSearchQuery): Promise<HotelSearchResult>;
    getAutocompleteSuggestions(query: string, limit?: number): Promise<AutocompleteResult>;
    indexHotel(hotel: Hotel): Promise<void>;
    updateHotel(hotelId: string, updates: Partial<any>): Promise<void>;
    removeHotel(hotelId: string): Promise<void>;
    bulkIndexHotels(hotels: Hotel[]): Promise<void>;
    private buildSort;
}
