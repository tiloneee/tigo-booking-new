'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchFormData } from '@/types/hotel';
import { HotelApiService } from '@/lib/api/hotels';
import { Calendar, MapPin, Users, Home, Search } from 'lucide-react';

interface HotelSearchFormProps {
  onSearch: (searchData: SearchFormData) => void;
  loading?: boolean;
}

export default function HotelSearchForm({ onSearch, loading = false }: HotelSearchFormProps) {
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
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-bold text-center text-gray-800">
          Find Your Perfect Stay
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Destination */}
            <div className="lg:col-span-2 relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="inline w-4 h-4 mr-1" />
                Where are you going?
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.destination}
                  onChange={(e) => handleInputChange('destination', e.target.value)}
                  onFocus={() => setShowCitySuggestions(true)}
                  placeholder="Enter city name..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                
                {/* City suggestions dropdown */}
                {showCitySuggestions && filteredCities.length > 0 && (
                  <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 shadow-lg max-h-48 overflow-y-auto">
                    {filteredCities.map((city, index) => (
                      <button
                        key={index}
                        type="button"
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                Check-in
              </label>
              <input
                type="date"
                value={formData.checkInDate}
                onChange={(e) => handleInputChange('checkInDate', e.target.value)}
                min={today}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Check-out Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                Check-out
              </label>
              <input
                type="date"
                value={formData.checkOutDate}
                onChange={(e) => handleInputChange('checkOutDate', e.target.value)}
                min={formData.checkInDate || tomorrow}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Guests and Rooms */}
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="inline w-4 h-4 mr-1" />
                  Guests
                </label>
                <select
                  value={formData.numberOfGuests}
                  onChange={(e) => handleInputChange('numberOfGuests', parseInt(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                    <option key={num} value={num}>{num} {num === 1 ? 'Guest' : 'Guests'}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Home className="inline w-4 h-4 mr-1" />
                  Rooms
                </label>
                <select
                  value={formData.numberOfRooms}
                  onChange={(e) => handleInputChange('numberOfRooms', parseInt(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {[1, 2, 3, 4, 5].map(num => (
                    <option key={num} value={num}>{num} {num === 1 ? 'Room' : 'Rooms'}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Search Button */}
          <div className="flex justify-center pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 disabled:opacity-50"
              size="lg"
            >
              <Search className="inline w-5 h-5 mr-2" />
              {loading ? 'Searching...' : 'Search Hotels'}
            </Button>
          </div>
        </form>
      </CardContent>
      
      {/* Close suggestions when clicking outside */}
      {showCitySuggestions && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowCitySuggestions(false)}
        />
      )}
    </Card>
  );
}
