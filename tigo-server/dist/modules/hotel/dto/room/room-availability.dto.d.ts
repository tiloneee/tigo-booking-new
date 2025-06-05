export declare class CreateRoomAvailabilityDto {
    room_id: string;
    date: string;
    price_per_night: number;
    available_units: number;
    status?: string;
    total_units?: number;
}
export declare class UpdateRoomAvailabilityDto {
    price_per_night?: number;
    available_units?: number;
    status?: string;
    total_units?: number;
}
export declare class BulkRoomAvailabilityDto {
    room_id: string;
    start_date: string;
    end_date: string;
    price_per_night: number;
    available_units: number;
    status?: string;
    total_units?: number;
}
