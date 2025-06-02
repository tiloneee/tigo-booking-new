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
    { name: 'manage_users', description: 'Can manage user accounts' },
    { name: 'manage_bookings', description: 'Can manage bookings' },
    { name: 'manage_properties', description: 'Can manage properties' },
    { name: 'manage_own_properties', description: 'Can manage own properties' },
    { name: 'view_own_bookings', description: 'Can view own bookings' },
    { name: 'create_booking', description: 'Can create bookings' },
    { name: 'leave_reviews', description: 'Can leave reviews' },
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
        { name: 'create_booking' },
        { name: 'view_own_bookings' },
        { name: 'leave_reviews' }
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
        { name: 'manage_own_properties' },
        { name: 'view_own_bookings' }
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
        { name: 'manage_own_properties' },
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
        { name: 'manage_own_properties' },
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