import { Room } from './room.entity';
export declare class RoomAvailability {
    id: string;
    date: string;
    price_per_night: number;
    available_units: number;
    status: string;
    total_units: number;
    room: Room;
    room_id: string;
    created_at: Date;
    updated_at: Date;
}
