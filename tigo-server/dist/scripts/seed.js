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
        { name: 'manage_bookings', description: 'Can manage bookings' },
        { name: 'manage_properties', description: 'Can manage properties' },
        { name: 'manage_own_properties', description: 'Can manage own properties' },
        { name: 'view_own_bookings', description: 'Can view own bookings' },
        { name: 'create_booking', description: 'Can create bookings' },
        { name: 'leave_reviews', description: 'Can leave reviews' },
        { name: 'create_hotel_listing', description: 'Create new hotel entries' },
        { name: 'view_own_hotel_listings', description: 'View hotels owned by current user' },
        { name: 'view_hotel_details_owner', description: 'Access detailed information for owned hotels' },
        { name: 'view_hotel_details_admin', description: 'Access detailed information for any hotel (admin)' },
        { name: 'update_hotel_listing', description: 'Modify existing hotel details' },
        { name: 'delete_hotel_listing', description: 'Remove hotels from system' },
        { name: 'add_room_to_hotel', description: 'Add new rooms to hotel inventory' },
        { name: 'view_rooms_for_hotel', description: 'View room listings for specific hotels' },
        { name: 'update_room_details', description: 'Modify existing room information' },
        { name: 'delete_room', description: 'Remove rooms from inventory' },
        { name: 'set_room_availability_price', description: 'Configure daily pricing and availability' },
        { name: 'update_room_availability_price', description: 'Modify existing pricing and availability' },
        { name: 'view_room_availability_price', description: 'Access availability calendars and pricing' },
        { name: 'search_hotels', description: 'Search hotel inventory' },
        { name: 'view_public_hotel_details', description: 'View customer-facing hotel information' },
        { name: 'create_hotel_booking', description: 'Make new reservations' },
        { name: 'view_own_hotel_bookings', description: 'Access personal booking history' },
        { name: 'cancel_own_hotel_booking', description: 'Cancel personal reservations' },
        { name: 'view_hotel_bookings_owner', description: 'View bookings for owned hotels' },
        { name: 'view_all_hotel_bookings_admin', description: 'Platform-wide booking access (admin)' },
        { name: 'update_hotel_booking_status', description: 'Modify booking status and payment information' },
        { name: 'process_hotel_payment_refund', description: 'Handle payment processing and refunds' },
        { name: 'submit_hotel_review', description: 'Submit customer reviews' },
        { name: 'view_hotel_reviews', description: 'Read hotel reviews' },
        { name: 'manage_hotel_amenities', description: 'Maintain global amenities catalog' },
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
                { name: 'create_booking' },
                { name: 'view_own_bookings' },
                { name: 'leave_reviews' },
                { name: 'search_hotels' },
                { name: 'view_public_hotel_details' },
                { name: 'create_hotel_booking' },
                { name: 'view_own_hotel_bookings' },
                { name: 'cancel_own_hotel_booking' },
                { name: 'submit_hotel_review' },
                { name: 'view_hotel_reviews' }
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
                { name: 'manage_own_properties' },
                { name: 'view_own_bookings' },
                { name: 'create_hotel_listing' },
                { name: 'view_own_hotel_listings' },
                { name: 'view_hotel_details_owner' },
                { name: 'update_hotel_listing' },
                { name: 'delete_hotel_listing' },
                { name: 'add_room_to_hotel' },
                { name: 'view_rooms_for_hotel' },
                { name: 'update_room_details' },
                { name: 'delete_room' },
                { name: 'set_room_availability_price' },
                { name: 'update_room_availability_price' },
                { name: 'view_room_availability_price' },
                { name: 'view_hotel_bookings_owner' },
                { name: 'update_hotel_booking_status' },
                { name: 'process_hotel_payment_refund' },
                { name: 'view_hotel_reviews' }
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
                { name: 'manage_own_properties' },
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
//# sourceMappingURL=seed.js.map