import { CreateRoomDto } from './create-room.dto';
declare const UpdateRoomDto_base: import("@nestjs/mapped-types").MappedType<Partial<Omit<CreateRoomDto, "hotel_id">>>;
export declare class UpdateRoomDto extends UpdateRoomDto_base {
}
export {};
