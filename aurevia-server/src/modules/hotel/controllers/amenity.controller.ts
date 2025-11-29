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
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AmenityService } from '../services/amenity.service';
import { CreateAmenityDto } from '../dto/amenity/create-amenity.dto';
import { UpdateAmenityDto } from '../dto/amenity/update-amenity.dto';

@Controller('amenities')
export class AmenityController {
  constructor(private readonly amenityService: AmenityService) {}

  // Public endpoints - accessible to everyone for hotel search/display

  // Get all active amenities (Public)
  @Get()
  findAllActive(@Query('category') category?: string) {
    if (category) {
      return this.amenityService.findAll(category, true);
    }
    return this.amenityService.findAllActive();
  }

  // Get amenities grouped by category (Public)
  @Get('by-category')
  getAmenitiesByCategory() {
    return this.amenityService.getAmenitiesByCategory();
  }

  // Search amenities (Public)
  @Get('search')
  searchAmenities(@Query('q') searchTerm: string) {
    if (!searchTerm) {
      return this.amenityService.findAllActive();
    }
    return this.amenityService.search(searchTerm);
  }

  // Get amenity usage statistics (Public)
  @Get('statistics')
  getUsageStatistics() {
    return this.amenityService.getUsageStatistics();
  }

  // Get specific amenity details (Public)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.amenityService.findOne(id);
  }

  // Admin-only endpoints for amenity management

  // Create amenity (Admin only)
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  create(@Body() createAmenityDto: CreateAmenityDto) {
    return this.amenityService.create(createAmenityDto);
  }

  // Get all amenities including inactive (Admin only)
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  findAllForAdmin(
    @Query('category') category?: string,
    @Query('is_active') isActive?: string,
  ) {
    const isActiveBoolean =
      isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return this.amenityService.findAll(category, isActiveBoolean);
  }

  // Update amenity (Admin only)
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  update(@Param('id') id: string, @Body() updateAmenityDto: UpdateAmenityDto) {
    return this.amenityService.update(id, updateAmenityDto);
  }

  // Soft delete amenity (Admin only)
  @Patch(':id/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  deactivate(@Param('id') id: string) {
    return this.amenityService.softDelete(id);
  }

  // Activate amenity (Admin only)
  @Patch(':id/activate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  activate(@Param('id') id: string) {
    return this.amenityService.activate(id);
  }

  // Hard delete amenity (Admin only) - use with caution
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  remove(@Param('id') id: string) {
    return this.amenityService.delete(id);
  }
}
