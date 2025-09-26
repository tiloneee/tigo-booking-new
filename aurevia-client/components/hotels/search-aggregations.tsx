'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HotelSearchResult } from '@/types/hotel';
import { DollarSign, Star, MapPin, Sparkles } from 'lucide-react';

interface SearchAggregationsProps {
  searchResult: HotelSearchResult | null;
  onPriceRangeSelect?: (min?: number, max?: number) => void;
  onRatingSelect?: (minRating: number) => void;
  onCitySelect?: (city: string) => void;
  onAmenitySelect?: (amenity: string) => void;
  selectedFilters?: {
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    selectedCity?: string;
    selectedAmenities?: string[];
  };
}

export default function SearchAggregations({
  searchResult,
  onPriceRangeSelect,
  onRatingSelect,
  onCitySelect,
  onAmenitySelect,
  selectedFilters = {}
}: SearchAggregationsProps) {
  if (!searchResult?.aggregations) {
    return null;
  }

  const { aggregations } = searchResult;

  const formatPriceRange = (from?: number, to?: number) => {
    if (from === undefined && to === undefined) return 'Any Price';
    if (from === undefined) return `Under $${to}`;
    if (to === undefined) return `$${from}+`;
    return `$${from} - $${to}`;
  };

  const formatRatingRange = (from?: number, to?: number) => {
    if (from === undefined && to === undefined) return 'Any Rating';
    if (from === undefined) return `Under ${to} stars`;
    if (to === undefined) return `${from}+ stars`;
    return `${from} - ${to} stars`;
  };

  return (
    <div className="space-y-6">
      {/* Price Ranges */}
      {aggregations.price_ranges?.buckets && aggregations.price_ranges.buckets.length > 0 && (
        <Card className="bg-walnut-dark/80 border border-copper-accent/30 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-vintage-lg font-playfair text-cream-light flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-copper-accent" />
              Price Range
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {aggregations.price_ranges.buckets
              .filter(bucket => bucket.doc_count > 0)
              .map((bucket, index) => (
              <Button
                key={index}
                variant="ghost"
                onClick={() => onPriceRangeSelect && onPriceRangeSelect(bucket.from, bucket.to)}
                className={`w-full justify-between text-left font-cormorant hover:bg-copper-accent/20 ${
                  (selectedFilters.minPrice === bucket.from && selectedFilters.maxPrice === bucket.to) 
                    ? 'bg-copper-accent/20 text-copper-accent' 
                    : 'text-cream-light/80'
                }`}
              >
                <span>{formatPriceRange(bucket.from, bucket.to)}</span>
                <Badge variant="secondary" className="bg-copper-accent/20 text-copper-accent border-copper-accent/30">
                  {bucket.doc_count}
                </Badge>
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Rating Distribution */}
      {aggregations.rating_distribution?.buckets && aggregations.rating_distribution.buckets.length > 0 && (
        <Card className="bg-walnut-dark/80 border border-copper-accent/30 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-vintage-lg font-playfair text-cream-light flex items-center">
              <Star className="w-5 h-5 mr-2 text-copper-accent" />
              Guest Rating
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {aggregations.rating_distribution.buckets
              .filter(bucket => bucket.doc_count > 0)
              .sort((a, b) => (b.from || 0) - (a.from || 0)) // Sort by rating descending
              .map((bucket, index) => (
              <Button
                key={index}
                variant="ghost"
                onClick={() => onRatingSelect && bucket.from && onRatingSelect(bucket.from)}
                className={`w-full justify-between text-left font-cormorant hover:bg-copper-accent/20 ${
                  selectedFilters.minRating === bucket.from
                    ? 'bg-copper-accent/20 text-copper-accent' 
                    : 'text-cream-light/80'
                }`}
              >
                <div className="flex items-center">
                  <div className="flex items-center mr-2">
                    {Array.from({ length: Math.floor(bucket.from || 0) }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-current text-copper-accent" />
                    ))}
                  </div>
                  <span>{formatRatingRange(bucket.from, bucket.to)}</span>
                </div>
                <Badge variant="secondary" className="bg-copper-accent/20 text-copper-accent border-copper-accent/30">
                  {bucket.doc_count}
                </Badge>
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Cities */}
      {aggregations.cities?.buckets && aggregations.cities.buckets.length > 0 && (
        <Card className="bg-walnut-dark/80 border border-copper-accent/30 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-vintage-lg font-playfair text-cream-light flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-copper-accent" />
              Popular Cities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {aggregations.cities.buckets
              .filter(bucket => bucket.doc_count > 0)
              .slice(0, 8) // Limit to top 8 cities
              .map((bucket, index) => (
              <Button
                key={index}
                variant="ghost"
                onClick={() => onCitySelect && onCitySelect(bucket.key)}
                className={`w-full justify-between text-left font-cormorant hover:bg-copper-accent/20 ${
                  selectedFilters.selectedCity === bucket.key
                    ? 'bg-copper-accent/20 text-copper-accent' 
                    : 'text-cream-light/80'
                }`}
              >
                <span>{bucket.key}</span>
                <Badge variant="secondary" className="bg-copper-accent/20 text-copper-accent border-copper-accent/30">
                  {bucket.doc_count}
                </Badge>
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Amenities */}
      {aggregations.amenities?.amenity_names?.buckets && aggregations.amenities.amenity_names.buckets.length > 0 && (
        <Card className="bg-walnut-dark/80 border border-copper-accent/30 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-vintage-lg font-playfair text-cream-light flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-copper-accent" />
              Popular Amenities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {aggregations.amenities.amenity_names.buckets
              .filter(bucket => bucket.doc_count > 0)
              .slice(0, 10) // Limit to top 10 amenities
              .map((bucket, index) => (
              <Button
                key={index}
                variant="ghost"
                onClick={() => onAmenitySelect && onAmenitySelect(bucket.key)}
                className={`w-full justify-between text-left font-cormorant hover:bg-copper-accent/20 ${
                  selectedFilters.selectedAmenities?.includes(bucket.key)
                    ? 'bg-copper-accent/20 text-copper-accent' 
                    : 'text-cream-light/80'
                }`}
              >
                <span className="capitalize">{bucket.key}</span>
                <Badge variant="secondary" className="bg-copper-accent/20 text-copper-accent border-copper-accent/30">
                  {bucket.doc_count}
                </Badge>
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Search Stats */}
      {searchResult.total > 0 && (
        <Card className="bg-walnut-dark/60 border border-copper-accent/20 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-vintage-2xl font-playfair font-bold text-copper-accent mb-1">
                {searchResult.total.toLocaleString()}
              </div>
              <div className="text-cream-light/70 font-cormorant text-vintage-sm">
                {searchResult.total === 1 ? 'hotel found' : 'hotels found'}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
