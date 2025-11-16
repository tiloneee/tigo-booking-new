'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Hotel, Room } from '@/types/hotel';
import { Review, ReviewStatistics } from '@/types/review';
import { HotelApiService } from '@/lib/api/hotels';
import { ReviewApiService } from '@/lib/api/reviews';
import { 
  ArrowLeft, 
  Star, 
  MapPin, 
  Phone, 
  Wifi, 
  Car, 
  Utensils, 
  Dumbbell,
  Users,
  Bed,
  Maximize,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import Header from '@/components/header';
import ReviewList from '@/components/reviews/review-list';
import ReviewStatisticsDisplay from '@/components/reviews/review-statistics-display';

function HotelDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Date selection state
  const [selectedDates, setSelectedDates] = useState({
    checkInDate: searchParams.get('check_in_date') || '',
    checkOutDate: searchParams.get('check_out_date') || '',
    numberOfGuests: parseInt(searchParams.get('number_of_guests') || '2')
  });

  const hotelId = params.id as string;
  const { checkInDate, checkOutDate, numberOfGuests } = selectedDates;

  // Mock images for demo - in production these would come from the API
  const hotelImages = [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&h=600&fit=crop',
  ];

  // Initial load - only runs once when component mounts or hotelId changes
  useEffect(() => {
    const fetchHotelDetails = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('🏨 Fetching hotel details for ID:', hotelId);
        
        // Always fetch hotel details
        const hotelData = await HotelApiService.getHotelById(hotelId);
        console.log('✅ Hotel data received:', hotelData);
        setHotel(hotelData);

        // Fetch reviews and statistics in parallel
        try {
          const [reviewsData, statsData] = await Promise.all([
            ReviewApiService.getHotelReviews(hotelId),
            ReviewApiService.getHotelReviewStatistics(hotelId)
          ]);
          setReviews(reviewsData);
          setReviewStats(statsData);
        } catch (reviewError) {
          console.warn('⚠️ Reviews not available:', reviewError);
          setReviews([]);
          setReviewStats(null);
        }

        // Only fetch rooms if dates are provided from URL params on initial load
        const initialCheckIn = searchParams.get('check_in_date');
        const initialCheckOut = searchParams.get('check_out_date');
        const initialGuests = parseInt(searchParams.get('number_of_guests') || '2');

        if (initialCheckIn && initialCheckOut) {
          try {
            console.log('🏠 Fetching rooms for initial dates:', { initialCheckIn, initialCheckOut, initialGuests });
            const roomsData = await HotelApiService.getHotelRooms(hotelId, initialCheckIn, initialCheckOut, initialGuests);
            console.log('✅ Rooms data received:', roomsData);
            setRooms(roomsData);
          } catch (roomError) {
            console.warn('⚠️ Room availability not available:', roomError);
            setRooms([]); // Set empty array if room data fails
          }
        } else {
          console.log('📅 No dates provided, skipping room fetch');
          setRooms([]); // No dates selected, no rooms to show
        }
      } catch (err) {
        console.error('❌ Error fetching hotel details:', err);
        setError('Failed to load hotel details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (hotelId) {
      fetchHotelDetails();
    }
  }, [hotelId]); // Only depend on hotelId - dates won't trigger reload

  const handleBookRoom = (room: Room) => {
    // Navigate to booking summary page with selected room
    const params = new URLSearchParams({
      hotel_id: hotelId,
      room_ids: room.id,
      check_in_date: checkInDate,
      check_out_date: checkOutDate,
      number_of_guests: numberOfGuests.toString(),
      // Pass room data as JSON string to avoid API calls
      room_data: JSON.stringify({
        id: room.id,
        room_type: room.room_type,
        room_number: room.room_number,
        description: room.description,
        max_occupancy: room.max_occupancy,
        bed_configuration: room.bed_configuration,
        size_sqm: room.size_sqm,
        pricing: room.pricing
      })
    });
    
    router.push(`/booking/summary?${params.toString()}`);
  };

  const handleBookingComplete = (bookingId: string) => {
    router.push(`/bookings/${bookingId}/confirmation`);
  };

  const getAmenityIcon = (category: string, name: string) => {
    switch (category.toLowerCase()) {
      case 'connectivity':
        return <Wifi className="w-4 h-4" />;
      case 'services':
        if (name.toLowerCase().includes('parking')) return <Car className="w-4 h-4" />;
        return <Users className="w-4 h-4" />;
      case 'dining':
        return <Utensils className="w-4 h-4" />;
      case 'fitness':
        return <Dumbbell className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % hotelImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + hotelImages.length) % hotelImages.length);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-bl from-creamy-yellow to-creamy-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-4 border-terracotta-rose/20 border-t-terracotta-rose mx-auto mb-4"></div>
          <p className="text-deep-brown font-varela text-vintage-lg">Loading hotel details...</p>
        </div>
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="min-h-screen bg-gradient-to-bl from-creamy-yellow to-creamy-white flex items-center justify-center">
        <Card className="max-w-md bg-gradient-to-br from-dark-brown/80 to-deep-brown border border-terracotta-rose/30 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <h2 className="text-vintage-xl font-libre font-bold text-creamy-yellow mb-4">Hotel Not Found</h2>
            <p className="text-creamy-yellow/70 font-varela text-vintage-base mb-6">{error || 'The hotel you are looking for could not be found.'}</p>
            <Button 
              onClick={() => router.back()}
              className="bg-gradient-to-r from-terracotta-rose to-terracotta-orange text-dark-brown font-libre font-bold hover:shadow-lg hover:shadow-terracotta-rose/30 transition-all duration-300"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-bl from-creamy-yellow to-creamy-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button 
            variant="outline" 
            onClick={() => router.push('/hotels/')}
            className="border-terracotta-rose/30 text-deep-brown hover:bg-terracotta-rose/20 font-varela bg-gradient-to-br from-terracotta-rose/70 to-terracotta-orange/80 backdrop-blur-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Results
          </Button>
          
          {checkInDate && checkOutDate && (
            <div className="text-vintage-base text-creamy-yellow font-varela bg-gradient-to-br from-dark-brown/60 to-deep-brown px-4 py-2 rounded-lg border border-terracotta-rose/20 backdrop-blur-sm">
              <Calendar className="w-4 h-4 inline mr-2 text-terracotta-rose" />
              {formatDate(checkInDate)} - {formatDate(checkOutDate)} • {numberOfGuests} guests
            </div>
          )}
        </div>

        {/* Hotel Images */}
        <div className="relative mb-10 rounded-xl overflow-hidden shadow-2xl shadow-deep-brown/50 p-4">
          <div className="relative h-96 bg-dark-brown/20 rounded-xl">
            <img
              src={hotelImages[currentImageIndex]}
              alt={hotel.name}
              className="w-full h-full object-cover rounded-xl shadow-xl shadow-terracotta-rose/80"
            />
            
            {/* Image Navigation */}
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-dark-brown/80 hover:bg-dark-brown/90 text-terracotta-rose p-3 rounded-full transition-all duration-300 backdrop-blur-sm border border-terracotta-rose/30 hover:shadow-lg hover:shadow-terracotta-rose/20"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-dark-brown/80 hover:bg-dark-brown/90 text-terracotta-rose p-3 rounded-full transition-all duration-300 backdrop-blur-sm border border-terracotta-rose/30 hover:shadow-lg hover:shadow-terracotta-rose/20"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            
            {/* Image Counter */}
            <div className="absolute bottom-4 right-4 bg-dark-brown/90 text-creamy-yellow px-4 py-2 rounded-full text-vintage-sm font-varela backdrop-blur-sm border border-terracotta-rose/20">
              {currentImageIndex + 1} / {hotelImages.length}
            </div>
          </div>
          
          {/* Thumbnail Navigation */}
          <div className="flex gap-3 mt-6 overflow-x-auto pb-3">
            {hotelImages.map((image, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`flex-shrink-0 w-20 h-16 rounded-lg border-2 overflow-hidden transition-all duration-300 ${
                  index === currentImageIndex 
                    ? 'border-terracotta-rose shadow-lg shadow-terracotta-rose/30 scale-105' 
                    : 'border-terracotta-rose/30 hover:border-terracotta-rose/60'
                }`}
              >
                <img src={image} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-10">
            {/* Hotel Info */}
            <Card className="bg-gradient-to-br from-dark-brown/80 to-deep-brown border border-terracotta-rose/30 backdrop-blur-sm shadow-2xl shadow-deep-brown/50">
              <CardContent className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1">
                    <h1 className="text-vintage-3xl font-libre font-bold text-creamy-yellow mb-4">{hotel.name}</h1>
                    <div className="flex items-center text-creamy-yellow/80 mb-3 font-varela text-vintage-base">
                      <MapPin className="w-5 h-5 mr-2 text-terracotta-rose" />
                      <span>{hotel.address}, {hotel.location?.city || hotel.city}, {hotel.location?.state || hotel.state}</span>
                    </div>
                    <div className="flex items-center text-creamy-yellow/80 font-varela text-vintage-base">
                      <Phone className="w-5 h-5 mr-2 text-terracotta-rose" />
                      <span>{hotel.phone_number}</span>
                    </div>
                  </div>
                  
                  {hotel.avg_rating && Number(hotel.avg_rating) > 0 && (
                    <div className="text-center">
                      <div className="flex items-center bg-gradient-to-r from-terracotta-rose to-terracotta-orange text-dark-brown px-4 py-3 rounded-xl mb-2 shadow-lg">
                        <Star className="w-5 h-5 mr-2 fill-current" />
                        <span className="text-vintage-lg font-libre font-bold">{Number(hotel.avg_rating).toFixed(1)}</span>
                      </div>
                      <div className="text-vintage-sm text-creamy-yellow/60 font-varela">
                        {hotel.total_reviews || 0} reviews
                      </div>
                    </div>
                  )}
                </div>
                
                <p className="text-creamy-yellow/90 leading-relaxed font-varela text-vintage-base">{hotel.description}</p>
              </CardContent>
            </Card>

            {/* Amenities */}
            {hotel.amenities && hotel.amenities.length > 0 && (
              <Card className="bg-gradient-to-br from-dark-brown/80 to-deep-brown border border-terracotta-rose/30 backdrop-blur-sm shadow-2xl shadow-deep-brown/50">
                <CardHeader className="border-b border-terracotta-rose/20 pb-4">
                  <CardTitle className="text-vintage-xl font-libre text-creamy-yellow">Hotel Amenities</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {hotel.amenities.map((amenity, index) => (
                      <div key={amenity.id || index} className="flex items-center p-3 rounded-lg bg-dark-brown/30 border border-terracotta-rose/10 hover:border-terracotta-rose/30 transition-all duration-300">
                        <div className="text-terracotta-rose mr-4">
                          {getAmenityIcon(amenity.category, amenity.name)}
                        </div>
                        <span className="text-creamy-yellow font-varela text-vintage-base">{amenity.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reviews Section */}
            <div className="space-y-6">
              {reviewStats && reviewStats.total_reviews > 0 && (
                <ReviewStatisticsDisplay statistics={reviewStats} />
              )}
              
              {reviews.length > 0 ? (
                <div className="bg-creamy-white p-6 rounded-xl">
                  <h3 className="text-vintage-2xl font-libre font-bold text-deep-brown mb-6">
                    Guest Reviews ({reviews.length})
                  </h3>
                  <ReviewList reviews={reviews} />
                </div>
              ) : reviewStats === null ? (
                <Card className="bg-soft-beige/40 border-terracotta-rose/20">
                  <CardContent className="p-8 text-center">
                    <p className="text-ash-brown font-varela">Loading reviews...</p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-soft-beige/40 border-terracotta-rose/20">
                  <CardContent className="p-8 text-center">
                    <p className="text-ash-brown font-varela text-lg">No reviews yet for this hotel.</p>
                    <p className="text-ash-brown/60 font-varela text-sm mt-2">Be the first to share your experience!</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Sidebar - Date Selection & Available Rooms */}
          <div className="space-y-6">
            {/* Date Selection Card */}
            <Card className="bg-gradient-to-br from-dark-brown/80 to-deep-brown border border-terracotta-rose/30">
              <CardHeader>
                <CardTitle className="text-creamy-yellow font-libre flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-terracotta-rose" />
                  Select Dates & Guests
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Check-in Date */}
                <div>
                  <label className="block text-creamy-yellow font-varela text-sm font-medium mb-2">
                    Check-in Date
                  </label>
                  <input
                    type="date"
                    value={selectedDates.checkInDate}
                    onChange={(e) => setSelectedDates(prev => ({ ...prev, checkInDate: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 bg-dark-brown/60 border border-terracotta-rose/30 rounded text-creamy-yellow font-varela focus:outline-none focus:border-terracotta-rose"
                  />
                </div>

                {/* Check-out Date */}
                <div>
                  <label className="block text-creamy-yellow font-varela text-sm font-medium mb-2">
                    Check-out Date
                  </label>
                  <input
                    type="date"
                    value={selectedDates.checkOutDate}
                    onChange={(e) => setSelectedDates(prev => ({ ...prev, checkOutDate: e.target.value }))}
                    min={selectedDates.checkInDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                    className="w-full px-3 py-2 bg-dark-brown/60 border border-terracotta-rose/30 rounded text-creamy-yellow font-varela focus:outline-none focus:border-terracotta-rose"
                  />
                </div>

                {/* Number of Guests */}
                <div>
                  <label className="block text-creamy-yellow font-varela text-sm font-medium mb-2">
                    Number of Guests
                  </label>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedDates(prev => ({ ...prev, numberOfGuests: Math.max(1, prev.numberOfGuests - 1) }))}
                      className="p-2 bg-terracotta-rose/20 border border-terracotta-rose/30 rounded text-terracotta-rose hover:bg-terracotta-rose hover:text-dark-brown transition-colors"
                    >
                      <Users className="w-4 h-4" />
                    </button>
                    <span className="flex-1 text-center text-creamy-yellow font-varela font-medium">
                      {selectedDates.numberOfGuests} Guest{selectedDates.numberOfGuests > 1 ? 's' : ''}
                    </span>
                    <button
                      onClick={() => setSelectedDates(prev => ({ ...prev, numberOfGuests: prev.numberOfGuests + 1 }))}
                      className="p-2 bg-terracotta-rose/20 border border-terracotta-rose/30 rounded text-terracotta-rose hover:bg-terracotta-rose hover:text-dark-brown transition-colors"
                    >
                      <Users className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Update Button */}
                <Button
                  onClick={async () => {
                    // Validate dates
                    if (selectedDates.checkInDate && selectedDates.checkOutDate && 
                        new Date(selectedDates.checkInDate) >= new Date(selectedDates.checkOutDate)) {
                      alert('Check-out date must be after check-in date');
                      return;
                    }
                    
                    // Update URL parameters
                    const params = new URLSearchParams();
                    if (selectedDates.checkInDate) params.set('check_in_date', selectedDates.checkInDate);
                    if (selectedDates.checkOutDate) params.set('check_out_date', selectedDates.checkOutDate);
                    params.set('number_of_guests', selectedDates.numberOfGuests.toString());
                    
                    const newUrl = `${window.location.pathname}?${params.toString()}`;
                    window.history.pushState({}, '', newUrl);
                    
                    // Reload rooms with new dates
                    setLoading(true);
                    try {
                      const roomsData = await HotelApiService.getHotelRooms(
                        hotelId, 
                        selectedDates.checkInDate, 
                        selectedDates.checkOutDate, 
                        selectedDates.numberOfGuests
                      );
                      setRooms(roomsData);
                    } catch (err) {
                      console.error('Error updating room availability:', err);
                      alert('Failed to update room availability. Please try again.');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="w-full bg-gradient-to-r from-terracotta-rose to-terracotta-orange text-dark-brown font-libre font-bold hover:shadow-lg transition-all duration-300"
                >
                  Update Availability
                </Button>
              </CardContent>
            </Card>

            {/* Available Rooms Card */}
            <Card className="bg-gradient-to-br from-dark-brown/80 to-deep-brown border border-terracotta-rose/30 sticky top-6">
              <CardHeader>
                <CardTitle className="text-creamy-yellow font-libre">Available Rooms</CardTitle>
                {checkInDate && checkOutDate && (
                  <p className="text-sm text-creamy-yellow/70 font-varela">
                    {formatDate(checkInDate)} - {formatDate(checkOutDate)}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-24 bg-dark-brown/40 rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : rooms.length === 0 ? (
                  <div className="text-center py-8">
                    {checkInDate && checkOutDate ? (
                      <div>
                        <p className="text-creamy-yellow/70 font-varela text-vintage-base mb-2">
                          No rooms available for selected dates
                        </p>
                        <p className="text-creamy-yellow/50 font-varela text-vintage-sm">
                          Try different dates or contact the hotel directly
                        </p>
                        
                        {/* Show basic room types even without availability */}
                        <div className="mt-6 space-y-4">
                          <p className="text-creamy-yellow/60 font-varela text-vintage-sm mb-3">
                            Standard room types available:
                          </p>
                          {['Standard Room', 'Deluxe Suite', 'Vietnamese Heritage Room'].map((roomType,index, ) => (
                            <div key={index} className="border border-terracotta-rose/20 rounded-lg p-4 bg-dark-brown/20">
                              <h3 className="font-libre font-semibold text-vintage-lg mb-2 text-creamy-yellow">{roomType}</h3>
                              <p className="text-creamy-yellow/80 text-sm mb-3 font-varela">
                                {roomType === 'Standard Room' && 'Comfortable room with traditional Vietnamese décor and modern amenities'}
                                {roomType === 'Deluxe Suite' && 'Spacious suite with city/nature views and premium Vietnamese hospitality'}
                                {roomType === 'Vietnamese Heritage Room' && 'Luxury room showcasing authentic Vietnamese culture and elegant design'}
                              </p>
                              <div className="flex justify-between items-center">
                                <div className="text-vintage-base text-creamy-yellow/60 font-varela italic">
                                  Out of stock for selected dates
                                </div>
                                <Button
                                  disabled={true}
                                  className="bg-terracotta-rose/20 text-creamy-yellow/50 font-libre font-bold cursor-not-allowed"
                                >
                                  Not Available
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-creamy-yellow/70 font-varela text-vintage-base mb-4">
                          Select check-in and check-out dates to see available rooms and pricing
                        </p>
                        
                        {/* Show room types without pricing when no dates selected */}
                        <div className="mt-6 space-y-4">
                          <p className="text-creamy-yellow/60 font-varela text-vintage-sm mb-3">
                            Room types offered:
                          </p>
                          {['Standard Room', 'Deluxe Suite', 'Vietnamese Heritage Room'].map((roomType, index) => (
                            <div key={index} className="border border-terracotta-rose/20 rounded-lg p-4 bg-dark-brown/20">
                              <h3 className="font-libre font-semibold text-vintage-lg mb-2 text-creamy-yellow">{roomType}</h3>
                              <p className="text-creamy-yellow/80 text-sm mb-3 font-varela">
                                {roomType === 'Standard Room' && 'Comfortable room with traditional Vietnamese décor and modern amenities'}
                                {roomType === 'Deluxe Suite' && 'Spacious suite with city/nature views and premium Vietnamese hospitality'}
                                {roomType === 'Vietnamese Heritage Room' && 'Luxury room showcasing authentic Vietnamese culture and elegant design'}
                              </p>
                              <div className="flex justify-between items-center">
                                <div className="text-vintage-base text-creamy-yellow/60 font-varela italic">
                                  Select dates to see pricing
                                </div>
                                <Button
                                  disabled={true}
                                  className="bg-terracotta-rose/20 text-creamy-yellow/50 font-libre font-bold cursor-not-allowed"
                                >
                                  Select Dates
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : ([...rooms]
                  .sort((a, b) => {
                    const priceA = a.pricing?.price_per_night ?? Infinity;
                    const priceB = b.pricing?.price_per_night ?? Infinity;
                    return priceA - priceB;
                  }). map((room) => (
                    <div key={room.id} className="border border-terracotta-rose/20 rounded-lg p-4 bg-dark-brown/20 hover:bg-terracotta-rose/10 transition-colors">
                      <h3 className="font-libre font-semibold text-vintage-lg mb-2 text-creamy-yellow">{room.room_type} - Room {room.room_number} </h3>
                      <p className="text-creamy-yellow/80 text-sm mb-3 font-varela">{room.description}</p>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-creamy-yellow/80 font-varela">
                          <Users className="w-4 h-4 mr-2 text-terracotta-rose" />
                          <span>Max {room.max_occupancy} guests</span>
                        </div>
                        {room.bed_configuration && (
                          <div className="flex items-center text-sm text-creamy-yellow/80 font-varela">
                            <Bed className="w-4 h-4 mr-2 text-terracotta-rose" />
                            <span>{room.bed_configuration}</span>
                          </div>
                        )}
                        
                        {room.size_sqm && (
                          <div className="flex items-center text-sm text-creamy-yellow/80 font-varela">
                            <Maximize className="w-4 h-4 mr-2 text-terracotta-rose" />
                            <span>{room.size_sqm} sqm</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          {checkInDate && checkOutDate ? (
                            room.pricing?.price_per_night ? (
                              <div className="text-vintage-xl font-bold text-terracotta-rose font-libre">
                                ${room.pricing.price_per_night}
                                <span className="text-sm font-normal text-creamy-yellow/60 font-varela"> / night</span>
                              </div>
                            ) : (
                              <div className="text-vintage-base text-creamy-yellow/60 font-varela italic">
                                Out of stock
                              </div>
                            )
                          ) : (
                            <div className="text-vintage-base text-creamy-yellow/60 font-varela italic">
                              Select dates to see pricing
                            </div>
                          )}
                        </div>
                        <Button
                          onClick={() => handleBookRoom(room)}
                          className="bg-gradient-to-r from-terracotta-rose to-terracotta-orange text-dark-brown font-libre font-bold hover:shadow-lg transition-all duration-300"
                          disabled={!checkInDate || !checkOutDate || !room.pricing?.price_per_night}
                        >
                          {checkInDate && checkOutDate ? (
                            room.pricing?.price_per_night ? 'Select Room' : 'Out of Stock'
                          ) : 'Select Dates'}
                        </Button>
                      </div>
                    </div>
                  ))
                )}
                
                {!checkInDate || !checkOutDate ? (
                  <div className="text-center py-6">
                    <p className="text-creamy-yellow/70 font-varela text-vintage-base mb-6">Select dates to see availability</p>
                    <Button 
                      variant="outline" 
                      onClick={() => router.push('/hotels/')}
                      className="border-terracotta-rose/30 text-creamy-yellow hover:bg-terracotta-rose/20 font-varela bg-dark-brown/60"
                    >
                      New Search
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HotelDetailPage() {
  return (
    <>
      <Header />
      <Suspense fallback={
        <div className="min-h-screen bg-gradient-to-bl from-creamy-yellow to-creamy-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-4 border-terracotta-rose/20 border-t-terracotta-rose mx-auto mb-4"></div>
            <p className="text-dark-brown font-varela text-vintage-lg">Loading hotel details...</p>
          </div>
        </div>
      }>
        <HotelDetailContent />
      </Suspense>
    </>
  );
}
