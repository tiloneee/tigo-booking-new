import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppModule } from '../app.module';
import { Role } from '../modules/user/entities/role.entity';
import { Permission } from '../modules/user/entities/permission.entity';
import { Repository } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const roleRepository = app.get<Repository<Role>>(getRepositoryToken(Role));
  const permissionRepository = app.get<Repository<Permission>>(getRepositoryToken(Permission));

  // Create permissions
  const permissions = [
    // === SYSTEM ADMINISTRATION ===
    { name: 'manage_users', description: 'Can manage user accounts' },
    { name: 'system_admin', description: 'Full system administration access' },

    // === HOTEL MANAGEMENT ===
    { name: 'create_hotel', description: 'Create new hotel listings' },
    { name: 'view_own_hotels', description: 'View own hotel listings' },
    { name: 'view_all_hotels', description: 'View all hotel listings (admin)' },
    { name: 'update_hotel', description: 'Update hotel information' },
    { name: 'delete_hotel', description: 'Delete hotel listings' },

    // === ROOM MANAGEMENT ===
    { name: 'manage_rooms', description: 'Full room management (add, update, delete)' },
    { name: 'manage_room_pricing', description: 'Manage room pricing and availability' },

    // === BOOKING MANAGEMENT ===
    { name: 'create_hotel_booking', description: 'Create hotel bookings' },
    { name: 'view_own_bookings', description: 'View own booking history' },
    { name: 'view_hotel_bookings', description: 'View bookings for owned hotels' },
    { name: 'view_all_bookings', description: 'View all platform bookings (admin)' },
    { name: 'manage_booking_status', description: 'Update booking status and payments' },
    { name: 'cancel_booking', description: 'Cancel bookings' },

    // === CUSTOMER FEATURES ===
    { name: 'search_hotels', description: 'Search and browse hotels' },
    { name: 'view_hotel_details', description: 'View public hotel information' },

    // === REVIEWS & RATINGS ===
    { name: 'submit_review', description: 'Submit reviews and ratings' },
    { name: 'view_reviews', description: 'View reviews and ratings' },
    { name: 'moderate_reviews', description: 'Moderate and manage reviews (admin)' },

    // === AMENITIES MANAGEMENT ===
    { name: 'manage_amenities', description: 'Manage global amenities catalog' },
  ];

  console.log('Creating permissions...');
  for (const permData of permissions) {
    const existingPerm = await permissionRepository.findOne({ where: { name: permData.name } });
    if (!existingPerm) {
      await permissionRepository.save(permData);
      console.log(`Created permission: ${permData.name}`);
    } else {
      console.log(`Permission already exists: ${permData.name}`);
    }
  }

  // Create roles
  const roles = [
    { name: 'Admin', description: 'System administrator' },
    { name: 'Customer', description: 'Regular customer' },
    { name: 'HotelOwner', description: 'Hotel property owner' },
    { name: 'RestaurantOwner', description: 'Restaurant owner' },
    { name: 'TransportOwner', description: 'Transportation service owner' },
  ];

  console.log('Creating roles...');
  for (const roleData of roles) {
    const existingRole = await roleRepository.findOne({ where: { name: roleData.name } });
    if (!existingRole) {
      await roleRepository.save(roleData);
      console.log(`Created role: ${roleData.name}`);
    } else {
      console.log(`Role already exists: ${roleData.name}`);
    }
  }

  // Assign permissions to roles
  console.log('Assigning permissions to roles...');
  
  // Admin gets all permissions
  const adminRole = await roleRepository.findOne({ 
    where: { name: 'Admin' },
    relations: ['permissions']
  });
  
  if (adminRole) {
    const allPermissions = await permissionRepository.find();
    adminRole.permissions = allPermissions;
    await roleRepository.save(adminRole);
    console.log('Assigned all permissions to Admin role');
  }

  // Customer permissions
  const customerRole = await roleRepository.findOne({
    where: { name: 'Customer' },
    relations: ['permissions']
  });
  
  if (customerRole) {
    const customerPermissions = await permissionRepository.find({
      where: [
        { name: 'create_hotel_booking' },
        { name: 'view_own_bookings' },
        { name: 'cancel_booking' },
        { name: 'search_hotels' },
        { name: 'view_hotel_details' },
        { name: 'submit_review' },
        { name: 'view_reviews' }
      ]
    });
    
    customerRole.permissions = customerPermissions;
    await roleRepository.save(customerRole);
    console.log('Assigned permissions to Customer role');
  }

  // HotelOwner permissions
  const hotelOwnerRole = await roleRepository.findOne({
    where: { name: 'HotelOwner' },
    relations: ['permissions']
  });
  
  if (hotelOwnerRole) {
    const hotelOwnerPermissions = await permissionRepository.find({
      where: [
        { name: 'create_hotel' },
        { name: 'view_own_hotels' },
        { name: 'update_hotel' },
        { name: 'delete_hotel' },
        { name: 'manage_rooms' },
        { name: 'manage_room_pricing' },
        { name: 'view_hotel_bookings' },
        { name: 'manage_booking_status' },
        { name: 'view_reviews' }
      ]
    });
    
    hotelOwnerRole.permissions = hotelOwnerPermissions;
    await roleRepository.save(hotelOwnerRole);
    console.log('Assigned permissions to HotelOwner role');
  }

  // RestaurantOwner permissions
  const restaurantOwnerRole = await roleRepository.findOne({
    where: { name: 'RestaurantOwner' },
    relations: ['permissions']
  });
  
  if (restaurantOwnerRole) {
    const restaurantOwnerPermissions = await permissionRepository.find({
      where: [
        // For future restaurant module - keeping minimal for now
        { name: 'view_own_bookings' }
      ]
    });
    
    restaurantOwnerRole.permissions = restaurantOwnerPermissions;
    await roleRepository.save(restaurantOwnerRole);
    console.log('Assigned permissions to RestaurantOwner role');
  }

  // TransportOwner permissions
  const transportOwnerRole = await roleRepository.findOne({
    where: { name: 'TransportOwner' },
    relations: ['permissions']
  });
  
  if (transportOwnerRole) {
    const transportOwnerPermissions = await permissionRepository.find({
      where: [
        // For future transport module - keeping minimal for now
        { name: 'view_own_bookings' }
      ]
    });
    
    transportOwnerRole.permissions = transportOwnerPermissions;
    await roleRepository.save(transportOwnerRole);
    console.log('Assigned permissions to TransportOwner role');
  }

  console.log('Database seeding completed successfully!');
  await app.close();
}

bootstrap()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error during seeding:', error);
    process.exit(1);
  });