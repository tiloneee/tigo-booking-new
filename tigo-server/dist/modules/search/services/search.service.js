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
var SearchService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchService = void 0;
const common_1 = require("@nestjs/common");
const elasticsearch_1 = require("@nestjs/elasticsearch");
const config_1 = require("@nestjs/config");
let SearchService = SearchService_1 = class SearchService {
    elasticsearchService;
    configService;
    logger = new common_1.Logger(SearchService_1.name);
    indexPrefix;
    constructor(elasticsearchService, configService) {
        this.elasticsearchService = elasticsearchService;
        this.configService = configService;
        this.indexPrefix = this.configService.get('ELASTICSEARCH_INDEX_PREFIX', 'tigo_');
    }
    async healthCheck() {
        try {
            const health = await this.elasticsearchService.cluster.health();
            const info = await this.elasticsearchService.info();
            this.logger.log('Elasticsearch cluster is healthy');
            return {
                status: health.status,
                cluster_name: info.cluster_name,
                version: info.version.number,
            };
        }
        catch (error) {
            this.logger.error('Elasticsearch health check failed', error);
            return {
                status: 'unavailable',
            };
        }
    }
    getIndexName(baseName) {
        return `${this.indexPrefix}${baseName}`;
    }
    async indexExists(indexName) {
        try {
            const exists = await this.elasticsearchService.indices.exists({
                index: this.getIndexName(indexName),
            });
            return exists;
        }
        catch (error) {
            this.logger.error(`Error checking if index ${indexName} exists`, error);
            return false;
        }
    }
    async search(params) {
        try {
            const result = await this.elasticsearchService.search(params);
            return result;
        }
        catch (error) {
            this.logger.error('Search failed', error);
            throw error;
        }
    }
    async indexDocument(index, document, id) {
        try {
            const params = {
                index: this.getIndexName(index),
                body: document,
            };
            if (id) {
                params.id = id;
            }
            const result = await this.elasticsearchService.index(params);
            this.logger.debug(`Document indexed in ${index}`, { id: result._id });
            return result;
        }
        catch (error) {
            this.logger.error(`Failed to index document in ${index}`, error);
            throw error;
        }
    }
    async updateDocument(index, id, document, maxRetries = 5) {
        let lastError;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const result = await this.elasticsearchService.update({
                    index: this.getIndexName(index),
                    id,
                    body: {
                        doc: document,
                    },
                    retry_on_conflict: 3,
                });
                this.logger.debug(`Document updated in ${index}`, { id });
                return result;
            }
            catch (error) {
                lastError = error;
                const isVersionConflict = error?.meta?.statusCode === 409 ||
                    error?.message?.includes('version_conflict_engine_exception');
                if (isVersionConflict && attempt < maxRetries) {
                    const backoffMs = Math.min(50 * Math.pow(2, attempt), 1000);
                    this.logger.warn(`Version conflict updating ${index}/${id}, retrying in ${backoffMs}ms (attempt ${attempt + 1}/${maxRetries})`);
                    await this.sleep(backoffMs);
                    continue;
                }
                if (attempt === maxRetries) {
                    this.logger.error(`Failed to update document in ${index} after ${maxRetries} retries`, error);
                }
                else {
                    this.logger.error(`Failed to update document in ${index}`, error);
                }
                throw error;
            }
        }
        throw lastError;
    }
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    async deleteDocument(index, id) {
        try {
            const result = await this.elasticsearchService.delete({
                index: this.getIndexName(index),
                id,
            });
            this.logger.debug(`Document deleted from ${index}`, { id });
            return result;
        }
        catch (error) {
            this.logger.error(`Failed to delete document from ${index}`, error);
            throw error;
        }
    }
    async bulk(operations) {
        try {
            const result = await this.elasticsearchService.bulk({
                body: operations,
            });
            if (result.errors) {
                this.logger.warn('Some bulk operations failed', result.items);
            }
            return result;
        }
        catch (error) {
            this.logger.error('Bulk operation failed', error);
            throw error;
        }
    }
};
exports.SearchService = SearchService;
exports.SearchService = SearchService = SearchService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [elasticsearch_1.ElasticsearchService,
        config_1.ConfigService])
], SearchService);
//# sourceMappingURL=search.service.js.map