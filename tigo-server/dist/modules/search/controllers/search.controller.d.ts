import { SearchService } from '../services/search.service';
import { IndexManagementService } from '../services/index-management.service';
import { HotelSearchService, HotelSearchQuery } from '../services/hotel-search.service';
export declare class SearchController {
    private readonly searchService;
    private readonly indexManagementService;
    private readonly hotelSearchService;
    constructor(searchService: SearchService, indexManagementService: IndexManagementService, hotelSearchService: HotelSearchService);
    healthCheck(): Promise<{
        status: string;
        cluster_name?: string;
        version?: string;
    }>;
    createIndices(): Promise<{
        message: string;
    }>;
    deleteIndex(indexName: string): Promise<{
        message: string;
    }>;
    getIndexStats(indexName: string): Promise<any>;
    searchHotels(searchQuery: HotelSearchQuery): Promise<import("../services/hotel-search.service").HotelSearchResult>;
    getAutocompleteSuggestions(query: string, limit?: number): Promise<import("../services/hotel-search.service").AutocompleteResult>;
}
