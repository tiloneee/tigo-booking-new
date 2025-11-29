import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import {
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

import { HotelService } from './hotel.service';
import { GeocodingService } from './geocoding.service';
import { Hotel } from '../entities/hotel.entity';
import { HotelAmenity } from '../entities/hotel-amenity.entity';
import { Room } from '../entities/room.entity';
import { RoomAvailability } from '../entities/room-availability.entity';
import { CreateHotelDto } from '../dto/hotel/create-hotel.dto';
import { UpdateHotelDto } from '../dto/hotel/update-hotel.dto';
import { SearchHotelDto } from '../dto/hotel/search-hotel.dto';

describe('HotelService', () => {
  let service: HotelService;
  let hotelRepository: Repository<Hotel>;
  let amenityRepository: Repository<HotelAmenity>;
  let roomRepository: Repository<Room>;
  let roomAvailabilityRepository: Repository<RoomAvailability>;
  let geocodingService: GeocodingService;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
    getRawOne: jest.fn(),
    leftJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
  };

  const mockHotelRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  const mockAmenityRepository = {
    find: jest.fn(),
  };

  const mockRoomRepository = {};

  const mockRoomAvailabilityRepository = {};

  const mockGeocodingService = {
    geocodeAddress: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HotelService,
        {
          provide: getRepositoryToken(Hotel),
          useValue: mockHotelRepository,
        },
        {
          provide: getRepositoryToken(HotelAmenity),
          useValue: mockAmenityRepository,
        },
        {
          provide: getRepositoryToken(Room),
          useValue: mockRoomRepository,
        },
        {
          provide: getRepositoryToken(RoomAvailability),
          useValue: mockRoomAvailabilityRepository,
        },
        {
          provide: GeocodingService,
          useValue: mockGeocodingService,
        },
      ],
    }).compile();

    service = module.get<HotelService>(HotelService);
    hotelRepository = module.get<Repository<Hotel>>(getRepositoryToken(Hotel));
    amenityRepository = module.get<Repository<HotelAmenity>>(
      getRepositoryToken(HotelAmenity),
    );
    roomRepository = module.get<Repository<Room>>(getRepositoryToken(Room));
    roomAvailabilityRepository = module.get<Repository<RoomAvailability>>(
      getRepositoryToken(RoomAvailability),
    );
    geocodingService = module.get<GeocodingService>(GeocodingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createHotelDto: CreateHotelDto = {
      name: 'Test Hotel',
      description: 'A wonderful test hotel',
      address: '123 Test Street',
      city: 'Test City',
      state: 'Test State',
      zip_code: '12345',
      country: 'Test Country',
      phone_number: '+84123456789',
      amenity_ids: ['amenity-1', 'amenity-2'],
    };

    const ownerId = 'owner-1';
    const mockCoordinates = { latitude: 10.762622, longitude: 106.660172 };

    it('should create a hotel successfully', async () => {
      const mockHotel = { id: 'hotel-1', ...createHotelDto, owner_id: ownerId };
      const mockAmenities = [
        { id: 'amenity-1', name: 'WiFi' },
        { id: 'amenity-2', name: 'Pool' },
      ];

      mockHotelRepository.findOne.mockResolvedValue(null);
      mockGeocodingService.geocodeAddress.mockResolvedValue(mockCoordinates);
      mockHotelRepository.create.mockReturnValue(mockHotel);
      mockHotelRepository.save.mockResolvedValueOnce(mockHotel);
      mockAmenityRepository.find.mockResolvedValue(mockAmenities);
      mockHotelRepository.save.mockResolvedValueOnce({
        ...mockHotel,
        amenities: mockAmenities,
      });

      // Mock findOne for final result
      jest.spyOn(service, 'findOne').mockResolvedValue({
        ...mockHotel,
        amenities: mockAmenities,
      } as any);

      const result = await service.create(createHotelDto, ownerId);

      expect(mockHotelRepository.findOne).toHaveBeenCalledWith({
        where: {
          name: createHotelDto.name,
          address: createHotelDto.address,
        },
      });
      expect(mockGeocodingService.geocodeAddress).toHaveBeenCalledWith(
        createHotelDto.address,
        createHotelDto.city,
        createHotelDto.state,
        createHotelDto.country,
      );
      expect(mockHotelRepository.create).toHaveBeenCalled();
      expect(mockHotelRepository.save).toHaveBeenCalled();
      expect(result.amenities).toEqual(mockAmenities);
    });

    it('should throw ConflictException if hotel already exists', async () => {
      const existingHotel = { id: 'existing-hotel', name: createHotelDto.name };
      mockHotelRepository.findOne.mockResolvedValue(existingHotel);

      await expect(service.create(createHotelDto, ownerId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should handle geocoding failure gracefully', async () => {
      const mockHotel = { id: 'hotel-1', ...createHotelDto, owner_id: ownerId };

      mockHotelRepository.findOne.mockResolvedValue(null);
      mockGeocodingService.geocodeAddress.mockResolvedValue(null);
      mockHotelRepository.create.mockReturnValue(mockHotel);
      mockHotelRepository.save.mockResolvedValue(mockHotel);
      jest.spyOn(service, 'findOne').mockResolvedValue(mockHotel as any);

      const result = await service.create(
        { ...createHotelDto, amenity_ids: undefined },
        ownerId,
      );

      expect(result).toBeDefined();
      expect(mockGeocodingService.geocodeAddress).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all hotels', async () => {
      const mockHotels = [
        { id: 'hotel-1', name: 'Hotel 1' },
        { id: 'hotel-2', name: 'Hotel 2' },
      ];
      mockHotelRepository.find.mockResolvedValue(mockHotels);

      const result = await service.findAll();

      expect(mockHotelRepository.find).toHaveBeenCalledWith({
        relations: ['owner', 'amenities', 'rooms'],
        order: { created_at: 'DESC' },
      });
      expect(result).toEqual(mockHotels);
    });
  });

  describe('findByOwner', () => {
    it('should return hotels by owner', async () => {
      const ownerId = 'owner-1';
      const mockHotels = [
        { id: 'hotel-1', name: 'Hotel 1', owner_id: ownerId },
      ];
      mockHotelRepository.find.mockResolvedValue(mockHotels);

      const result = await service.findByOwner(ownerId);

      expect(mockHotelRepository.find).toHaveBeenCalledWith({
        where: { owner_id: ownerId },
        relations: ['amenities', 'rooms'],
        order: { created_at: 'DESC' },
      });
      expect(result).toEqual(mockHotels);
    });
  });

  describe('findOne', () => {
    it('should return a hotel by id', async () => {
      const hotelId = 'hotel-1';
      const mockHotel = { id: hotelId, name: 'Test Hotel' };
      mockHotelRepository.findOne.mockResolvedValue(mockHotel);

      const result = await service.findOne(hotelId);

      expect(mockHotelRepository.findOne).toHaveBeenCalledWith({
        where: { id: hotelId },
        relations: ['owner', 'amenities', 'rooms', 'rooms.availability'],
      });
      expect(result).toEqual(mockHotel);
    });

    it('should throw NotFoundException if hotel not found', async () => {
      const hotelId = 'non-existent';
      mockHotelRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(hotelId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOneForPublic', () => {
    it('should return public hotel details', async () => {
      const hotelId = 'hotel-1';
      const mockHotel = { id: hotelId, name: 'Test Hotel', is_active: true };
      mockHotelRepository.findOne.mockResolvedValue(mockHotel);

      const result = await service.findOneForPublic(hotelId);

      expect(mockHotelRepository.findOne).toHaveBeenCalledWith({
        where: { id: hotelId, is_active: true },
        relations: ['amenities', 'rooms'],
      });
      expect(result).toEqual(mockHotel);
    });

    it('should throw NotFoundException for inactive hotel', async () => {
      const hotelId = 'inactive-hotel';
      mockHotelRepository.findOne.mockResolvedValue(null);

      await expect(service.findOneForPublic(hotelId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const hotelId = 'hotel-1';
    const userId = 'owner-1';
    const userRoles = ['HotelOwner'];
    const updateHotelDto: UpdateHotelDto = {
      name: 'Updated Hotel Name',
      description: 'Updated description',
    };

    it('should update hotel successfully', async () => {
      const mockHotel = {
        id: hotelId,
        owner_id: userId,
        name: 'Original Name',
      };
      const updatedHotel = { ...mockHotel, ...updateHotelDto };

      jest.spyOn(service, 'findOne').mockResolvedValueOnce(mockHotel as any);
      mockHotelRepository.update.mockResolvedValue({ affected: 1 });
      jest.spyOn(service, 'findOne').mockResolvedValueOnce(updatedHotel as any);

      const result = await service.update(
        hotelId,
        updateHotelDto,
        userId,
        userRoles,
      );

      expect(mockHotelRepository.update).toHaveBeenCalledWith(
        hotelId,
        updateHotelDto,
      );
      expect(result).toEqual(updatedHotel);
    });

    it('should throw ForbiddenException for non-owner', async () => {
      const mockHotel = { id: hotelId, owner_id: 'different-owner' };
      jest.spyOn(service, 'findOne').mockResolvedValue(mockHotel as any);

      await expect(
        service.update(hotelId, updateHotelDto, userId, userRoles),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin to update any hotel', async () => {
      const mockHotel = { id: hotelId, owner_id: 'different-owner' };
      const adminRoles = ['Admin'];
      const updatedHotel = { ...mockHotel, ...updateHotelDto };

      jest.spyOn(service, 'findOne').mockResolvedValueOnce(mockHotel as any);
      mockHotelRepository.update.mockResolvedValue({ affected: 1 });
      jest.spyOn(service, 'findOne').mockResolvedValueOnce(updatedHotel as any);

      const result = await service.update(
        hotelId,
        updateHotelDto,
        userId,
        adminRoles,
      );

      expect(result).toEqual(updatedHotel);
    });

    it('should handle geocoding when address fields are updated', async () => {
      const mockHotel = {
        id: hotelId,
        owner_id: userId,
        address: 'Old Address',
        city: 'Old City',
        state: 'Old State',
        country: 'Old Country',
      };
      const updateWithAddress = { ...updateHotelDto, address: 'New Address' };
      const mockCoordinates = { latitude: 10.762622, longitude: 106.660172 };

      jest.spyOn(service, 'findOne').mockResolvedValueOnce(mockHotel as any);
      mockGeocodingService.geocodeAddress.mockResolvedValue(mockCoordinates);
      mockHotelRepository.update.mockResolvedValue({ affected: 1 });
      jest.spyOn(service, 'findOne').mockResolvedValueOnce(mockHotel as any);

      await service.update(hotelId, updateWithAddress, userId, userRoles);

      expect(mockGeocodingService.geocodeAddress).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    const hotelId = 'hotel-1';
    const userId = 'owner-1';
    const userRoles = ['HotelOwner'];

    it('should delete hotel successfully', async () => {
      const mockHotel = { id: hotelId, owner_id: userId };
      jest.spyOn(service, 'findOne').mockResolvedValue(mockHotel as any);
      mockHotelRepository.delete.mockResolvedValue({ affected: 1 });

      await service.delete(hotelId, userId, userRoles);

      expect(mockHotelRepository.delete).toHaveBeenCalledWith(hotelId);
    });

    it('should throw ForbiddenException for non-owner', async () => {
      const mockHotel = { id: hotelId, owner_id: 'different-owner' };
      jest.spyOn(service, 'findOne').mockResolvedValue(mockHotel as any);

      await expect(service.delete(hotelId, userId, userRoles)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('search', () => {
    const searchDto: SearchHotelDto = {
      city: 'Test City',
      check_in_date: '2024-07-01',
      check_out_date: '2024-07-05',
      number_of_guests: 2,
      page: 1,
      limit: 10,
    };

    it('should search hotels successfully', async () => {
      const mockHotels = [{ id: 'hotel-1', name: 'Test Hotel' }];
      const mockResult = [mockHotels, 1];
      mockQueryBuilder.getManyAndCount.mockResolvedValue(mockResult);

      const result = await service.search(searchDto);

      expect(mockHotelRepository.createQueryBuilder).toHaveBeenCalledWith(
        'hotel',
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'hotel.amenities',
        'amenities',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'hotel.is_active = :isActive',
        { isActive: true },
      );
      expect(result).toEqual({
        hotels: mockHotels,
        total: 1,
        page: 1,
        limit: 10,
      });
    });

    it('should handle geospatial search', async () => {
      const geoSearchDto = {
        ...searchDto,
        latitude: 10.762622,
        longitude: 106.660172,
        radius_km: 5,
      };
      const mockResult = [[], 0];
      mockQueryBuilder.getManyAndCount.mockResolvedValue(mockResult);

      await service.search(geoSearchDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('6371 * acos'),
        expect.objectContaining({
          lat: geoSearchDto.latitude,
          lng: geoSearchDto.longitude,
          radius: geoSearchDto.radius_km,
        }),
      );
    });

    it('should handle sorting by different criteria', async () => {
      const sortedSearchDto = {
        ...searchDto,
        sort_by: 'rating' as const,
        sort_order: 'DESC' as const,
      };
      const mockResult = [[], 0];
      mockQueryBuilder.getManyAndCount.mockResolvedValue(mockResult);

      await service.search(sortedSearchDto);

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'hotel.avg_rating',
        'DESC',
      );
    });
  });

  describe('calculateAverageRating', () => {
    it('should calculate and update average rating', async () => {
      const hotelId = 'hotel-1';
      const mockResult = { avgRating: '4.5', totalReviews: '10' };
      mockQueryBuilder.getRawOne.mockResolvedValue(mockResult);
      mockHotelRepository.update.mockResolvedValue({ affected: 1 });

      await service.calculateAverageRating(hotelId);

      expect(mockHotelRepository.createQueryBuilder).toHaveBeenCalledWith(
        'hotel',
      );
      expect(mockHotelRepository.update).toHaveBeenCalledWith(hotelId, {
        avg_rating: 4.5,
        total_reviews: 10,
      });
    });

    it('should handle zero ratings', async () => {
      const hotelId = 'hotel-1';
      const mockResult = { avgRating: null, totalReviews: '0' };
      mockQueryBuilder.getRawOne.mockResolvedValue(mockResult);
      mockHotelRepository.update.mockResolvedValue({ affected: 1 });

      await service.calculateAverageRating(hotelId);

      expect(mockHotelRepository.update).toHaveBeenCalledWith(hotelId, {
        avg_rating: 0,
        total_reviews: 0,
      });
    });
  });
});
