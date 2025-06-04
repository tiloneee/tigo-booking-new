import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Hotel } from '../entities/hotel.entity';
export declare class HotelOwnershipGuard implements CanActivate {
    private hotelRepository;
    constructor(hotelRepository: Repository<Hotel>);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
