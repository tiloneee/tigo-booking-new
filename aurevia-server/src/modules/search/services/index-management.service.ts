import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { ConfigService } from '@nestjs/config';
import { SearchService } from './search.service';

@Injectable()
export class IndexManagementService {
  private readonly logger = new Logger(IndexManagementService.name);
  private readonly indexPrefix: string;

  constructor(
    private readonly elasticsearchService: ElasticsearchService,
    private readonly configService: ConfigService,
    private readonly searchService: SearchService,
  ) {
    this.indexPrefix = this.configService.get(
      'ELASTICSEARCH_INDEX_PREFIX',
      'tigo_',
    );
  }

  /**
   * Create hotel index with proper mapping
   */
  async createHotelIndex(): Promise<void> {
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
    } catch (error) {
      this.logger.error(`Failed to create hotel index ${indexName}`, error);
      throw error;
    }
  }

  /**
   * Create room index with proper mapping
   */
  async createRoomIndex(): Promise<void> {
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
    } catch (error) {
      this.logger.error(`Failed to create room index ${indexName}`, error);
      throw error;
    }
  }

  /**
   * Create all indices
   */
  async createAllIndices(): Promise<void> {
    try {
      await this.createHotelIndex();
      await this.createRoomIndex();
      this.logger.log('All indices created successfully');
    } catch (error) {
      this.logger.error('Failed to create all indices', error);
      throw error;
    }
  }

  /**
   * Delete an index
   */
  async deleteIndex(indexName: string): Promise<void> {
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
    } catch (error) {
      this.logger.error(`Failed to delete index ${fullIndexName}`, error);
      throw error;
    }
  }

  /**
   * Reindex data (for zero-downtime updates)
   */
  async reindex(sourceIndex: string, targetIndex: string): Promise<void> {
    try {
      const result = await this.elasticsearchService.reindex({
        source: {
          index: this.searchService.getIndexName(sourceIndex),
        },
        dest: {
          index: this.searchService.getIndexName(targetIndex),
        },
      });

      this.logger.log(
        `Reindexing completed from ${sourceIndex} to ${targetIndex}`,
        result,
      );
    } catch (error) {
      this.logger.error(
        `Failed to reindex from ${sourceIndex} to ${targetIndex}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Create index alias
   */
  async createAlias(indexName: string, aliasName: string): Promise<void> {
    try {
      await this.elasticsearchService.indices.putAlias({
        index: this.searchService.getIndexName(indexName),
        name: this.searchService.getIndexName(aliasName),
      });

      this.logger.log(`Alias ${aliasName} created for index ${indexName}`);
    } catch (error) {
      this.logger.error(
        `Failed to create alias ${aliasName} for index ${indexName}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get index statistics
   */
  async getIndexStats(indexName: string): Promise<any> {
    try {
      const stats = await this.elasticsearchService.indices.stats({
        index: this.searchService.getIndexName(indexName),
      });
      return stats;
    } catch (error) {
      this.logger.error(`Failed to get stats for index ${indexName}`, error);
      throw error;
    }
  }
}
