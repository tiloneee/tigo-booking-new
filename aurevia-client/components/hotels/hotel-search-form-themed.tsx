'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchFormData } from '@/types/hotel';
import { HotelApiService } from '@/lib/api/hotels';
import { Calendar, MapPin, Users, Home, Search, Plus, Minus } from 'lucide-react';

interface HotelSearchFormThemedProps {
  onSearch: (searchData: SearchFormData) => void;
  loading?: boolean;
}

export default function HotelSearchFormThemed({ onSearch, loading = false }: HotelSearchFormThemedProps) {
  const [formData, setFormData] = useState<SearchFormData>({
    destination: '',
    checkInDate: '',
    checkOutDate: '',
    numberOfGuests: 2,
    numberOfRooms: 1,
  });

  const [popularCities, setPopularCities] = useState<string[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [filteredCities, setFilteredCities] = useState<string[]>([]);

  // Load popular cities on mount
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

  // Filter cities based on input
  useEffect(() => {
    if (formData.destination && popularCities.length > 0) {
      const filtered = popularCities.filter(city =>
        city.toLowerCase().includes(formData.destination.toLowerCase())
      );
      setFilteredCities(filtered);
    } else {
      setFilteredCities(popularCities.slice(0, 8)); // Show top 8 cities
    }
  }, [formData.destination, popularCities]);

  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const handleInputChange = (field: keyof SearchFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.destination.trim()) {
      alert('Please enter a destination');
      return;
    }
    
    if (!formData.checkInDate) {
      alert('Please select a check-in date');
      return;
    }
    
    if (!formData.checkOutDate) {
      alert('Please select a check-out date');
      return;
    }
    
    if (new Date(formData.checkInDate) >= new Date(formData.checkOutDate)) {
      alert('Check-out date must be after check-in date');
      return;
    }

    onSearch(formData);
  };

  const handleCitySelect = (city: string) => {
    setFormData(prev => ({ ...prev, destination: city }));
    setShowCitySuggestions(false);
  };

  return (
    <Card className="w-full max-w-6xl mx-auto bg-walnut-dark/80 backdrop-blur-sm border border-copper-accent/30 shadow-2xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-vintage-2xl font-playfair font-bold text-center text-cream-light">
          Find Your Perfect Stay
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* Destination */}
            <div className="lg:col-span-2 relative">
              <label className="block text-cream-light font-cormorant text-vintage-base font-medium mb-2 flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-copper-accent" />
                Where are you going?
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.destination}
                  onChange={(e) => handleInputChange('destination', e.target.value)}
                  onFocus={() => setShowCitySuggestions(true)}
                  placeholder="Enter city name..."
                  className="w-full px-4 py-3 bg-walnut-darkest/60 border border-copper-accent/30 rounded-lg text-cream-light placeholder-cream-light/50 font-cormorant text-vintage-base focus:outline-none focus:border-copper-accent focus:ring-2 focus:ring-copper-accent/20 transition-all duration-300"
                  required
                />
                
                {/* City suggestions dropdown */}
                {showCitySuggestions && filteredCities.length > 0 && (
                  <div className="absolute z-50 w-full bg-walnut-dark/95 backdrop-blur-sm border border-copper-accent/30 rounded-lg mt-1 shadow-2xl max-h-48 overflow-y-auto">
                    {filteredCities.map((city, index) => (
                      <button
                        key={index}
                        type="button"
                        className="w-full text-left px-4 py-2 text-cream-light hover:bg-copper-accent/20 focus:bg-copper-accent/20 font-cormorant text-vintage-base transition-all duration-200"
                        onClick={() => handleCitySelect(city)}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Check-in Date */}
            <div>
              <label className="block text-cream-light font-cormorant text-vintage-base font-medium mb-2 flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-copper-accent" />
                Check-in
              </label>
              <input
                type="date"
                value={formData.checkInDate}
                onChange={(e) => handleInputChange('checkInDate', e.target.value)}
                min={today}
                className="w-full px-4 py-3 bg-walnut-darkest/60 border border-copper-accent/30 rounded-lg text-cream-light font-cormorant text-vintage-base focus:outline-none focus:border-copper-accent focus:ring-2 focus:ring-copper-accent/20 transition-all duration-300"
                required
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
                value={formData.checkOutDate}
                onChange={(e) => handleInputChange('checkOutDate', e.target.value)}
                min={formData.checkInDate || tomorrow}
                className="w-full px-4 py-3 bg-walnut-darkest/60 border border-copper-accent/30 rounded-lg text-cream-light font-cormorant text-vintage-base focus:outline-none focus:border-copper-accent focus:ring-2 focus:ring-copper-accent/20 transition-all duration-300"
                required
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
                    onClick={() => handleInputChange('numberOfGuests', Math.max(1, formData.numberOfGuests - 1))}
                    className="p-1 text-copper-accent hover:bg-copper-accent hover:text-walnut-dark rounded transition-all duration-300"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="text-cream-light font-cormorant text-vintage-base font-medium flex-1 text-center text-sm">
                    {formData.numberOfGuests}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleInputChange('numberOfGuests', formData.numberOfGuests + 1)}
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
                    onClick={() => handleInputChange('numberOfRooms', Math.max(1, formData.numberOfRooms - 1))}
                    className="p-1 text-copper-accent hover:bg-copper-accent hover:text-walnut-dark rounded transition-all duration-300"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="text-cream-light font-cormorant text-vintage-base font-medium flex-1 text-center text-sm">
                    {formData.numberOfRooms}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleInputChange('numberOfRooms', formData.numberOfRooms + 1)}
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
              disabled={loading}
              className="px-8 py-4 bg-gradient-to-r from-copper-accent to-copper-light text-walnut-dark font-cinzel font-bold rounded-lg shadow-2xl hover:shadow-copper-accent/40 transition-all duration-300 hover:scale-105 disabled:opacity-50 text-vintage-lg tracking-wider uppercase"
              size="lg"
            >
              <Search className="mr-3 h-5 w-5" />
              {loading ? 'Searching...' : 'Search Hotels'}
            </Button>
          </div>
        </form>
      </CardContent>
      
      {/* Close suggestions when clicking outside */}
      {showCitySuggestions && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowCitySuggestions(false)}
        />
      )}
    </Card>
  );
}
