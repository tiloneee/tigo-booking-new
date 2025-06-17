import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Room } from '../entities/room.entity';
import { RoomAvailability } from '../entities/room-availability.entity';
import { Hotel } from '../entities/hotel.entity';
import { CreateRoomDto } from '../dto/room/create-room.dto';
import { UpdateRoomDto } from '../dto/room/update-room.dto';
import {
  CreateRoomAvailabilityDto,
  UpdateRoomAvailabilityDto,
  BulkRoomAvailabilityDto,
} from '../dto/room/room-availability.dto';

@Injectable()
export class RoomService {
  private readonly logger = new Logger(RoomService.name);

  private readonly SENSITIVE_OWNER_FIELDS = [
    'password_hash',
    'refresh_token',
    'activation_token',
    'roles',
    'is_active',
    'created_at',
    'updated_at'
  ] as const;

  constructor(
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,

    @InjectRepository(RoomAvailability)
    private roomAvailabilityRepository: Repository<RoomAvailability>,

    @InjectRepository(Hotel)
    private hotelRepository: Repository<Hotel>,

    private dataSource: DataSource,
  ) { }

  private sanitizeUserObject(user: any, fieldsToRemove: readonly string[]): void {
    if (!user) return;
    
    fieldsToRemove.forEach(field => {
      delete user[field];
    });
  }

  private sanitizeRoomOwnerData(room: Room): void {
    this.sanitizeUserObject(room.hotel.owner, this.SENSITIVE_OWNER_FIELDS);
  }

  private sanitizeRoomsOwnerData(rooms: Room[]): void {
    rooms.forEach((room) => this.sanitizeRoomOwnerData(room));
  }

  async create(
    createRoomDto: CreateRoomDto,
    userId: string,
    userRoles: string[],
  ): Promise<Room> {
    // Verify hotel exists and user has permission
    const hotel = await this.hotelRepository.findOne({
      where: { id: createRoomDto.hotel_id },
      relations: ['owner'],
    });

    if (!hotel) {
      throw new NotFoundException('Hotel not found');
    }

    // Check ownership or admin role
    if (hotel.owner_id !== userId && !userRoles.includes('Admin')) {
      throw new ForbiddenException('You can only add rooms to your own hotels');
    }

    // Check if room number already exists in this hotel
    const existingRoom = await this.roomRepository.findOne({
      where: {
        hotel_id: createRoomDto.hotel_id,
        room_number: createRoomDto.room_number,
      },
    });

    if (existingRoom) {
      throw new ConflictException('Room number already exists in this hotel');
    }

    const room = this.roomRepository.create(createRoomDto);
    const savedRoom = await this.roomRepository.save(room);
    this.sanitizeRoomOwnerData(savedRoom);
    return savedRoom;
  }

  async findByHotel(
    hotelId: string,
    userId: string,
    userRoles: string[],
  ): Promise<Room[]> {
    // Verify hotel exists and user has permission
    const hotel = await this.hotelRepository.findOne({
      where: { id: hotelId },
    });
    console.log(hotel);
    if (!hotel) {
      throw new NotFoundException('Hotel not found');
    }
    console.log(hotel.owner_id);
    // Check ownership or admin role
    if (hotel.owner_id !== userId && !userRoles.includes('Admin')) {
      throw new ForbiddenException(
        'You can only view rooms for your own hotels',
      );
    }

    const rooms = await this.roomRepository.find({
      where: { hotel_id: hotelId },
      relations: ['availability'],
      order: { room_number: 'ASC' },
    });
    this.sanitizeRoomsOwnerData(rooms);
    return rooms;
  }

  async findOne(id: string): Promise<Room> {
    const room = await this.roomRepository.findOne({
      where: { id },
      relations: ['hotel', 'availability'],
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    this.sanitizeRoomOwnerData(room);
    return room;
  }

  async update(
    id: string,
    updateRoomDto: UpdateRoomDto,
    userId: string,
    userRoles: string[],
  ): Promise<Room> {
    const room = await this.roomRepository.findOne({
      where: { id },
      relations: ['hotel'],
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    // Check ownership or admin role
    if (room.hotel.owner_id !== userId && !userRoles.includes('Admin')) {
      throw new ForbiddenException(
        'You can only update rooms in your own hotels',
      );
    }

    // If room number is being changed, check for conflicts
    if (
      updateRoomDto.room_number &&
      updateRoomDto.room_number !== room.room_number
    ) {
      const existingRoom = await this.roomRepository.findOne({
        where: {
          hotel_id: room.hotel_id,
          room_number: updateRoomDto.room_number,
        },
      });

      if (existingRoom) {
        throw new ConflictException('Room number already exists in this hotel');
      }
    }

    await this.roomRepository.update(id, updateRoomDto);
    return this.findOne(id);
  }

  async delete(id: string, userId: string, userRoles: string[]): Promise<void> {
    const room = await this.roomRepository.findOne({
      where: { id },
      relations: ['hotel', 'bookings'],
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    // Check ownership or admin role
    if (room.hotel.owner_id !== userId && !userRoles.includes('Admin')) {
      throw new ForbiddenException(
        'You can only delete rooms from your own hotels',
      );
    }

    // Check for existing bookings
    if (room.bookings && room.bookings.length > 0) {
      throw new BadRequestException(
        'Cannot delete room with existing bookings',
      );
    }

    await this.roomRepository.delete(id);
  }

  // Room Availability Management
  async createAvailability(
    createAvailabilityDto: CreateRoomAvailabilityDto,
    userId: string,
    userRoles: string[],
  ): Promise<RoomAvailability> {
    const room = await this.roomRepository.findOne({
      where: { id: createAvailabilityDto.room_id },
      relations: ['hotel'],
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    // Check ownership or admin role
    if (room.hotel.owner_id !== userId && !userRoles.includes('Admin')) {
      throw new ForbiddenException(
        'You can only manage availability for your own hotel rooms',
      );
    }

    // Check if availability already exists for this date
    const existingAvailability = await this.roomAvailabilityRepository.findOne({
      where: {
        room_id: createAvailabilityDto.room_id,
        date: createAvailabilityDto.date,
      },
    });

    if (existingAvailability) {
      throw new ConflictException(
        'Availability already exists for this room and date',
      );
    }

    const availability = this.roomAvailabilityRepository.create({
      ...createAvailabilityDto,
      total_units:
        createAvailabilityDto.total_units ||
        createAvailabilityDto.available_units,
    });

    const savedAvailability = await this.roomAvailabilityRepository.save(availability);
    this.sanitizeRoomOwnerData(savedAvailability.room);
    return savedAvailability;
  }

  async createBulkAvailability(
    bulkAvailabilityDto: BulkRoomAvailabilityDto,
    userId: string,
    userRoles: string[],
  ): Promise<RoomAvailability[]> {
    const room = await this.roomRepository.findOne({
      where: { id: bulkAvailabilityDto.room_id },
      relations: ['hotel'],
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    // Check ownership or admin role
    if (room.hotel.owner_id !== userId && !userRoles.includes('Admin')) {
      throw new ForbiddenException(
        'You can only manage availability for your own hotel rooms',
      );
    }

    // Generate date range
    const startDate = new Date(bulkAvailabilityDto.start_date);
    const endDate = new Date(bulkAvailabilityDto.end_date);
    const dates: string[] = [];

    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      dates.push(d.toISOString().split('T')[0]);
    }

    // Use transaction for bulk operations
    return this.dataSource.transaction(async (manager) => {
      const availabilityRecords: RoomAvailability[] = [];

      for (const date of dates) {
        // Check if availability already exists
        const existing = await manager.findOne(RoomAvailability, {
          where: { room_id: bulkAvailabilityDto.room_id, date },
        });

        if (!existing) {
          const availability = manager.create(RoomAvailability, {
            room_id: bulkAvailabilityDto.room_id,
            date,
            price_per_night: bulkAvailabilityDto.price_per_night,
            available_units: bulkAvailabilityDto.available_units,
            total_units:
              bulkAvailabilityDto.total_units ||
              bulkAvailabilityDto.available_units,
            status: bulkAvailabilityDto.status || 'Available',
          });

          const saved = await manager.save(availability);
          availabilityRecords.push(saved);
        }
      }

      return availabilityRecords;
    });
  }

  async updateAvailability(
    roomId: string,
    date: string,
    updateAvailabilityDto: UpdateRoomAvailabilityDto,
    userId: string,
    userRoles: string[],
  ): Promise<RoomAvailability> {
    const room = await this.roomRepository.findOne({
      where: { id: roomId },
      relations: ['hotel'],
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    // Check ownership or admin role
    if (room.hotel.owner_id !== userId && !userRoles.includes('Admin')) {
      throw new ForbiddenException(
        'You can only manage availability for your own hotel rooms',
      );
    }

    const availability = await this.roomAvailabilityRepository.findOne({
      where: { room_id: roomId, date },
    });

    if (!availability) {
      throw new NotFoundException('Availability record not found');
    }

    await this.roomAvailabilityRepository.update(
      availability.id,
      updateAvailabilityDto,
    );

    const updatedAvailability = await this.roomAvailabilityRepository.findOne({
      where: { id: availability.id },
      relations: ['room'],
    });

    if (!updatedAvailability) {
      throw new NotFoundException('Failed to retrieve updated availability');
    }

    this.sanitizeRoomOwnerData(updatedAvailability.room);
    return updatedAvailability;
  }

  async getAvailability(
    roomId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<RoomAvailability[]> {
    const query = this.roomAvailabilityRepository
      .createQueryBuilder('availability')
      .where('availability.room_id = :roomId', { roomId });

    if (startDate) {
      query.andWhere('availability.date >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('availability.date <= :endDate', { endDate });
    }

    const availability = await query.orderBy('availability.date', 'ASC').getMany();
    this.sanitizeRoomsOwnerData(availability.map((a) => a.room));
    return availability;
  }

  async checkAvailability(
    roomId: string,
    checkInDate: string,
    checkOutDate: string,
    requiredUnits: number = 1,
  ): Promise<{
    available: boolean;
    totalPrice?: number;
    unavailableDates?: string[];
  }> {
    const availability = await this.roomAvailabilityRepository
      .createQueryBuilder('availability')
      .where('availability.room_id = :roomId', { roomId })
      .andWhere('availability.date >= :checkIn', { checkIn: checkInDate })
      .andWhere('availability.date < :checkOut', { checkOut: checkOutDate })
      .andWhere('availability.status = :status', { status: 'Available' })
      .orderBy('availability.date', 'ASC')
      .getMany();

    // Generate all required dates
    const startDate = new Date(checkInDate);
    const endDate = new Date(checkOutDate);
    const requiredDates: string[] = [];

    for (let d = new Date(startDate); d < endDate; d.setDate(d.getDate() + 1)) {
      requiredDates.push(d.toISOString().split('T')[0]);
    }

    // Check if all dates are available
    const availableDates = availability.map((a) => a.date);
    const unavailableDates = requiredDates.filter((date) => {
      const availRecord = availability.find((a) => a.date === date);
      return !availRecord || availRecord.available_units < requiredUnits;
    });

    if (unavailableDates.length > 0) {
      return {
        available: false,
        unavailableDates,
      };
    }

    // Calculate total price
    const totalPrice = availability.reduce(
      (sum, record) => sum + parseFloat(record.price_per_night.toString()),
      0,
    );

    return {
      available: true,
      totalPrice,
    };
  }
}
