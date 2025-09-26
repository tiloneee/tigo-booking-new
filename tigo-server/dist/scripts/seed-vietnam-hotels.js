"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const typeorm_1 = require("@nestjs/typeorm");
const app_module_1 = require("../app.module");
const user_entity_1 = require("../modules/user/entities/user.entity");
const hotel_entity_1 = require("../modules/hotel/entities/hotel.entity");
const room_entity_1 = require("../modules/hotel/entities/room.entity");
const hotel_amenity_entity_1 = require("../modules/hotel/entities/hotel-amenity.entity");
const room_availability_entity_1 = require("../modules/hotel/entities/room-availability.entity");
const vietnam_hotels_data_1 = require("./vietnam-hotels-data");
async function bootstrap() {
    console.log('🏨 Creating authentic Vietnamese hotels from real data...');
    try {
        const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
        const userRepository = app.get((0, typeorm_1.getRepositoryToken)(user_entity_1.User));
        const hotelRepository = app.get((0, typeorm_1.getRepositoryToken)(hotel_entity_1.Hotel));
        const roomRepository = app.get((0, typeorm_1.getRepositoryToken)(room_entity_1.Room));
        const amenityRepository = app.get((0, typeorm_1.getRepositoryToken)(hotel_amenity_entity_1.HotelAmenity));
        const availabilityRepository = app.get((0, typeorm_1.getRepositoryToken)(room_availability_entity_1.RoomAvailability));
        console.log('Clearing existing test hotels...');
        const existingHotels = await hotelRepository.find();
        if (existingHotels.length > 0) {
            console.log('Clearing bookings and related data...');
            await availabilityRepository.query('DELETE FROM room_availability');
            await roomRepository.query('DELETE FROM hotel_reviews');
            await roomRepository.query('DELETE FROM hotel_bookings');
            await roomRepository.query('DELETE FROM rooms');
            await hotelRepository.query('DELETE FROM hotel_amenity_mappings');
            await hotelRepository.query('DELETE FROM hotels');
            console.log(`✅ Cleared ${existingHotels.length} existing hotels and related data`);
        }
        else {
            console.log('⏭️ No existing hotels to clear');
        }
        const amenitiesData = [
            { name: 'Free WiFi', category: 'connectivity', icon: 'wifi' },
            { name: 'Swimming Pool', category: 'recreation', icon: 'pool' },
            { name: 'Fitness Center', category: 'fitness', icon: 'gym' },
            { name: 'Spa & Wellness', category: 'wellness', icon: 'spa' },
            { name: 'Restaurant', category: 'dining', icon: 'restaurant' },
            { name: 'Room Service', category: 'dining', icon: 'room-service' },
            { name: 'Bar/Lounge', category: 'dining', icon: 'bar' },
            { name: 'Free Parking', category: 'services', icon: 'parking' },
            { name: 'Valet Parking', category: 'services', icon: 'valet' },
            { name: 'Airport Shuttle', category: 'transport', icon: 'shuttle' },
            { name: 'Business Center', category: 'business', icon: 'business' },
            { name: 'Meeting Rooms', category: 'business', icon: 'meeting' },
            { name: 'Laundry Service', category: 'services', icon: 'laundry' },
            { name: 'Concierge', category: 'services', icon: 'concierge' },
            { name: '24-Hour Front Desk', category: 'services', icon: 'front-desk' },
            { name: 'Pet Friendly', category: 'services', icon: 'pet' },
            { name: 'Air Conditioning', category: 'comfort', icon: 'ac' },
            { name: 'Hot Tub', category: 'recreation', icon: 'hot-tub' },
            { name: 'Sauna', category: 'wellness', icon: 'sauna' },
            { name: 'Tennis Court', category: 'recreation', icon: 'tennis' },
            { name: 'Golf Course', category: 'recreation', icon: 'golf' },
            { name: 'Kids Club', category: 'family', icon: 'kids' },
            { name: 'Babysitting', category: 'family', icon: 'babysitting' },
            { name: 'Beach Access', category: 'location', icon: 'beach' },
            { name: 'City Center', category: 'location', icon: 'city' }
        ];
        console.log('Creating amenities...');
        const createdAmenities = [];
        for (const amenityData of amenitiesData) {
            let amenity = await amenityRepository.findOne({ where: { name: amenityData.name } });
            if (!amenity) {
                amenity = await amenityRepository.save(amenityData);
                console.log(`✅ Created amenity: ${amenityData.name}`);
            }
            createdAmenities.push(amenity);
        }
        console.log(`📋 Available amenities: ${createdAmenities.length} total`);
        const OWNER_USER_ID = "7d53fa60-662b-4600-8eb4-ce7f2ccca38c";
        let hotelOwner = await userRepository.findOne({ where: { id: OWNER_USER_ID } });
        if (!hotelOwner) {
            console.log('⚠️ Specified user not found. Please provide a valid user ID.');
            console.log('Available users:');
            const users = await userRepository.find({ take: 5 });
            users.forEach(user => {
                console.log(`  - ${user.id} (${user.first_name} ${user.last_name} - ${user.email})`);
            });
            await app.close();
            return;
        }
        console.log(`✅ Found hotel owner: ${hotelOwner.first_name} ${hotelOwner.last_name}`);
        console.log(`Creating ${vietnam_hotels_data_1.hotels.length} authentic Vietnamese hotels...`);
        const getHotelDescription = (hotelName, city) => {
            if (hotelName.includes('Boutique') || hotelName.includes('Heritage') || hotelName.includes('Classic')) {
                return {
                    description: `Elegant boutique hotel in ${city} offering personalized service with authentic Vietnamese charm and modern comfort`,
                    rating: 4.3 + Math.random() * 0.6,
                    reviews: Math.floor(Math.random() * 500) + 200,
                    basePrice: 120 + Math.floor(Math.random() * 80)
                };
            }
            else if (hotelName.includes('Palace') || hotelName.includes('Grand') || hotelName.includes('Royal') || hotelName.includes('Somerset')) {
                return {
                    description: `Luxury hotel in the heart of ${city} featuring Vietnamese hospitality with world-class amenities and elegant décor`,
                    rating: 4.5 + Math.random() * 0.4,
                    reviews: Math.floor(Math.random() * 1000) + 500,
                    basePrice: 180 + Math.floor(Math.random() * 120)
                };
            }
            else if (hotelName.includes('Riverside') || hotelName.includes('River') || hotelName.includes('Bay')) {
                return {
                    description: `Scenic waterfront hotel in ${city} with beautiful views and peaceful atmosphere perfect for relaxation`,
                    rating: 4.2 + Math.random() * 0.5,
                    reviews: Math.floor(Math.random() * 800) + 300,
                    basePrice: 140 + Math.floor(Math.random() * 100)
                };
            }
            else if (hotelName.includes('Backpacker') || hotelName.includes('Youth')) {
                return {
                    description: `Budget-friendly hotel in ${city} perfect for travelers seeking authentic Vietnamese experience at great value`,
                    rating: 4.0 + Math.random() * 0.4,
                    reviews: Math.floor(Math.random() * 600) + 150,
                    basePrice: 60 + Math.floor(Math.random() * 60)
                };
            }
            else {
                return {
                    description: `Comfortable hotel in ${city} providing excellent Vietnamese hospitality with convenient location and modern amenities`,
                    rating: 4.1 + Math.random() * 0.5,
                    reviews: Math.floor(Math.random() * 700) + 250,
                    basePrice: 100 + Math.floor(Math.random() * 80)
                };
            }
        };
        for (const hotelData of vietnam_hotels_data_1.hotels) {
            console.log(`Creating: ${hotelData.name} in ${hotelData.city}`);
            const hotelInfo = getHotelDescription(hotelData.name, hotelData.city);
            const hotel = await hotelRepository.save({
                name: hotelData.name,
                description: hotelInfo.description,
                address: hotelData.address,
                city: hotelData.city,
                state: hotelData.city,
                zip_code: hotelData.city === 'Ho Chi Minh City' ? '700000' : hotelData.city === 'Da Nang' ? '550000' : '100000',
                country: 'Vietnam',
                phone_number: `+84-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}`,
                latitude: hotelData.latitude,
                longitude: hotelData.longitude,
                avg_rating: Math.round(hotelInfo.rating * 10) / 10,
                total_reviews: hotelInfo.reviews,
                is_active: true,
                owner_id: OWNER_USER_ID,
            });
            if (createdAmenities.length > 0) {
                const shuffledAmenities = createdAmenities.sort(() => 0.5 - Math.random());
                const hotelAmenities = shuffledAmenities.slice(0, Math.floor(Math.random() * 5) + 4);
                hotel.amenities = hotelAmenities;
                await hotelRepository.save(hotel);
            }
            const roomTypes = [
                { type: 'Standard Room', description: 'Comfortable room with traditional Vietnamese décor and modern amenities', occupancy: 2, price: hotelInfo.basePrice * 0.8, bedConfig: '1 Queen Bed', size: 28 },
                { type: 'Deluxe Suite', description: 'Spacious suite with city/nature views and premium Vietnamese hospitality', occupancy: 4, price: hotelInfo.basePrice * 1.4, bedConfig: '1 King + 1 Sofa Bed', size: 50 },
                { type: 'Vietnamese Heritage Room', description: 'Luxury room showcasing authentic Vietnamese culture and elegant design', occupancy: 2, price: hotelInfo.basePrice * 1.2, bedConfig: '1 King Bed', size: 35 }
            ];
            for (let j = 0; j < roomTypes.length; j++) {
                const roomType = roomTypes[j];
                const roomsCount = Math.floor(Math.random() * 4) + 3;
                for (let k = 1; k <= roomsCount; k++) {
                    const roomNumber = `${(j + 1) * 100 + k}`;
                    const room = await roomRepository.save({
                        room_number: roomNumber,
                        room_type: roomType.type,
                        description: roomType.description,
                        max_occupancy: roomType.occupancy,
                        bed_configuration: roomType.bedConfig,
                        size_sqm: roomType.size,
                        is_active: true,
                        hotel_id: hotel.id,
                    });
                    const startDate = new Date();
                    for (let day = 0; day < 60; day++) {
                        const currentDate = new Date(startDate);
                        currentDate.setDate(startDate.getDate() + day);
                        const dateString = currentDate.toISOString().split('T')[0];
                        const basePrice = roomType.price;
                        const priceVariation = (Math.random() - 0.5) * 0.4;
                        const finalPrice = basePrice * (1 + priceVariation);
                        const isAvailable = Math.random() > 0.1;
                        await availabilityRepository.save({
                            room_id: room.id,
                            date: dateString,
                            price_per_night: Math.round(finalPrice),
                            available_units: isAvailable ? 1 : 0,
                            total_units: 1,
                            status: isAvailable ? 'Available' : 'Booked',
                        });
                    }
                }
            }
            console.log(`✅ Created ${hotelData.name} with rooms and availability`);
        }
        console.log('🎉 Authentic Vietnamese hotels created successfully!');
        console.log(`📊 Summary:`);
        console.log(`   - Created ${vietnam_hotels_data_1.hotels.length} real Vietnamese hotels with authentic names and addresses`);
        console.log(`   - Cities: Ho Chi Minh City (${vietnam_hotels_data_1.hotels.filter(h => h.city === 'Ho Chi Minh City').length}), Hanoi (${vietnam_hotels_data_1.hotels.filter(h => h.city === 'Hanoi').length}), Da Nang (${vietnam_hotels_data_1.hotels.filter(h => h.city === 'Da Nang').length})`);
        console.log(`   - All hotels owned by user: ${OWNER_USER_ID}`);
        console.log(`   - Each hotel has 3 room types with 3-6 rooms each`);
        console.log(`   - Generated 60 days of availability data for each room`);
        console.log(`   - Hotels feature real Vietnamese addresses and GPS coordinates`);
        await app.close();
    }
    catch (error) {
        console.error('❌ Error during Vietnam hotel seeding:', error);
        process.exit(1);
    }
}
bootstrap()
    .then(() => {
    console.log('✅ Vietnam hotel seeding completed');
    process.exit(0);
})
    .catch((error) => {
    console.error('❌ Bootstrap error:', error);
    process.exit(1);
});
//# sourceMappingURL=seed-vietnam-hotels.js.map