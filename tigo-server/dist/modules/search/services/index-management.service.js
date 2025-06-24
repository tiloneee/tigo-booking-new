"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var IndexManagementService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndexManagementService = void 0;
const common_1 = require("@nestjs/common");
const elasticsearch_1 = require("@nestjs/elasticsearch");
const config_1 = require("@nestjs/config");
const search_service_1 = require("./search.service");
let IndexManagementService = IndexManagementService_1 = class IndexManagementService {
    elasticsearchService;
    configService;
    searchService;
    logger = new common_1.Logger(IndexManagementService_1.name);
    indexPrefix;
    constructor(elasticsearchService, configService, searchService) {
        this.elasticsearchService = elasticsearchService;
        this.configService = configService;
        this.searchService = searchService;
        this.indexPrefix = this.configService.get('ELASTICSEARCH_INDEX_PREFIX', 'tigo_');
    }
    async createHotelIndex() {
        const indexName = this.searchService.getIndexName('hotels');
        try {
            const exists = await this.searchService.indexExists('hotels');
            if (exists) {
                this.logger.log(`Index ${indexName} already exists`);
                return;
            }
            await this.elasticsearchService.indices.create({
                index: indexName,
                settings: {
                    number_of_shards: 1,
                    number_of_replicas: 0,
                    analysis: {
                        analyzer: {
                            hotel_name_analyzer: {
                                type: 'custom',
                                tokenizer: 'standard',
                                filter: ['lowercase', 'asciifolding'],
                            },
                            autocomplete_analyzer: {
                                type: 'custom',
                                tokenizer: 'keyword',
                                filter: ['lowercase', 'edge_ngram'],
                            },
                        },
                        filter: {
                            edge_ngram: {
                                type: 'edge_ngram',
                                min_gram: 1,
                                max_gram: 20,
                            },
                        },
                    },
                },
                mappings: {
                    properties: {
                        id: { type: 'keyword' },
                        name: {
                            type: 'text',
                            analyzer: 'hotel_name_analyzer',
                            fields: {
                                keyword: { type: 'keyword' },
                                suggest: {
                                    type: 'completion',
                                    analyzer: 'autocomplete_analyzer',
                                },
                            },
                        },
                        description: {
                            type: 'text',
                            analyzer: 'standard',
                        },
                        location: {
                            properties: {
                                coordinates: { type: 'geo_point' },
                                address: { type: 'text' },
                                city: {
                                    type: 'keyword',
                                    fields: {
                                        text: { type: 'text' },
                                    },
                                },
                                state: { type: 'keyword' },
                                country: { type: 'keyword' },
                            },
                        },
                        amenities: {
                            type: 'nested',
                            properties: {
                                id: { type: 'keyword' },
                                name: { type: 'keyword' },
                                category: { type: 'keyword' },
                            },
                        },
                        pricing: {
                            properties: {
                                min_price: { type: 'double' },
                                max_price: { type: 'double' },
                                currency: { type: 'keyword' },
                            },
                        },
                        ratings: {
                            properties: {
                                average: { type: 'float' },
                                count: { type: 'integer' },
                                distribution: {
                                    properties: {
                                        '1': { type: 'integer' },
                                        '2': { type: 'integer' },
                                        '3': { type: 'integer' },
                                        '4': { type: 'integer' },
                                        '5': { type: 'integer' },
                                    },
                                },
                            },
                        },
                        availability: {
                            type: 'nested',
                            properties: {
                                date: { type: 'date' },
                                available_rooms: { type: 'integer' },
                                min_price: { type: 'double' },
                            },
                        },
                        owner_id: { type: 'keyword' },
                        phone_number: { type: 'keyword' },
                        created_at: { type: 'date' },
                        updated_at: { type: 'date' },
                        is_active: { type: 'boolean' },
                    },
                },
            });
            this.logger.log(`Hotel index ${indexName} created successfully`);
        }
        catch (error) {
            this.logger.error(`Failed to create hotel index ${indexName}`, error);
            throw error;
        }
    }
    async createRoomIndex() {
        const indexName = this.searchService.getIndexName('rooms');
        try {
            const exists = await this.searchService.indexExists('rooms');
            if (exists) {
                this.logger.log(`Index ${indexName} already exists`);
                return;
            }
            await this.elasticsearchService.indices.create({
                index: indexName,
                settings: {
                    number_of_shards: 1,
                    number_of_replicas: 0,
                },
                mappings: {
                    properties: {
                        id: { type: 'keyword' },
                        hotel_id: { type: 'keyword' },
                        room_number: { type: 'keyword' },
                        room_type: {
                            type: 'keyword',
                            fields: {
                                text: { type: 'text' },
                            },
                        },
                        description: { type: 'text' },
                        max_occupancy: { type: 'integer' },
                        bed_configuration: { type: 'keyword' },
                        size_sqm: { type: 'double' },
                        availability: {
                            type: 'nested',
                            properties: {
                                date: { type: 'date' },
                                price_per_night: { type: 'double' },
                                available_units: { type: 'integer' },
                                status: { type: 'keyword' },
                            },
                        },
                        created_at: { type: 'date' },
                        updated_at: { type: 'date' },
                        is_active: { type: 'boolean' },
                    },
                },
            });
            this.logger.log(`Room index ${indexName} created successfully`);
        }
        catch (error) {
            this.logger.error(`Failed to create room index ${indexName}`, error);
            throw error;
        }
    }
    async createAllIndices() {
        try {
            await this.createHotelIndex();
            await this.createRoomIndex();
            this.logger.log('All indices created successfully');
        }
        catch (error) {
            this.logger.error('Failed to create all indices', error);
            throw error;
        }
    }
    async deleteIndex(indexName) {
        const fullIndexName = this.searchService.getIndexName(indexName);
        try {
            const exists = await this.searchService.indexExists(indexName);
            if (!exists) {
                this.logger.log(`Index ${fullIndexName} does not exist`);
                return;
            }
            await this.elasticsearchService.indices.delete({
                index: fullIndexName,
            });
            this.logger.log(`Index ${fullIndexName} deleted successfully`);
        }
        catch (error) {
            this.logger.error(`Failed to delete index ${fullIndexName}`, error);
            throw error;
        }
    }
    async reindex(sourceIndex, targetIndex) {
        try {
            const result = await this.elasticsearchService.reindex({
                source: {
                    index: this.searchService.getIndexName(sourceIndex),
                },
                dest: {
                    index: this.searchService.getIndexName(targetIndex),
                },
            });
            this.logger.log(`Reindexing completed from ${sourceIndex} to ${targetIndex}`, result);
        }
        catch (error) {
            this.logger.error(`Failed to reindex from ${sourceIndex} to ${targetIndex}`, error);
            throw error;
        }
    }
    async createAlias(indexName, aliasName) {
        try {
            await this.elasticsearchService.indices.putAlias({
                index: this.searchService.getIndexName(indexName),
                name: this.searchService.getIndexName(aliasName),
            });
            this.logger.log(`Alias ${aliasName} created for index ${indexName}`);
        }
        catch (error) {
            this.logger.error(`Failed to create alias ${aliasName} for index ${indexName}`, error);
            throw error;
        }
    }
    async getIndexStats(indexName) {
        try {
            const stats = await this.elasticsearchService.indices.stats({
                index: this.searchService.getIndexName(indexName),
            });
            return stats;
        }
        catch (error) {
            this.logger.error(`Failed to get stats for index ${indexName}`, error);
            throw error;
        }
    }
};
exports.IndexManagementService = IndexManagementService;
exports.IndexManagementService = IndexManagementService = IndexManagementService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [elasticsearch_1.ElasticsearchService,
        config_1.ConfigService,
        search_service_1.SearchService])
], IndexManagementService);
//# sourceMappingURL=index-management.service.js.map