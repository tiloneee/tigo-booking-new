'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import HotelCard from '@/components/hotels/hotel-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Hotel, HotelSearchQuery, HotelSearchResult } from '@/types/hotel';
import { HotelApiService } from '@/lib/api/hotels';
import { Search, Filter, SortAsc, MapPin, Calendar, Users, Home, Plus, Minus, Navigation, Sparkles } from 'lucide-react';
import AutocompleteSearch from '@/components/hotels/autocomplete-search';
import SearchAggregations from '@/components/hotels/search-aggregations';
import Header from '@/components/header';

function HotelsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [results, setResults] = useState<HotelSearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  // Search form state
  const [searchForm, setSearchForm] = useState({
    destination: searchParams.get('city') || '',
    checkInDate: searchParams.get('check_in_date') || '',
    checkOutDate: searchParams.get('check_out_date') || '',
    numberOfGuests: parseInt(searchParams.get('number_of_guests') || '2'),
    numberOfRooms: parseInt(searchParams.get('number_of_rooms') || '1'),
  });

  // Filter state
  const [filters, setFilters] = useState({
    sortBy: 'relevance' as 'price' | 'rating' | 'name' | 'relevance' | 'distance',
    sortOrder: 'DESC' as 'ASC' | 'DESC',
    minPrice: undefined as number | undefined,
    maxPrice: undefined as number | undefined,
    minRating: undefined as number | undefined,
    selectedAmenities: [] as string[],
  });

  // Location state
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [popularCities, setPopularCities] = useState<string[]>([]);

  // Load popular cities
  useEffect(() => {
    const loadCities = async () => {
      try {
        const cities = await HotelApiService.getPopularCities();
        setPopularCities(cities);
      } catch (error) {
        console.error('Failed to load popular cities:', error);
      }
    };
    loadCities();
  }, []);

  // Get user location
  const getUserLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setLocationLoading(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes cache
        });
      });

      const newLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      
      setUserLocation(newLocation);
      setFilters(prev => ({ ...prev, sortBy: 'distance' }));
      console.log('📍 User location obtained:', newLocation);
    } catch (error) {
      console.error('Failed to get location:', error);
      alert('Unable to access your location. Please ensure location permissions are enabled.');
    } finally {
      setLocationLoading(false);
    }
  };


  // Handle city selection from dropdown and aggregations
  const handleCitySelect = (city: string) => {
    setSearchForm(prev => ({ ...prev, destination: city }));
    setCurrentPage(1);
    console.log('🏙️ Selected city:', city);
  };

  // Build search query
  const buildSearchQuery = (): HotelSearchQuery => {
    return {
      query: searchForm.destination || undefined, // General search term (searches hotel names, cities, descriptions)
      // Don't send city separately since query already handles city search
      latitude: userLocation?.latitude,
      longitude: userLocation?.longitude,
      radius_km: userLocation ? 50 : undefined, // 50km radius when using geolocation
      check_in_date: searchForm.checkInDate || undefined,
      check_out_date: searchForm.checkOutDate || undefined,
      number_of_guests: searchForm.numberOfGuests,
      number_of_rooms: searchForm.numberOfRooms,
      amenity_ids: filters.selectedAmenities.length > 0 ? filters.selectedAmenities : undefined,
      min_price: filters.minPrice,
      max_price: filters.maxPrice,
      min_rating: filters.minRating,
      sort_by: filters.sortBy,
      sort_order: filters.sortOrder,
      page: currentPage,
      limit: 12,
    };
  };

  // Fetch all hotels or search with filters
  const fetchHotels = async (useSearch = false, useAdvancedSearch = false) => {
    setLoading(true);
    setError(null);
    
    try {
      let result;
      
      // Use search if there are any search criteria or filters
      const hasSearchCriteria = searchForm.destination || searchForm.checkInDate || searchForm.checkOutDate;
      const hasFilters = filters.minPrice !== undefined || filters.maxPrice !== undefined || filters.minRating !== undefined || filters.selectedAmenities.length > 0;
      const hasLocation = userLocation !== null;
      
      if (useSearch && (hasSearchCriteria || hasFilters || hasLocation)) {
        const searchQuery = buildSearchQuery();
        console.log('🔍 Searching with query:', searchQuery);
        
        // Use advanced search if we have complex criteria or want aggregations
        if (useAdvancedSearch || hasFilters || hasLocation || showAdvancedSearch) {
          console.log('🚀 Using advanced Elasticsearch search');
          result = await HotelApiService.advancedSearch(searchQuery);
        } else {
          console.log('⚡ Using standard search');
          result = await HotelApiService.searchHotels(searchQuery);
        }
        
        console.log('📍 Search results:', result);
      } else {
        // Get all hotels when no search criteria or filters
        console.log('📋 Getting all hotels');
        result = await HotelApiService.getAllHotels(
          currentPage,
          12,
          filters.sortBy === 'relevance' ? 'name' : filters.sortBy,
          filters.sortOrder
        );
      }
      
      setResults(result);
    } catch (err) {
      setError('Failed to load hotels. Please try again.');
      console.error('Hotels fetch error:', err);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  useEffect(() => {
    // Load all hotels by default on component mount and filter changes
    fetchHotels(false);
  }, [filters.sortBy, filters.sortOrder, currentPage]);

  // Reload when price/rating/amenity filters change (these will trigger advanced search)
  useEffect(() => {
    const hasFilters = filters.minPrice !== undefined || filters.maxPrice !== undefined || filters.minRating !== undefined || filters.selectedAmenities.length > 0;
    if (hasFilters) {
      fetchHotels(true, true); // Use advanced search for filtered results
    } else {
      fetchHotels(false);
    }
  }, [filters.minPrice, filters.maxPrice, filters.minRating, filters.selectedAmenities]);

  // Reload when user location changes
  useEffect(() => {
    if (userLocation) {
      fetchHotels(true, true); // Use advanced search with geolocation
    }
  }, [userLocation]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (searchForm.checkInDate && searchForm.checkOutDate && 
        new Date(searchForm.checkInDate) >= new Date(searchForm.checkOutDate)) {
      alert('Check-out date must be after check-in date');
      return;
    }

    setSearching(true);
    setCurrentPage(1);
    
    // Always use advanced search when user explicitly searches to get aggregations
    await fetchHotels(true, true);
  };

  const handleSortChange = (newSortBy: 'price' | 'rating' | 'name' | 'relevance' | 'distance') => {
    setFilters(prev => ({
      ...prev,
      sortBy: newSortBy,
      sortOrder: newSortBy === prev.sortBy ? (prev.sortOrder === 'ASC' ? 'DESC' : 'ASC') : (newSortBy === 'price' ? 'ASC' : 'DESC')
    }));
    setCurrentPage(1);
  };

  // Aggregation handlers
  const handlePriceRangeSelect = (min?: number, max?: number) => {
    setFilters(prev => ({
      ...prev,
      minPrice: min,
      maxPrice: max,
    }));
    setCurrentPage(1);
  };

  const handleRatingSelect = (minRating: number) => {
    setFilters(prev => ({
      ...prev,
      minRating: prev.minRating === minRating ? undefined : minRating,
    }));
    setCurrentPage(1);
  };


  const handleAmenitySelect = (amenity: string) => {
    setFilters(prev => ({
      ...prev,
      selectedAmenities: prev.selectedAmenities.includes(amenity)
        ? prev.selectedAmenities.filter(a => a !== amenity)
        : [...prev.selectedAmenities, amenity],
    }));
    setCurrentPage(1);
  };

  const handleViewDetails = (hotelId: string) => {
    const params = new URLSearchParams();
    if (searchForm.checkInDate) params.set('check_in_date', searchForm.checkInDate);
    if (searchForm.checkOutDate) params.set('check_out_date', searchForm.checkOutDate);
    params.set('number_of_guests', searchForm.numberOfGuests.toString());
    
    router.push(`/hotels/${hotelId}?${params.toString()}`);
  };

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  if (error) {
    return (
      <div className="min-h-screen bg-walnut-darkest flex items-center justify-center">
        <Card className="max-w-md bg-walnut-dark/80 backdrop-blur-sm border border-copper-accent/30">
          <CardContent className="p-6 text-center">
            <h2 className="text-vintage-xl font-playfair font-semibold text-cream-light mb-2">Oops! Something went wrong</h2>
            <p className="text-cream-light/70 font-cormorant mb-4">{error}</p>
            <Button 
              onClick={fetchHotels}
              className="bg-gradient-to-r from-copper-accent to-copper-light text-walnut-dark font-cinzel font-bold"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-walnut-darkest">
      {/* Warm lighting effects */}
      <div className="absolute top-0 left-1/4 w-80 h-80 bg-copper-accent/4 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-copper-light/3 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mb-6">
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-copper-accent to-transparent mx-auto mb-3"></div>
            <p className="text-copper-accent font-great-vibes text-vintage-xl">Luxury Accommodations</p>
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-copper-accent to-transparent mx-auto mt-3"></div>
          </div>

          <h1 className="text-vintage-4xl md:text-vintage-5xl font-playfair font-bold text-cream-light mb-6 tracking-wide">
            Discover Premium
            <span className="block text-copper-accent font-great-vibes text-vintage-5xl font-normal italic mt-2">
              Hotels Worldwide
            </span>
          </h1>
          <p className="text-vintage-lg text-cream-light/85 mb-8 max-w-3xl mx-auto leading-relaxed font-cormorant font-light">
            Experience unparalleled luxury and comfort in our curated collection of the world's finest hotels.
          </p>
        </div>

        {/* Search Form */}
        <Card className="mb-8 bg-walnut-dark/80 backdrop-blur-sm border border-copper-accent/30 shadow-2xl max-w-6xl mx-auto">
          <CardHeader className="pb-4">
            <CardTitle className="text-vintage-xl font-playfair font-bold text-center text-cream-light">
              Find Your Perfect Stay
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {/* Search by Hotel Name or City */}
                <div className="lg:col-span-2">
                  <label className="block text-cream-light font-cormorant text-vintage-base font-medium mb-2 flex items-center">
                    <Search className="w-4 h-4 mr-2 text-copper-accent" />
                    Search Hotels
                  </label>
                  <div className="text-vintage-xs text-cream-light/60 font-cormorant mb-2">
                    Find by hotel name or city • Get smart suggestions as you type
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <AutocompleteSearch
                        value={searchForm.destination}
                        onChange={(value) => setSearchForm(prev => ({ ...prev, destination: value }))}
                        placeholder="Search by hotel name or city..."
                        className=""
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={getUserLocation}
                      disabled={locationLoading}
                      className={`px-3 py-2 border border-copper-accent/30 rounded-lg transition-all duration-300 ${
                        userLocation 
                          ? 'bg-copper-accent text-walnut-dark' 
                          : 'bg-walnut-darkest/60 text-copper-accent hover:bg-copper-accent/20'
                      }`}
                      title={userLocation ? 'Location enabled' : 'Use my location'}
                    >
                      {locationLoading ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Navigation className={`w-4 h-4 ${userLocation ? '' : ''}`} />
                      )}
                    </Button>
                  </div>
                  {userLocation && (
                    <div className="mt-1 text-vintage-xs text-copper-accent font-cormorant">
                      📍 Searching near your location
                    </div>
                  )}
                </div>

                {/* Check-in Date */}
                <div>
                  <label className="block text-cream-light font-cormorant text-vintage-base font-medium mb-2 flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-copper-accent" />
                    Check-in
                  </label>
                  <input
                    type="date"
                    value={searchForm.checkInDate}
                    onChange={(e) => setSearchForm(prev => ({ ...prev, checkInDate: e.target.value }))}
                    min={today}
                    className="w-full px-4 py-3 bg-walnut-darkest/60 border border-copper-accent/30 rounded-lg text-cream-light font-cormorant text-vintage-base focus:outline-none focus:border-copper-accent focus:ring-2 focus:ring-copper-accent/20 transition-all duration-300"
                  />
                </div>

                {/* Check-out Date */}
                <div>
                  <label className="block text-cream-light font-cormorant text-vintage-base font-medium mb-2 flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-copper-accent" />
                    Check-out
                  </label>
                  <input
                    type="date"
                    value={searchForm.checkOutDate}
                    onChange={(e) => setSearchForm(prev => ({ ...prev, checkOutDate: e.target.value }))}
                    min={searchForm.checkInDate || tomorrow}
                    className="w-full px-4 py-3 bg-walnut-darkest/60 border border-copper-accent/30 rounded-lg text-cream-light font-cormorant text-vintage-base focus:outline-none focus:border-copper-accent focus:ring-2 focus:ring-copper-accent/20 transition-all duration-300"
                  />
                </div>

                {/* Guests and Rooms */}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-cream-light font-cormorant text-vintage-base font-medium mb-2 flex items-center">
                      <Users className="w-4 h-4 mr-2 text-copper-accent" />
                      Guests
                    </label>
                    <div className="flex items-center space-x-2 px-4 py-3 bg-walnut-darkest/60 border border-copper-accent/30 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setSearchForm(prev => ({ ...prev, numberOfGuests: Math.max(1, prev.numberOfGuests - 1) }))}
                        className="p-1 text-copper-accent hover:bg-copper-accent hover:text-walnut-dark rounded transition-all duration-300"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-cream-light font-cormorant text-vintage-base font-medium flex-1 text-center text-sm">
                        {searchForm.numberOfGuests}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSearchForm(prev => ({ ...prev, numberOfGuests: prev.numberOfGuests + 1 }))}
                        className="p-1 text-copper-accent hover:bg-copper-accent hover:text-walnut-dark rounded transition-all duration-300"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <label className="block text-cream-light font-cormorant text-vintage-base font-medium mb-2 flex items-center">
                      <Home className="w-4 h-4 mr-2 text-copper-accent" />
                      Rooms
                    </label>
                    <div className="flex items-center space-x-2 px-4 py-3 bg-walnut-darkest/60 border border-copper-accent/30 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setSearchForm(prev => ({ ...prev, numberOfRooms: Math.max(1, prev.numberOfRooms - 1) }))}
                        className="p-1 text-copper-accent hover:bg-copper-accent hover:text-walnut-dark rounded transition-all duration-300"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-cream-light font-cormorant text-vintage-base font-medium flex-1 text-center text-sm">
                        {searchForm.numberOfRooms}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSearchForm(prev => ({ ...prev, numberOfRooms: prev.numberOfRooms + 1 }))}
                        className="p-1 text-copper-accent hover:bg-copper-accent hover:text-walnut-dark rounded transition-all duration-300"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search Button */}
              <div className="flex justify-center pt-4">
                <Button
                  type="submit"
                  disabled={searching || loading}
                  className="px-8 py-4 bg-gradient-to-r from-copper-accent to-copper-light text-walnut-dark font-cinzel font-bold rounded-lg shadow-2xl hover:shadow-copper-accent/40 transition-all duration-300 hover:scale-105 disabled:opacity-50 text-vintage-lg tracking-wider uppercase"
                  size="lg"
                >
                  <Search className="mr-3 h-5 w-5" />
                  {searching ? 'Searching...' : 'Search Hotels'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Results Section */}
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <div className="w-80 flex-shrink-0">
            <Card className="bg-walnut-dark/60 border border-copper-accent/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-vintage-lg font-playfair text-cream-light">
                  <Filter className="w-4 h-4 inline mr-2 text-copper-accent" />
                  Filters & Sort
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Advanced Search Toggle */}
                <div className="flex items-center justify-between">
                  <h4 className="font-cormorant font-medium text-cream-light text-vintage-base">Advanced Features</h4>
                  <button
                    type="button"
                    onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                    className={`px-3 py-1 rounded-full border font-cormorant text-vintage-sm transition-all duration-300 ${
                      showAdvancedSearch
                        ? 'border-copper-accent bg-copper-accent/20 text-copper-accent'
                        : 'border-copper-accent/30 text-cream-light/80 hover:bg-copper-accent/10'
                    }`}
                  >
                    <Sparkles className="w-3 h-3 inline mr-1" />
                    {showAdvancedSearch ? 'ON' : 'OFF'}
                  </button>
                </div>

                {/* Sort Options */}
                <div>
                  <h4 className="font-cormorant font-medium text-cream-light mb-3 text-vintage-base">Sort by</h4>
                  <div className="space-y-2">
                    {[
                      { key: 'relevance', label: 'Relevance', icon: '🎯' },
                      { key: 'price', label: 'Price', icon: '💰' },
                      { key: 'rating', label: 'Rating', icon: '⭐' },
                      { key: 'distance', label: 'Distance', icon: '📍', disabled: !userLocation },
                      { key: 'name', label: 'Name', icon: '🏨' },
                    ].map(({ key, label, icon, disabled }) => (
                      <button
                        key={key}
                        disabled={disabled}
                        onClick={() => handleSortChange(key as any)}
                        className={`w-full text-left px-4 py-3 rounded-lg border font-cormorant text-vintage-base transition-all duration-300 ${
                          filters.sortBy === key
                            ? 'border-copper-accent bg-copper-accent/20 text-cream-light'
                            : disabled
                            ? 'border-copper-accent/10 text-cream-light/40 cursor-not-allowed'
                            : 'border-copper-accent/30 text-cream-light/80 hover:bg-copper-accent/10'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="flex items-center">
                            <span className="mr-2">{icon}</span>
                            {label}
                            {disabled && ' (Enable location)'}
                          </span>
                          {filters.sortBy === key && !disabled && (
                            <SortAsc className={`w-4 h-4 text-copper-accent ${filters.sortOrder === 'DESC' ? 'transform rotate-180' : ''}`} />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <h4 className="font-cormorant font-medium text-cream-light mb-3 text-vintage-base">Price Range</h4>
                  <div className="space-y-2">
                    {[
                      { label: 'All Prices', min: undefined, max: undefined },
                      { label: 'Under $200', min: undefined, max: 200 },
                      { label: '$200 - $500', min: 200, max: 500 },
                      { label: '$500 - $1000', min: 500, max: 1000 },
                      { label: 'Over $1000', min: 1000, max: undefined },
                    ].map(({ label, min, max }) => (
                      <button 
                        key={label}
                        onClick={() => setFilters(prev => ({ ...prev, minPrice: min, maxPrice: max }))}
                        className={`w-full text-left px-4 py-3 rounded-lg border font-cormorant text-vintage-base transition-all duration-300 ${
                          filters.minPrice === min && filters.maxPrice === max
                            ? 'border-copper-accent bg-copper-accent/20 text-cream-light'
                            : 'border-copper-accent/30 text-cream-light/80 hover:bg-copper-accent/10'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rating Filter */}
                <div>
                  <h4 className="font-cormorant font-medium text-cream-light mb-3 text-vintage-base">Rating</h4>
                  <div className="space-y-2">
                    {[
                      { label: 'All Ratings', rating: undefined },
                      { label: '4.5+ stars', rating: 4.5 },
                      { label: '4.0+ stars', rating: 4.0 },
                      { label: '3.5+ stars', rating: 3.5 },
                      { label: '3.0+ stars', rating: 3.0 },
                    ].map(({ label, rating }) => (
                      <button
                        key={label}
                        onClick={() => setFilters(prev => ({ ...prev, minRating: rating }))}
                        className={`w-full text-left px-4 py-3 rounded-lg border font-cormorant text-vintage-base transition-all duration-300 ${
                          filters.minRating === rating
                            ? 'border-copper-accent bg-copper-accent/20 text-cream-light'
                            : 'border-copper-accent/30 text-cream-light/80 hover:bg-copper-accent/10'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Elasticsearch Aggregations */}
            <SearchAggregations
              searchResult={results}
              onPriceRangeSelect={handlePriceRangeSelect}
              onRatingSelect={handleRatingSelect}
              onCitySelect={handleCitySelect}
              onAmenitySelect={handleAmenitySelect}
              selectedFilters={{
                minPrice: filters.minPrice,
                maxPrice: filters.maxPrice,
                minRating: filters.minRating,
                selectedCity: searchForm.destination,
                selectedAmenities: filters.selectedAmenities,
              }}
            />
          </div>

          {/* Results */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-vintage-xl font-playfair font-semibold text-cream-light">
                {results ? (
                  searchForm.destination || searchForm.checkInDate ? 
                    `${results.total} Hotels Found` : 
                    `All ${results.total} Hotels`
                ) : 'Loading Hotels...'}
              </h2>
            </div>

            {loading ? (
              <div className="space-y-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-48 bg-walnut-dark/60 rounded-lg animate-pulse border border-copper-accent/20"></div>
                ))}
              </div>
            ) : (
              <>
                <div className="space-y-6">
                  {results?.hotels && results.hotels.length > 0 ? (
                    results.hotels.map((hotel: Hotel) => (
                      <HotelCard
                        key={hotel.id}
                        hotel={hotel}
                        onViewDetails={handleViewDetails}
                        checkInDate={searchForm.checkInDate}
                        checkOutDate={searchForm.checkOutDate}
                        numberOfGuests={searchForm.numberOfGuests}
                      />
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-cream-light/70 font-cormorant text-vintage-lg mb-4">
                        🏨 No hotels found
                      </div>
                      <p className="text-cream-light/60 font-cormorant text-vintage-base mb-4">
                        {searchForm.destination ? 
                          `No hotels found in "${searchForm.destination}". Try searching for a different city.` : 
                          'Try adjusting your search criteria or filters.'
                        }
                      </p>
                      <div className="text-cream-light/50 font-cormorant text-vintage-sm">
                        Available cities: Ho Chi Minh City, Hanoi, Da Nang
                      </div>
                    </div>
                  )}
                </div>

                {/* Pagination */}
                {results && results.total > results.limit && (
                  <div className="flex justify-center mt-8 gap-2">
                    <Button
                      variant="outline"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                      className="border-copper-accent/30 text-cream-light hover:bg-copper-accent/20 font-cormorant"
                    >
                      Previous
                    </Button>
                    
                    {[...Array(Math.ceil(results.total / results.limit))].map((_, i) => (
                      <Button
                        key={i + 1}
                        variant={currentPage === i + 1 ? "default" : "outline"}
                        onClick={() => setCurrentPage(i + 1)}
                        className={currentPage === i + 1 
                          ? "bg-gradient-to-r from-copper-accent to-copper-light text-walnut-dark font-cinzel font-bold" 
                          : "border-copper-accent/30 text-cream-light hover:bg-copper-accent/20 font-cormorant"
                        }
                      >
                        {i + 1}
                      </Button>
                    ))}
                    
                    <Button
                      variant="outline"
                      disabled={currentPage >= Math.ceil(results.total / results.limit)}
                      onClick={() => setCurrentPage(currentPage + 1)}
                      className="border-copper-accent/30 text-cream-light hover:bg-copper-accent/20 font-cormorant"
                    >
                      Next
                    </Button>
                  </div>
                )}

                {/* No Results */}
                {results && results.hotels.length === 0 && (
                  <Card className="p-8 text-center bg-walnut-dark/60 border border-copper-accent/20 backdrop-blur-sm">
                    <CardContent>
                      <h3 className="text-vintage-xl font-playfair font-semibold text-cream-light mb-2">No hotels found</h3>
                      <p className="text-cream-light/70 font-cormorant mb-4">
                        Try adjusting your search criteria or filters to see more results.
                      </p>
                      <Button 
                        onClick={() => {
                          setSearchForm({
                            destination: '',
                            checkInDate: '',
                            checkOutDate: '',
                            numberOfGuests: 2,
                            numberOfRooms: 1,
                          });
                          setFilters({
                            sortBy: 'price',
                            sortOrder: 'ASC',
                            minPrice: undefined,
                            maxPrice: undefined,
                            minRating: undefined,
                          });
                          setCurrentPage(1);
                        }}
                        className="bg-gradient-to-r from-copper-accent to-copper-light text-walnut-dark font-cinzel font-bold"
                      >
                        Clear Filters
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      
    </div>
  );
}

export default function HotelsPage() {
  return (
    <>
      <Header />
      <Suspense fallback={
        <div className="min-h-screen bg-walnut-darkest flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-copper-accent"></div>
        </div>
      }>
        <HotelsPageContent />
      </Suspense>
    </>
  );
}
