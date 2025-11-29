import {
  Injectable,
  CanActivate,
  ExecutionContext,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hotel } from '../entities/hotel.entity';

@Injectable()
export class HotelOwnershipGuard implements CanActivate {
  constructor(
    @InjectRepository(Hotel)
    private hotelRepository: Repository<Hotel>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const hotelId = request.params.id;

    // Admin can access any hotel
    if (user.roles && user.roles.includes('Admin')) {
      return true;
    }

    // For HotelOwner role, check ownership
    if (user.roles && user.roles.includes('HotelOwner')) {
      const hotel = await this.hotelRepository.findOne({
        where: { id: hotelId },
      });

      if (!hotel) {
        throw new NotFoundException('Hotel not found');
      }

      // Check if user owns this hotel
      return hotel.owner_id === user.userId;
    }

    return false;
  }
}
