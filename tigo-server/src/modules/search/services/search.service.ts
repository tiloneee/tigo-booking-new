import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private readonly indexPrefix: string;

  constructor(
    private readonly elasticsearchService: ElasticsearchService,
    private readonly configService: ConfigService,
  ) {
    this.indexPrefix = this.configService.get(
      'ELASTICSEARCH_INDEX_PREFIX',
      'tigo_',
    );
  }

  /**
   * Check if Elasticsearch cluster is healthy
   */
  async healthCheck(): Promise<{
    status: string;
    cluster_name?: string;
    version?: string;
  }> {
    try {
      const health = await this.elasticsearchService.cluster.health();
      const info = await this.elasticsearchService.info();

      this.logger.log('Elasticsearch cluster is healthy');
      return {
        status: health.status,
        cluster_name: info.cluster_name,
        version: info.version.number,
      };
    } catch (error) {
      this.logger.error('Elasticsearch health check failed', error);
      return {
        status: 'unavailable',
      };
    }
  }

  /**
   * Get index name with prefix
   */
  getIndexName(baseName: string): string {
    return `${this.indexPrefix}${baseName}`;
  }

  /**
   * Check if index exists
   */
  async indexExists(indexName: string): Promise<boolean> {
    try {
      const exists = await this.elasticsearchService.indices.exists({
        index: this.getIndexName(indexName),
      });
      return exists;
    } catch (error) {
      this.logger.error(`Error checking if index ${indexName} exists`, error);
      return false;
    }
  }

  /**
   * Generic search method
   */
  async search(params: any): Promise<any> {
    try {
      const result = await this.elasticsearchService.search(params);
      return result;
    } catch (error) {
      this.logger.error('Search failed', error);
      throw error;
    }
  }

  /**
   * Generic index document method
   */
  async indexDocument(index: string, document: any, id?: string): Promise<any> {
    try {
      const params: any = {
        index: this.getIndexName(index),
        body: document,
      };

      if (id) {
        params.id = id;
      }

      const result = await this.elasticsearchService.index(params);
      this.logger.debug(`Document indexed in ${index}`, { id: result._id });
      return result;
    } catch (error) {
      this.logger.error(`Failed to index document in ${index}`, error);
      throw error;
    }
  }

  /**
   * Generic update document method with retry logic for version conflicts
   */
  async updateDocument(
    index: string,
    id: string,
    document: any,
    maxRetries: number = 5,
  ): Promise<any> {
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.elasticsearchService.update({
          index: this.getIndexName(index),
          id,
          body: {
            doc: document,
          },
          retry_on_conflict: 3, // Elasticsearch built-in retry
        });
        this.logger.debug(`Document updated in ${index}`, { id });
        return result;
      } catch (error: any) {
        lastError = error;

        // Check if it's a version conflict error
        const isVersionConflict =
          error?.meta?.statusCode === 409 ||
          error?.message?.includes('version_conflict_engine_exception');

        if (isVersionConflict && attempt < maxRetries) {
          // Exponential backoff: 50ms, 100ms, 200ms, 400ms, 800ms
          const backoffMs = Math.min(50 * Math.pow(2, attempt), 1000);
          this.logger.warn(
            `Version conflict updating ${index}/${id}, retrying in ${backoffMs}ms (attempt ${attempt + 1}/${maxRetries})`,
          );
          await this.sleep(backoffMs);
          continue;
        }

        // If it's not a version conflict or we've exhausted retries, throw
        if (attempt === maxRetries) {
          this.logger.error(
            `Failed to update document in ${index} after ${maxRetries} retries`,
            error,
          );
        } else {
          this.logger.error(`Failed to update document in ${index}`, error);
        }
        throw error;
      }
    }

    throw lastError;
  }

  /**
   * Sleep utility for retry backoff
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Generic delete document method
   */
  async deleteDocument(index: string, id: string): Promise<any> {
    try {
      const result = await this.elasticsearchService.delete({
        index: this.getIndexName(index),
        id,
      });
      this.logger.debug(`Document deleted from ${index}`, { id });
      return result;
    } catch (error) {
      this.logger.error(`Failed to delete document from ${index}`, error);
      throw error;
    }
  }

  /**
   * Bulk operations
   */
  async bulk(operations: any[]): Promise<any> {
    try {
      const result = await this.elasticsearchService.bulk({
        body: operations,
      });

      if (result.errors) {
        this.logger.warn('Some bulk operations failed', result.items);
      }

      return result;
    } catch (error) {
      this.logger.error('Bulk operation failed', error);
      throw error;
    }
  }
}
