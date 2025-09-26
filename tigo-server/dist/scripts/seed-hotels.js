"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const typeorm_1 = require("@nestjs/typeorm");
const app_module_1 = require("../app.module");
const bcrypt = require("bcryptjs");
const user_entity_1 = require("../modules/user/entities/user.entity");
const role_entity_1 = require("../modules/user/entities/role.entity");
const hotel_entity_1 = require("../modules/hotel/entities/hotel.entity");
const room_entity_1 = require("../modules/hotel/entities/room.entity");
const hotel_amenity_entity_1 = require("../modules/hotel/entities/hotel-amenity.entity");
const room_availability_entity_1 = require("../modules/hotel/entities/room-availability.entity");
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const userRepository = app.get((0, typeorm_1.getRepositoryToken)(user_entity_1.User));
    const roleRepository = app.get((0, typeorm_1.getRepositoryToken)(role_entity_1.Role));
    const hotelRepository = app.get((0, typeorm_1.getRepositoryToken)(hotel_entity_1.Hotel));
    const roomRepository = app.get((0, typeorm_1.getRepositoryToken)(room_entity_1.Room));
    const amenityRepository = app.get((0, typeorm_1.getRepositoryToken)(hotel_amenity_entity_1.HotelAmenity));
    const availabilityRepository = app.get((0, typeorm_1.getRepositoryToken)(room_availability_entity_1.RoomAvailability));
    console.log('🏨 Starting hotel seeding process...');
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
    const amenities = [];
    for (const amenityData of amenitiesData) {
        let amenity = await amenityRepository.findOne({ where: { name: amenityData.name } });
        if (!amenity) {
            amenity = await amenityRepository.save(amenityData);
            console.log(`✅ Created amenity: ${amenityData.name}`);
        }
        amenities.push(amenity);
    }
    const hotelOwnerRole = await roleRepository.findOne({ where: { name: 'HotelOwner' } });
    if (!hotelOwnerRole) {
        console.log('❌ HotelOwner role not found. Please run the main seed script first.');
        process.exit(1);
    }
    console.log('Creating hotel owners...');
    const hotelOwners = [];
    const ownerData = [
        { firstName: 'James', lastName: 'Anderson', email: 'james.anderson@luxuryhotels.com' },
        { firstName: 'Maria', lastName: 'Rodriguez', email: 'maria.rodriguez@boutiquehotels.com' },
        { firstName: 'David', lastName: 'Chen', email: 'david.chen@premiumresorts.com' },
        { firstName: 'Sarah', lastName: 'Johnson', email: 'sarah.johnson@grandhotels.com' },
        { firstName: 'Michael', lastName: 'Brown', email: 'michael.brown@oceanview.com' },
        { firstName: 'Emily', lastName: 'Davis', email: 'emily.davis@mountainresorts.com' },
        { firstName: 'Robert', lastName: 'Wilson', email: 'robert.wilson@cityhotels.com' },
        { firstName: 'Lisa', lastName: 'Taylor', email: 'lisa.taylor@luxurysuites.com' },
        { firstName: 'John', lastName: 'Thomas', email: 'john.thomas@beachresorts.com' },
        { firstName: 'Anna', lastName: 'Martinez', email: 'anna.martinez@historichotels.com' }
    ];
    for (const owner of ownerData) {
        let user = await userRepository.findOne({ where: { email: owner.email } });
        if (!user) {
            const hashedPassword = await bcrypt.hash('password123', 10);
            user = await userRepository.save({
                first_name: owner.firstName,
                last_name: owner.lastName,
                email: owner.email,
                password_hash: hashedPassword,
                is_active: true,
                roles: [hotelOwnerRole]
            });
            console.log(`✅ Created hotel owner: ${owner.firstName} ${owner.lastName}`);
        }
        hotelOwners.push(user);
    }
    console.log('Creating hotels...');
    const hotelsData = [
        { name: 'The Grand Palazzo Venice', city: 'Venice', state: 'Veneto', country: 'Italy', description: 'A magnificent 5-star luxury hotel overlooking the Grand Canal, featuring opulent Venetian decor and world-class amenities.', rating: 4.9, reviews: 1247, lat: 45.4408, lon: 12.3155, price: 850 },
        { name: 'Château de Lumière', city: 'Provence', state: 'PACA', country: 'France', description: 'Historic château surrounded by lavender fields, offering an exclusive luxury experience in the heart of Provence.', rating: 4.8, reviews: 892, lat: 43.9493, lon: 4.8055, price: 1200 },
        { name: 'The Mandarin Oriental Tokyo', city: 'Tokyo', state: 'Tokyo', country: 'Japan', description: 'Ultra-modern luxury hotel in the heart of Tokyo, combining Japanese hospitality with contemporary elegance.', rating: 4.9, reviews: 2156, lat: 35.6762, lon: 139.6503, price: 950 },
        { name: 'The Plaza New York', city: 'New York', state: 'NY', country: 'USA', description: 'Iconic luxury hotel at the corner of Fifth Avenue and Central Park South, a timeless symbol of New York elegance.', rating: 4.7, reviews: 3421, lat: 40.7614, lon: -73.9776, price: 1100 },
        { name: 'The Savoy London', city: 'London', state: 'England', country: 'UK', description: 'Legendary luxury hotel on the Strand, combining Edwardian grandeur with modern sophistication.', rating: 4.8, reviews: 2847, lat: 51.5101, lon: -0.1197, price: 900 },
        { name: 'Maldives Paradise Resort', city: 'Malé', state: 'Kaafu', country: 'Maldives', description: 'Overwater villas and pristine beaches in a tropical paradise, perfect for romantic getaways.', rating: 4.9, reviews: 1654, lat: 4.1755, lon: 73.5093, price: 2500 },
        { name: 'Santorini Sunset Villa', city: 'Santorini', state: 'Cyclades', country: 'Greece', description: 'Cliffside luxury villas with stunning sunset views over the Aegean Sea.', rating: 4.8, reviews: 934, lat: 36.3932, lon: 25.4615, price: 650 },
        { name: 'Bora Bora Pearl Resort', city: 'Bora Bora', state: 'Society Islands', country: 'French Polynesia', description: 'Luxurious overwater bungalows in one of the world\'s most beautiful lagoons.', rating: 4.9, reviews: 743, lat: -16.5004, lon: -151.7415, price: 1800 },
        { name: 'Amalfi Coast Retreat', city: 'Positano', state: 'Campania', country: 'Italy', description: 'Cliffside boutique hotel with breathtaking views of the Mediterranean coastline.', rating: 4.7, reviews: 1123, lat: 40.6280, lon: 14.4858, price: 750 },
        { name: 'Maui Grand Resort', city: 'Wailea', state: 'HI', country: 'USA', description: 'Oceanfront luxury resort with pristine beaches and world-class spa facilities.', rating: 4.8, reviews: 2234, lat: 20.6947, lon: -156.4442, price: 850 },
        { name: 'Swiss Alps Grand Hotel', city: 'Zermatt', state: 'Valais', country: 'Switzerland', description: 'Luxury alpine resort with stunning Matterhorn views and world-class skiing.', rating: 4.9, reviews: 1567, lat: 46.0207, lon: 7.7491, price: 1100 },
        { name: 'Rocky Mountain Lodge', city: 'Aspen', state: 'CO', country: 'USA', description: 'Exclusive mountain retreat offering luxury accommodations and outdoor adventures.', rating: 4.8, reviews: 1876, lat: 39.1911, lon: -106.8175, price: 950 },
        { name: 'Banff Springs Castle', city: 'Banff', state: 'AB', country: 'Canada', description: 'Fairytale castle hotel in the Canadian Rockies with breathtaking mountain vistas.', rating: 4.7, reviews: 2145, lat: 51.1784, lon: -115.5708, price: 650 },
        { name: 'Himalayan Retreat', city: 'Shimla', state: 'Himachal Pradesh', country: 'India', description: 'Luxury mountain resort offering serene views and authentic Himalayan hospitality.', rating: 4.6, reviews: 892, lat: 31.1048, lon: 77.1734, price: 350 },
        { name: 'Singapore Marina Luxury', city: 'Singapore', state: 'Singapore', country: 'Singapore', description: 'Ultra-modern hotel with infinity pool and panoramic city skyline views.', rating: 4.8, reviews: 3245, lat: 1.2966, lon: 103.8547, price: 450 },
        { name: 'Dubai Burj Vista Hotel', city: 'Dubai', state: 'Dubai', country: 'UAE', description: 'Luxury high-rise hotel with views of Burj Khalifa and Dubai Fountain.', rating: 4.7, reviews: 2156, lat: 25.1972, lon: 55.2744, price: 800 },
        { name: 'Sydney Harbour Grand', city: 'Sydney', state: 'NSW', country: 'Australia', description: 'Premier waterfront hotel with spectacular harbor and Opera House views.', rating: 4.8, reviews: 2987, lat: -33.8568, lon: 151.2153, price: 550 },
        { name: 'Manhattan Midtown Elite', city: 'New York', state: 'NY', country: 'USA', description: 'Sophisticated business hotel in the heart of Midtown Manhattan.', rating: 4.6, reviews: 4123, lat: 40.7589, lon: -73.9851, price: 400 },
        { name: 'Barcelona Gothic Quarter', city: 'Barcelona', state: 'Catalonia', country: 'Spain', description: 'Boutique hotel in the historic Gothic Quarter with modern Catalan design.', rating: 4.7, reviews: 1654, lat: 41.3851, lon: 2.1734, price: 320 },
        { name: 'Prague Castle View Hotel', city: 'Prague', state: 'Prague', country: 'Czech Republic', description: 'Historic hotel with views of Prague Castle and the Charles Bridge.', rating: 4.6, reviews: 1432, lat: 50.0755, lon: 14.4378, price: 280 },
        { name: 'Edinburgh Royal Mile Inn', city: 'Edinburgh', state: 'Scotland', country: 'UK', description: 'Historic Georgian hotel on the famous Royal Mile with castle views.', rating: 4.5, reviews: 987, lat: 55.9533, lon: -3.1883, price: 250 },
        { name: 'Vienna Imperial Palace', city: 'Vienna', state: 'Vienna', country: 'Austria', description: 'Grand hotel near Schönbrunn Palace with imperial Austrian elegance.', rating: 4.7, reviews: 1765, lat: 48.2082, lon: 16.3738, price: 380 },
        { name: 'Rome Colosseum Heritage', city: 'Rome', state: 'Lazio', country: 'Italy', description: 'Luxury hotel steps from the Colosseum with ancient Roman inspired decor.', rating: 4.6, reviews: 2234, lat: 41.8902, lon: 12.4922, price: 450 },
        { name: 'Brooklyn Heights Boutique', city: 'Brooklyn', state: 'NY', country: 'USA', description: 'Trendy boutique hotel in historic Brooklyn Heights with Manhattan views.', rating: 4.5, reviews: 1123, lat: 40.6955, lon: -73.9937, price: 320 },
        { name: 'Portland Pearl District', city: 'Portland', state: 'OR', country: 'USA', description: 'Hip boutique hotel in the Pearl District with locally-inspired design.', rating: 4.4, reviews: 876, lat: 45.5152, lon: -122.6784, price: 280 },
        { name: 'Amsterdam Canal House', city: 'Amsterdam', state: 'North Holland', country: 'Netherlands', description: 'Intimate canal-side hotel in a restored 17th-century townhouse.', rating: 4.6, reviews: 754, lat: 52.3676, lon: 4.9041, price: 350 },
        { name: 'Kyoto Traditional Ryokan', city: 'Kyoto', state: 'Kyoto', country: 'Japan', description: 'Authentic Japanese ryokan with tatami rooms and traditional kaiseki dining.', rating: 4.7, reviews: 623, lat: 35.0116, lon: 135.7681, price: 400 },
        { name: 'Frankfurt Business Center', city: 'Frankfurt', state: 'Hesse', country: 'Germany', description: 'Modern business hotel near the financial district with conference facilities.', rating: 4.3, reviews: 1876, lat: 50.1109, lon: 8.6821, price: 220 },
        { name: 'Hong Kong Central Plaza', city: 'Hong Kong', state: 'Hong Kong', country: 'China', description: 'Executive hotel in Central district with harbor views and business amenities.', rating: 4.5, reviews: 2341, lat: 22.3193, lon: 114.1694, price: 380 },
        { name: 'Zurich Executive Suites', city: 'Zurich', state: 'Zurich', country: 'Switzerland', description: 'Premium business hotel near the financial quarter with lake views.', rating: 4.4, reviews: 1456, lat: 47.3769, lon: 8.5417, price: 450 },
        { name: 'Sahara Desert Camp', city: 'Merzouga', state: 'Errachidia', country: 'Morocco', description: 'Luxury desert camp with traditional Berber tents and camel safaris.', rating: 4.6, reviews: 543, lat: 31.0801, lon: -4.0133, price: 300 },
        { name: 'Rajasthan Palace Hotel', city: 'Udaipur', state: 'Rajasthan', country: 'India', description: 'Converted maharaja palace on Lake Pichola with royal Indian hospitality.', rating: 4.8, reviews: 1234, lat: 24.5854, lon: 73.7125, price: 400 },
        { name: 'Serengeti Safari Lodge', city: 'Serengeti', state: 'Arusha', country: 'Tanzania', description: 'Luxury safari lodge with panoramic savanna views and wildlife experiences.', rating: 4.7, reviews: 432, lat: -2.3333, lon: 34.8333, price: 850 },
        { name: 'Seychelles Paradise Bay', city: 'Victoria', state: 'Mahé', country: 'Seychelles', description: 'Exclusive beachfront resort with pristine white sand and crystal-clear waters.', rating: 4.9, reviews: 765, lat: -4.6574, lon: 55.4540, price: 1200 },
        { name: 'Bali Luxury Retreat', city: 'Ubud', state: 'Bali', country: 'Indonesia', description: 'Jungle retreat with infinity pools overlooking rice terraces and volcanic mountains.', rating: 4.8, reviews: 1987, lat: -8.5069, lon: 115.2625, price: 450 },
        { name: 'Fiji Coral Coast Resort', city: 'Coral Coast', state: 'Viti Levu', country: 'Fiji', description: 'Oceanfront resort with coral reef access and traditional Fijian culture.', rating: 4.6, reviews: 876, lat: -18.1248, lon: 178.4501, price: 600 },
        { name: 'Napa Valley Vineyard Inn', city: 'Napa', state: 'CA', country: 'USA', description: 'Luxury inn surrounded by vineyards with wine tastings and farm-to-table dining.', rating: 4.7, reviews: 1543, lat: 38.2975, lon: -122.2869, price: 500 },
        { name: 'Tuscany Wine Estate', city: 'Montalcino', state: 'Tuscany', country: 'Italy', description: 'Historic wine estate with panoramic countryside views and cellar tours.', rating: 4.8, reviews: 987, lat: 43.0541, lon: 11.4894, price: 650 },
        { name: 'Bordeaux Château Hotel', city: 'Bordeaux', state: 'Nouvelle-Aquitaine', country: 'France', description: 'Elegant château hotel in the heart of wine country with private tastings.', rating: 4.6, reviews: 734, lat: 44.8378, lon: -0.5792, price: 420 },
        { name: 'Costa Rica Wellness Retreat', city: 'Manuel Antonio', state: 'Puntarenas', country: 'Costa Rica', description: 'Eco-luxury wellness resort in tropical rainforest with spa and yoga programs.', rating: 4.7, reviews: 654, lat: 9.3902, lon: -84.1464, price: 380 },
        { name: 'Thai Spa Resort', city: 'Koh Samui', state: 'Surat Thani', country: 'Thailand', description: 'Beachfront spa resort offering traditional Thai wellness treatments and meditation.', rating: 4.6, reviews: 1123, lat: 9.5018, lon: 99.9648, price: 280 },
        { name: 'Arizona Desert Spa', city: 'Scottsdale', state: 'AZ', country: 'USA', description: 'Desert oasis spa resort with Native American healing traditions and golf.', rating: 4.5, reviews: 1876, lat: 33.4942, lon: -111.9261, price: 450 },
        { name: 'Patagonia Base Camp', city: 'El Calafate', state: 'Santa Cruz', country: 'Argentina', description: 'Adventure lodge near glaciers with trekking, kayaking, and wildlife expeditions.', rating: 4.4, reviews: 432, lat: -50.3381, lon: -72.2676, price: 320 },
        { name: 'Iceland Northern Lights Hotel', city: 'Reykjavik', state: 'Capital Region', country: 'Iceland', description: 'Modern hotel with aurora viewing dome and geothermal spa experiences.', rating: 4.6, reviews: 876, lat: 64.1466, lon: -21.9426, price: 400 },
        { name: 'New Zealand Adventure Lodge', city: 'Queenstown', state: 'Otago', country: 'New Zealand', description: 'Lakeside lodge with extreme sports activities and Southern Alps views.', rating: 4.7, reviews: 1234, lat: -45.0312, lon: 168.6626, price: 350 },
        { name: 'Angkor Temple Resort', city: 'Siem Reap', state: 'Siem Reap', country: 'Cambodia', description: 'Luxury resort near Angkor Wat with Khmer architecture and cultural experiences.', rating: 4.5, reviews: 987, lat: 13.3671, lon: 103.8448, price: 250 },
        { name: 'Marrakech Riad Palace', city: 'Marrakech', state: 'Marrakech-Safi', country: 'Morocco', description: 'Traditional riad in the medina with rooftop terrace and authentic Moroccan design.', rating: 4.6, reviews: 1456, lat: 31.6295, lon: -7.9811, price: 180 },
        { name: 'Istanbul Bosphorus View', city: 'Istanbul', state: 'Istanbul', country: 'Turkey', description: 'Historic hotel with Bosphorus views bridging European and Asian cultures.', rating: 4.4, reviews: 2134, lat: 41.0082, lon: 28.9784, price: 220 },
        { name: 'Lake Como Villa Hotel', city: 'Bellagio', state: 'Lombardy', country: 'Italy', description: 'Elegant villa hotel on Lake Como with terraced gardens and mountain views.', rating: 4.8, reviews: 1123, lat: 45.9777, lon: 9.2577, price: 750 },
        { name: 'Banff Lake Louise Château', city: 'Lake Louise', state: 'AB', country: 'Canada', description: 'Iconic château on pristine glacial lake surrounded by snow-capped peaks.', rating: 4.7, reviews: 1654, lat: 51.4254, lon: -116.2107, price: 550 },
        { name: 'Lake Bled Castle Hotel', city: 'Bled', state: 'Upper Carniola', country: 'Slovenia', description: 'Fairytale hotel overlooking Lake Bled with its famous island church.', rating: 4.5, reviews: 876, lat: 46.3683, lon: 14.1141, price: 280 }
    ];
    for (let i = 0; i < hotelsData.length; i++) {
        const hotelData = hotelsData[i];
        const owner = hotelOwners[i % hotelOwners.length];
        console.log(`Creating hotel: ${hotelData.name}`);
        let hotel = await hotelRepository.findOne({ where: { name: hotelData.name } });
        if (!hotel) {
            hotel = await hotelRepository.save({
                name: hotelData.name,
                description: hotelData.description,
                address: `${Math.floor(Math.random() * 999) + 1} Main Street`,
                city: hotelData.city,
                state: hotelData.state,
                zip_code: String(Math.floor(Math.random() * 90000) + 10000),
                country: hotelData.country,
                phone_number: `+1-555-${Math.floor(Math.random() * 9000) + 1000}`,
                latitude: hotelData.lat,
                longitude: hotelData.lon,
                avg_rating: hotelData.rating,
                total_reviews: hotelData.reviews,
                is_active: true,
                owner_id: owner.id,
            });
            console.log(`✅ Created hotel: ${hotelData.name}`);
        }
        const shuffledAmenities = amenities.sort(() => 0.5 - Math.random());
        const hotelAmenities = shuffledAmenities.slice(0, Math.floor(Math.random() * 6) + 5);
        hotel.amenities = hotelAmenities;
        await hotelRepository.save(hotel);
        const roomTypes = [
            { type: 'Standard King', description: 'Comfortable king bed room with city views', occupancy: 2, price: hotelData.price * 0.7, bedConfig: '1 King Bed', size: 35 },
            { type: 'Deluxe Queen', description: 'Spacious queen bed room with premium amenities', occupancy: 2, price: hotelData.price * 0.8, bedConfig: '1 Queen Bed', size: 40 },
            { type: 'Family Suite', description: 'Large suite perfect for families with separate living area', occupancy: 4, price: hotelData.price * 1.2, bedConfig: '1 King + 1 Sofa Bed', size: 60 },
            { type: 'Executive Suite', description: 'Luxurious suite with panoramic views and premium services', occupancy: 3, price: hotelData.price * 1.5, bedConfig: '1 King + 1 Single', size: 75 },
            { type: 'Presidential Suite', description: 'Ultimate luxury experience with butler service and private terrace', occupancy: 4, price: hotelData.price * 2.5, bedConfig: '2 King Beds + Living Room', size: 120 }
        ];
        for (let j = 0; j < roomTypes.length; j++) {
            const roomType = roomTypes[j];
            const roomsCount = Math.floor(Math.random() * 8) + 3;
            for (let k = 1; k <= roomsCount; k++) {
                const roomNumber = `${(j + 1) * 100 + k}`;
                let room = await roomRepository.findOne({
                    where: { hotel_id: hotel.id, room_number: roomNumber }
                });
                if (!room) {
                    room = await roomRepository.save({
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
                    for (let day = 0; day < 365; day++) {
                        const currentDate = new Date(startDate);
                        currentDate.setDate(startDate.getDate() + day);
                        const dateString = currentDate.toISOString().split('T')[0];
                        const basePrice = roomType.price;
                        const priceVariation = (Math.random() - 0.5) * 0.4;
                        const finalPrice = basePrice * (1 + priceVariation);
                        const isAvailable = Math.random() > 0.1;
                        const availableUnits = isAvailable ? 1 : 0;
                        const status = isAvailable ? 'Available' : 'Booked';
                        await availabilityRepository.save({
                            room_id: room.id,
                            date: dateString,
                            price_per_night: Math.round(finalPrice),
                            available_units: availableUnits,
                            total_units: 1,
                            status: status,
                        });
                    }
                }
            }
        }
        console.log(`✅ Completed hotel with rooms and availability: ${hotelData.name}`);
    }
    console.log('🎉 Hotel seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Created ${amenitiesData.length} amenities`);
    console.log(`   - Created ${ownerData.length} hotel owners`);
    console.log(`   - Created ${hotelsData.length} hotels`);
    console.log(`   - Each hotel has 5 room types with 3-10 rooms each`);
    console.log(`   - Generated 365 days of availability data for each room`);
    await app.close();
}
bootstrap()
    .then(() => process.exit(0))
    .catch((error) => {
    console.error('Error during hotel seeding:', error);
    process.exit(1);
});
//# sourceMappingURL=seed-hotels.js.map