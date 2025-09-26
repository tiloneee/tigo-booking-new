import { ElasticsearchService } from '@nestjs/elasticsearch';
import { ConfigService } from '@nestjs/config';
export declare class SearchService {
    private readonly elasticsearchService;
    private readonly configService;
    private readonly logger;
    private readonly indexPrefix;
    constructor(elasticsearchService: ElasticsearchService, configService: ConfigService);
    healthCheck(): Promise<{
        status: string;
        cluster_name?: string;
        version?: string;
    }>;
    getIndexName(baseName: string): string;
    indexExists(indexName: string): Promise<boolean>;
    search(params: any): Promise<any>;
    indexDocument(index: string, document: any, id?: string): Promise<any>;
    updateDocument(index: string, id: string, document: any): Promise<any>;
    deleteDocument(index: string, id: string): Promise<any>;
    bulk(operations: any[]): Promise<any>;
}
