"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchModule = void 0;
const common_1 = require("@nestjs/common");
const elasticsearch_1 = require("@nestjs/elasticsearch");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const search_service_1 = require("./services/search.service");
const hotel_search_service_1 = require("./services/hotel-search.service");
const index_management_service_1 = require("./services/index-management.service");
const hotel_data_sync_service_1 = require("./services/data-sync/hotel.data-sync.service");
const search_controller_1 = require("./controllers/search.controller");
const hotel_entity_1 = require("../hotel/entities/hotel.entity");
const room_entity_1 = require("../hotel/entities/room.entity");
const hotel_amenity_entity_1 = require("../hotel/entities/hotel-amenity.entity");
const hotel_review_entity_1 = require("../hotel/entities/hotel-review.entity");
const hotel_booking_entity_1 = require("../hotel/entities/hotel-booking.entity");
const room_availability_entity_1 = require("../hotel/entities/room-availability.entity");
let SearchModule = class SearchModule {
};
exports.SearchModule = SearchModule;
exports.SearchModule = SearchModule = __decorate([
    (0, common_1.Module)({
        imports: [
            elasticsearch_1.ElasticsearchModule.registerAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => {
                    const username = configService.get('ELASTICSEARCH_USERNAME');
                    const password = configService.get('ELASTICSEARCH_PASSWORD');
                    const config = {
                        node: `http://${configService.get('ELASTICSEARCH_HOST', 'localhost')}:${configService.get('ELASTICSEARCH_PORT', 9200)}`,
                        requestTimeout: parseInt(configService.get('SEARCH_TIMEOUT', '30000')),
                    };
                    if (username && password) {
                        config.auth = {
                            username,
                            password,
                        };
                    }
                    return config;
                },
                inject: [config_1.ConfigService],
            }),
            typeorm_1.TypeOrmModule.forFeature([
                hotel_entity_1.Hotel,
                room_entity_1.Room,
                hotel_amenity_entity_1.HotelAmenity,
                hotel_review_entity_1.HotelReview,
                hotel_booking_entity_1.HotelBooking,
                room_availability_entity_1.RoomAvailability,
            ]),
        ],
        providers: [
            search_service_1.SearchService,
            hotel_search_service_1.HotelSearchService,
            index_management_service_1.IndexManagementService,
            hotel_data_sync_service_1.HotelDataSyncService,
        ],
        controllers: [search_controller_1.SearchController],
        exports: [
            search_service_1.SearchService,
            hotel_search_service_1.HotelSearchService,
            index_management_service_1.IndexManagementService,
            hotel_data_sync_service_1.HotelDataSyncService,
        ],
    })
], SearchModule);
//# sourceMappingURL=search.module.js.map