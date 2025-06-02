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
                { name: 'leave_reviews' }
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
                { name: 'view_own_bookings' }
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