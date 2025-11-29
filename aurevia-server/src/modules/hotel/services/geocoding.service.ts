import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);

  async geocodeAddress(
    address: string,
    city: string,
    state: string,
    country: string,
  ): Promise<{ latitude: number; longitude: number } | null> {
    try {
      // For demo purposes, using Nominatim (OpenStreetMap) API - free geocoding service
      const fullAddress = `${address}, ${city}, ${state}, ${country}`;
      const encodedAddress = encodeURIComponent(fullAddress);
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`;

      this.logger.log(`Geocoding address: ${fullAddress}`);

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Tigo-Booking-Hotel-System/1.0', // Required by Nominatim
        },
      });

      if (!response.ok) {
        throw new Error(`Geocoding API returned status ${response.status}`);
      }

      const data = await response.json();

      if (data && data.length > 0) {
        const result = {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
        };

        this.logger.log(
          `Successfully geocoded to: ${result.latitude}, ${result.longitude}`,
        );
        return result;
      }

      this.logger.warn(
        `No geocoding results found for address: ${fullAddress}`,
      );
      return null;
    } catch (error) {
      this.logger.error(`Geocoding failed for address: ${address}`, error);
      return null;
    }
  }

  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    // Calculate distance in kilometers using Haversine formula
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
