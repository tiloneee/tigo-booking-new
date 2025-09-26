'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import HotelSearchForm from '@/components/hotels/hotel-search-form';
import { SearchFormData } from '@/types/hotel';

export default function HotelSearchPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSearch = async (searchData: SearchFormData) => {
    setLoading(true);
    
    try {
      // Build URL search parameters
      const params = new URLSearchParams({
        city: searchData.destination,
        check_in_date: searchData.checkInDate,
        check_out_date: searchData.checkOutDate,
        number_of_guests: searchData.numberOfGuests.toString(),
        number_of_rooms: searchData.numberOfRooms.toString(),
      });

      // Navigate to results page
      router.push(`/hotels/results?${params.toString()}`);
    } catch (error) {
      console.error('Search error:', error);
      alert('An error occurred while searching. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Book Your Dream Hotel
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover amazing places to stay around the world. Compare prices, 
            read reviews, and book the perfect accommodation for your next trip.
          </p>
        </div>

        {/* Search Form */}
        <div className="mb-16">
          <HotelSearchForm onSearch={handleSearch} loading={loading} />
        </div>

        {/* Popular Destinations */}
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">
            Popular Destinations
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { city: 'New York', country: 'USA', image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=200&h=150&fit=crop' },
              { city: 'Paris', country: 'France', image: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=200&h=150&fit=crop' },
              { city: 'Tokyo', country: 'Japan', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=200&h=150&fit=crop' },
              { city: 'London', country: 'UK', image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=200&h=150&fit=crop' },
              { city: 'Sydney', country: 'Australia', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=150&fit=crop' },
              { city: 'Dubai', country: 'UAE', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=200&h=150&fit=crop' },
            ].map((destination, index) => (
              <button
                key={index}
                onClick={() => handleSearch({
                  destination: destination.city,
                  checkInDate: '',
                  checkOutDate: '',
                  numberOfGuests: 2,
                  numberOfRooms: 1,
                })}
                className="group relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <img
                  src={destination.image}
                  alt={destination.city}
                  className="w-full h-32 object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-2 left-2 text-white">
                  <div className="font-semibold text-sm">{destination.city}</div>
                  <div className="text-xs opacity-90">{destination.country}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="max-w-4xl mx-auto mt-16">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Easy Search</h3>
              <p className="text-gray-600">
                Find hotels by location, dates, and preferences with our intuitive search interface.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Best Prices</h3>
              <p className="text-gray-600">
                Compare prices from multiple sources to ensure you get the best deal for your stay.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Secure Booking</h3>
              <p className="text-gray-600">
                Book with confidence using our secure payment system and instant confirmation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
