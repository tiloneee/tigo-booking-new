import { Hotel } from './hotel.entity';
export declare class HotelAmenity {
    id: string;
    name: string;
    description: string;
    category: string;
    icon: string;
    is_active: boolean;
    hotels: Hotel[];
    created_at: Date;
    updated_at: Date;
}
