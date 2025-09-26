'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import HotelCard from '@/components/hotels/hotel-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Hotel, HotelSearchQuery, HotelSearchResult } from '@/types/hotel';
import { HotelApiService } from '@/lib/api/hotels';
import { ArrowLeft, Filter, SortAsc, MapPin, Calendar } from 'lucide-react';

function HotelResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [results, setResults] = useState<HotelSearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'price' | 'rating' | 'name'>('price');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [currentPage, setCurrentPage] = useState(1);

  // Extract search parameters
  const searchQuery: HotelSearchQuery = {
    city: searchParams.get('city') || '',
    check_in_date: searchParams.get('check_in_date') || '',
    check_out_date: searchParams.get('check_out_date') || '',
    number_of_guests: parseInt(searchParams.get('number_of_guests') || '2'),
    min_price: searchParams.get('min_price') ? parseFloat(searchParams.get('min_price')!) : undefined,
    max_price: searchParams.get('max_price') ? parseFloat(searchParams.get('max_price')!) : undefined,
    min_rating: searchParams.get('min_rating') ? parseFloat(searchParams.get('min_rating')!) : undefined,
    sort_by: sortBy,
    sort_order: sortOrder,
    page: currentPage,
    limit: 10,
  };

  // Fetch hotels
  const fetchHotels = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await HotelApiService.searchHotels(searchQuery);
      setResults(result);
    } catch (err) {
      setError('Failed to load hotels. Please try again.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotels();
  }, [searchParams, sortBy, sortOrder, currentPage]);

  const handleSortChange = (newSortBy: 'price' | 'rating' | 'name') => {
    if (newSortBy === sortBy) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(newSortBy);
      setSortOrder(newSortBy === 'price' ? 'ASC' : 'DESC');
    }
    setCurrentPage(1);
  };

  const handleViewDetails = (hotelId: string) => {
    const params = new URLSearchParams({
      check_in_date: searchQuery.check_in_date || '',
      check_out_date: searchQuery.check_out_date || '',
      number_of_guests: searchQuery.number_of_guests?.toString() || '2',
    });
    
    router.push(`/hotels/${hotelId}?${params.toString()}`);
  };

  const handleBackToSearch = () => {
    router.push('/hotels/search');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-walnut-darkest">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-walnut-dark rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-48 bg-walnut-dark rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

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
      
      <div className="container mx-auto px-4 py-6 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={handleBackToSearch}
              className="border-copper-accent/30 text-cream-light hover:bg-copper-accent/20 font-cormorant"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Search
            </Button>
            <div className="text-sm text-cream-light/70 font-cormorant">
              <MapPin className="w-4 h-4 inline mr-1 text-copper-accent" />
              {searchQuery.city}
              {searchQuery.check_in_date && searchQuery.check_out_date && (
                <>
                  <Calendar className="w-4 h-4 inline ml-3 mr-1 text-copper-accent" />
                  {formatDate(searchQuery.check_in_date)} - {formatDate(searchQuery.check_out_date)}
                </>
              )}
            </div>
          </div>
          
          <div className="text-sm text-cream-light/70 font-cormorant">
            {results?.total || 0} hotels found
          </div>
        </div>

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
                {/* Sort Options */}
                <div>
                  <h4 className="font-cormorant font-medium text-cream-light mb-3 text-vintage-base">Sort by</h4>
                  <div className="space-y-2">
                    {[
                      { key: 'price', label: 'Price' },
                      { key: 'rating', label: 'Rating' },
                      { key: 'name', label: 'Name' },
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => handleSortChange(key as 'price' | 'rating' | 'name')}
                        className={`w-full text-left px-4 py-3 rounded-lg border font-cormorant text-vintage-base transition-all duration-300 ${
                          sortBy === key
                            ? 'border-copper-accent bg-copper-accent/20 text-cream-light'
                            : 'border-copper-accent/30 text-cream-light/80 hover:bg-copper-accent/10'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{label}</span>
                          {sortBy === key && (
                            <SortAsc className={`w-4 h-4 text-copper-accent ${sortOrder === 'DESC' ? 'transform rotate-180' : ''}`} />
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
                      { label: 'Under $100', range: [0, 100] },
                      { label: '$100 - $200', range: [100, 200] },
                      { label: '$200 - $300', range: [200, 300] },
                      { label: 'Over $300', range: [300, 9999] },
                    ].map(({ label }) => (
                      <button 
                        key={label}
                        className="w-full text-left px-4 py-3 rounded-lg border border-copper-accent/30 text-cream-light/80 hover:bg-copper-accent/10 font-cormorant text-vintage-base transition-all duration-300"
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
                    {[4.5, 4.0, 3.5, 3.0].map(rating => (
                      <button
                        key={rating}
                        className="w-full text-left px-4 py-3 rounded-lg border border-copper-accent/30 text-cream-light/80 hover:bg-copper-accent/10 font-cormorant text-vintage-base transition-all duration-300"
                      >
                        {rating}+ stars
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="flex-1">
            <div className="space-y-6">
              {results?.hotels.map((hotel: Hotel) => (
                <HotelCard
                  key={hotel.id}
                  hotel={hotel}
                  onViewDetails={handleViewDetails}
                  checkInDate={searchQuery.check_in_date}
                  checkOutDate={searchQuery.check_out_date}
                  numberOfGuests={searchQuery.number_of_guests}
                />
              ))}
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
                    Try adjusting your search criteria or selecting a different destination.
                  </p>
                  <Button 
                    onClick={handleBackToSearch}
                    className="bg-gradient-to-r from-copper-accent to-copper-light text-walnut-dark font-cinzel font-bold"
                  >
                    New Search
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HotelResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-walnut-darkest flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-copper-accent"></div>
      </div>
    }>
      <HotelResultsContent />
    </Suspense>
  );
}