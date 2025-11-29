import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RoomService } from '../services/room.service';
import { CreateRoomDto } from '../dto/room/create-room.dto';
import { UpdateRoomDto } from '../dto/room/update-room.dto';
import {
  CreateRoomAvailabilityDto,
  UpdateRoomAvailabilityDto,
  BulkRoomAvailabilityDto,
} from '../dto/room/room-availability.dto';

@Controller('rooms')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  // Create room (Owner/Admin)
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HotelOwner', 'Admin')
  create(@Body() createRoomDto: CreateRoomDto, @Request() req) {
    return this.roomService.create(
      createRoomDto,
      req.user.userId,
      req.user.roles,
    );
  }

  // Get room details
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roomService.findOne(id);
  }

  // Update room (Owner/Admin)
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HotelOwner', 'Admin')
  update(
    @Param('id') id: string,
    @Body() updateRoomDto: UpdateRoomDto,
    @Request() req,
  ) {
    return this.roomService.update(
      id,
      updateRoomDto,
      req.user.userId,
      req.user.roles,
    );
  }

  // Delete room (Owner/Admin)
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HotelOwner', 'Admin')
  remove(@Param('id') id: string, @Request() req) {
    return this.roomService.delete(id, req.user.userId, req.user.roles);
  }

  // Room Availability Management

  // Set room availability (Owner/Admin)
  @Post(':id/availability')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HotelOwner', 'Admin')
  createAvailability(
    @Param('id') roomId: string,
    @Body() createAvailabilityDto: CreateRoomAvailabilityDto,
    @Request() req,
  ) {
    createAvailabilityDto.room_id = roomId;
    return this.roomService.createAvailability(
      createAvailabilityDto,
      req.user.userId,
      req.user.roles,
    );
  }

  // Set bulk room availability (Owner/Admin)
  @Post(':id/availability/bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HotelOwner', 'Admin')
  createBulkAvailability(
    @Param('id') roomId: string,
    @Body() bulkAvailabilityDto: BulkRoomAvailabilityDto,
    @Request() req,
  ) {
    bulkAvailabilityDto.room_id = roomId;
    return this.roomService.createBulkAvailability(
      bulkAvailabilityDto,
      req.user.userId,
      req.user.roles,
    );
  }

  // Update room availability (Owner/Admin)
  @Patch(':id/availability/:date')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HotelOwner', 'Admin')
  updateAvailability(
    @Param('id') roomId: string,
    @Param('date') date: string,
    @Body() updateAvailabilityDto: UpdateRoomAvailabilityDto,
    @Request() req,
  ) {
    return this.roomService.updateAvailability(
      roomId,
      date,
      updateAvailabilityDto,
      req.user.userId,
      req.user.roles,
    );
  }

  // Get room availability (Public for search, Owner/Admin for management)
  @Get(':id/availability')
  getAvailability(
    @Param('id') roomId: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    return this.roomService.getAvailability(roomId, startDate, endDate);
  }

  // Check room availability for booking (Public)
  @Get(':id/availability/check')
  checkAvailability(
    @Param('id') roomId: string,
    @Query('check_in_date') checkInDate: string,
    @Query('check_out_date') checkOutDate: string,
    @Query('units') units: string = '1',
  ) {
    return this.roomService.checkAvailability(
      roomId,
      checkInDate,
      checkOutDate,
      parseInt(units),
    );
  }

  // Get nightly price breakdown (Public)
  @Get(':id/pricing-breakdown')
  getPricingBreakdown(
    @Param('id') roomId: string,
    @Query('check_in_date') checkInDate: string,
    @Query('check_out_date') checkOutDate: string,
  ) {
    return this.roomService.getPricingBreakdown(roomId, checkInDate, checkOutDate);
  }
}

@Controller('hotels/:hotelId/rooms')
export class HotelRoomController {
  constructor(private readonly roomService: RoomService) {}

  // Get all rooms for a hotel with availability (Public)
  @Get('public')
  async findPublicRoomsByHotel(
    @Param('hotelId') hotelId: string,
    @Query('check_in_date') checkInDate?: string,
    @Query('check_out_date') checkOutDate?: string,
    @Query('number_of_guests') numberOfGuests?: string,
  ) {
    return this.roomService.findPublicRoomsByHotel(
      hotelId,
      checkInDate,
      checkOutDate,
      numberOfGuests ? parseInt(numberOfGuests) : undefined,
    );
  }

  // Get all rooms for a hotel (Owner/Admin)
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HotelOwner', 'Admin')
  findAllByHotel(@Param('hotelId') hotelId: string, @Request() req) {
    return this.roomService.findByHotel(
      hotelId,
      req.user.userId,
      req.user.roles,
    );
  }

  // Create room for specific hotel (Owner/Admin)
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HotelOwner', 'Admin')
  createForHotel(
    @Param('hotelId') hotelId: string,
    @Body() createRoomDto: CreateRoomDto,
    @Request() req,
  ) {
    // Validate hotelId from URL parameter
    if (
      !hotelId ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        hotelId,
      )
    ) {
      throw new BadRequestException('Invalid hotel ID in URL parameter');
    }

    createRoomDto.hotel_id = hotelId;
    return this.roomService.create(
      createRoomDto,
      req.user.userId,
      req.user.roles,
    );
  }
}
