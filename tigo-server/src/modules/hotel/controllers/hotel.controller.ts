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
  Request 
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { HotelOwnershipGuard } from '../guards/hotel-ownership.guard';
import { HotelService } from '../services/hotel.service';
import { CreateHotelDto } from '../dto/hotel/create-hotel.dto';
import { UpdateHotelDto } from '../dto/hotel/update-hotel.dto';
import { SearchHotelDto } from '../dto/hotel/search-hotel.dto';

@Controller('hotels')
export class HotelController {
  constructor(private readonly hotelService: HotelService) {}

  // Create hotel (HotelOwner, Admin)
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HotelOwner', 'Admin')
  create(@Body() createHotelDto: CreateHotelDto, @Request() req) {
    return this.hotelService.create(createHotelDto, req.user.userId);
  }

  // Get own hotels (HotelOwner)
  @Get('mine')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HotelOwner', 'Admin')
  getMyHotels(@Request() req) {
    return this.hotelService.findByOwner(req.user.userId);
  }

  // Search hotels (Public)
  @Get('search')
  search(@Query() searchDto: SearchHotelDto) {
    return this.hotelService.search(searchDto);
  }

  // Get hotel details for public (Public)
  @Get(':id/public')
  getPublicHotelDetails(@Param('id') id: string) {
    return this.hotelService.findOneForPublic(id);
  }

  // Get hotel details (Owner/Admin)
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, HotelOwnershipGuard)
  @Roles('HotelOwner', 'Admin')
  findOne(@Param('id') id: string) {
    return this.hotelService.findOne(id);
  }

  // Update hotel (Owner/Admin)
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, HotelOwnershipGuard)
  @Roles('HotelOwner', 'Admin')
  update(
    @Param('id') id: string, 
    @Body() updateHotelDto: UpdateHotelDto, 
    @Request() req
  ) {
    return this.hotelService.update(id, updateHotelDto, req.user.userId, req.user.roles);
  }

  // Delete hotel (Owner/Admin)
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, HotelOwnershipGuard)
  @Roles('HotelOwner', 'Admin')
  remove(@Param('id') id: string, @Request() req) {
    return this.hotelService.delete(id, req.user.userId, req.user.roles);
  }

  // Admin-only endpoints
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  findAll() {
    return this.hotelService.findAll();
  }
} 