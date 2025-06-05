"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const typeorm_1 = require("@nestjs/typeorm");
const app_module_1 = require("../app.module");
const role_entity_1 = require("../modules/user/entities/role.entity");
const permission_entity_1 = require("../modules/user/entities/permission.entity");
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const roleRepository = app.get((0, typeorm_1.getRepositoryToken)(role_entity_1.Role));
    const permissionRepository = app.get((0, typeorm_1.getRepositoryToken)(permission_entity_1.Permission));
    const permissions = [
        { name: 'manage_users', description: 'Can manage user accounts' },
        { name: 'system_admin', description: 'Full system administration access' },
        { name: 'create_hotel', description: 'Create new hotel listings' },
        { name: 'view_own_hotels', description: 'View own hotel listings' },
        { name: 'view_all_hotels', description: 'View all hotel listings (admin)' },
        { name: 'update_hotel', description: 'Update hotel information' },
        { name: 'delete_hotel', description: 'Delete hotel listings' },
        { name: 'manage_rooms', description: 'Full room management (add, update, delete)' },
        { name: 'manage_room_pricing', description: 'Manage room pricing and availability' },
        { name: 'create_hotel_booking', description: 'Create hotel bookings' },
        { name: 'view_own_bookings', description: 'View own booking history' },
        { name: 'view_hotel_bookings', description: 'View bookings for owned hotels' },
        { name: 'view_all_bookings', description: 'View all platform bookings (admin)' },
        { name: 'manage_booking_status', description: 'Update booking status and payments' },
        { name: 'cancel_booking', description: 'Cancel bookings' },
        { name: 'search_hotels', description: 'Search and browse hotels' },
        { name: 'view_hotel_details', description: 'View public hotel information' },
        { name: 'submit_review', description: 'Submit reviews and ratings' },
        { name: 'view_reviews', description: 'View reviews and ratings' },
        { name: 'moderate_reviews', description: 'Moderate and manage reviews (admin)' },
        { name: 'manage_amenities', description: 'Manage global amenities catalog' },
    ];
    console.log('Creating permissions...');
    for (const permData of permissions) {
        const existingPerm = await permissionRepository.findOne({ where: { name: permData.name } });
        if (!existingPerm) {
            await permissionRepository.save(permData);
            console.log(`Created permission: ${permData.name}`);
        }
        else {
            console.log(`Permission already exists: ${permData.name}`);
        }
    }
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
        }
        else {
            console.log(`Role already exists: ${roleData.name}`);
        }
    }
    console.log('Assigning permissions to roles...');
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
    const restaurantOwnerRole = await roleRepository.findOne({
        where: { name: 'RestaurantOwner' },
        relations: ['permissions']
    });
    if (restaurantOwnerRole) {
        const restaurantOwnerPermissions = await permissionRepository.find({
            where: [
                { name: 'view_own_bookings' }
            ]
        });
        restaurantOwnerRole.permissions = restaurantOwnerPermissions;
        await roleRepository.save(restaurantOwnerRole);
        console.log('Assigned permissions to RestaurantOwner role');
    }
    const transportOwnerRole = await roleRepository.findOne({
        where: { name: 'TransportOwner' },
        relations: ['permissions']
    });
    if (transportOwnerRole) {
        const transportOwnerPermissions = await permissionRepository.find({
            where: [
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
//# sourceMappingURL=seed.js.map