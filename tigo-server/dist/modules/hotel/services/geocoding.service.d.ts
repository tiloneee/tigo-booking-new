export declare class GeocodingService {
    private readonly logger;
    geocodeAddress(address: string, city: string, state: string, country: string): Promise<{
        latitude: number;
        longitude: number;
    } | null>;
    calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number;
    private toRadians;
}
