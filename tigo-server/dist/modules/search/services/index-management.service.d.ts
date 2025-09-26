import { ElasticsearchService } from '@nestjs/elasticsearch';
import { ConfigService } from '@nestjs/config';
import { SearchService } from './search.service';
export declare class IndexManagementService {
    private readonly elasticsearchService;
    private readonly configService;
    private readonly searchService;
    private readonly logger;
    private readonly indexPrefix;
    constructor(elasticsearchService: ElasticsearchService, configService: ConfigService, searchService: SearchService);
    createHotelIndex(): Promise<void>;
    createRoomIndex(): Promise<void>;
    createAllIndices(): Promise<void>;
    deleteIndex(indexName: string): Promise<void>;
    reindex(sourceIndex: string, targetIndex: string): Promise<void>;
    createAlias(indexName: string, aliasName: string): Promise<void>;
    getIndexStats(indexName: string): Promise<any>;
}
