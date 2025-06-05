"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var GeocodingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeocodingService = void 0;
const common_1 = require("@nestjs/common");
let GeocodingService = GeocodingService_1 = class GeocodingService {
    logger = new common_1.Logger(GeocodingService_1.name);
    async geocodeAddress(address, city, state, country) {
        try {
            const fullAddress = `${address}, ${city}, ${state}, ${country}`;
            const encodedAddress = encodeURIComponent(fullAddress);
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`;
            this.logger.log(`Geocoding address: ${fullAddress}`);
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Tigo-Booking-Hotel-System/1.0'
                }
            });
            if (!response.ok) {
                throw new Error(`Geocoding API returned status ${response.status}`);
            }
            const data = await response.json();
            if (data && data.length > 0) {
                const result = {
                    latitude: parseFloat(data[0].lat),
                    longitude: parseFloat(data[0].lon)
                };
                this.logger.log(`Successfully geocoded to: ${result.latitude}, ${result.longitude}`);
                return result;
            }
            this.logger.warn(`No geocoding results found for address: ${fullAddress}`);
            return null;
        }
        catch (error) {
            this.logger.error(`Geocoding failed for address: ${address}`, error);
            return null;
        }
    }
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
};
exports.GeocodingService = GeocodingService;
exports.GeocodingService = GeocodingService = GeocodingService_1 = __decorate([
    (0, common_1.Injectable)()
], GeocodingService);
//# sourceMappingURL=geocoding.service.js.map