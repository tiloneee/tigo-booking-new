'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Hotel, Room, Booking } from '@/types/hotel';
import { HotelApiService } from '@/lib/api/hotels';
import { 
  CheckCircle,
  Calendar,
  Users,
  MapPin,
  Phone,
  Star,
  MessageSquare,
  CreditCard,
  Download,
  ArrowLeft,
  Home,
  Loader2
} from 'lucide-react';
import Header from '@/components/header';

function BookingSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { accessToken } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedData = useRef(false); // Track if we've already fetched data

  const bookingId = searchParams.get('booking_id');

  // Fetch booking details
  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (!bookingId) {
        setError('Invalid booking ID');
        setLoading(false);
        return;
      }

      // Don't fetch if access token is not available yet
      if (!accessToken) {
        console.log('Access token not available yet, waiting...');
        return;
      }

      // Prevent refetching on token refresh
      if (hasFetchedData.current) {
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        // Fetch booking details
        const bookingData = await HotelApiService.getBookingById(bookingId);
        
        // Validate booking data
        if (!bookingData) {
          throw new Error('Booking data is null or undefined');
        }
        
        if (!bookingData.id) {
          throw new Error('Booking data missing ID field');
        }
        
        setBooking(bookingData);

        // Fetch hotel details
        if (bookingData.hotel_id) {
          const hotelData = await HotelApiService.getHotelById(bookingData.hotel_id);
          setHotel(hotelData);
        }
        
        // Fetch room details
        if (bookingData.room_id) {
          const roomData = await HotelApiService.getRoomById(bookingData.room_id);
          setRoom(roomData);
        }
        
        // Mark as fetched
        hasFetchedData.current = true;
      } catch (err) {
        console.error('Error fetching booking details:', err);
        setError('Failed to load booking details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [bookingId, accessToken]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownloadReceipt = () => {
    // In a real application, this would generate and download a PDF receipt
    alert('Receipt download feature will be implemented with PDF generation');
  };

  const handleStartChat = () => {
    if (hotel) {
      // Navigate to chat with hotel owner
      router.push(`/chat?hotel_id=${hotel.id}&booking_id=${bookingId}`);
    }
  };

  if (loading || !accessToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-walnut-darkest via-walnut-dark to-walnut-light flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-4 border-copper-accent/20 border-t-copper-accent mx-auto mb-4"></div>
          <p className="text-cream-light font-cormorant text-vintage-lg">
            {!accessToken ? 'Loading authentication...' : 'Loading booking confirmation...'}
          </p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-walnut-darkest via-walnut-dark to-walnut-light flex items-center justify-center">
        <Card className="max-w-md bg-walnut-dark/80 border border-copper-accent/30 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <h2 className="text-vintage-xl font-playfair font-bold text-cream-light mb-4">Booking Not Found</h2>
            <p className="text-cream-light/70 font-cormorant text-vintage-base mb-6">{error || 'Unable to load booking details'}</p>
            <Button 
              onClick={() => router.push('/dashboard')}
              className="bg-gradient-to-r from-copper-accent to-copper-light text-walnut-dark font-cinzel font-bold hover:shadow-lg hover:shadow-copper-accent/30 transition-all duration-300"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-walnut-darkest via-walnut-dark to-walnut-light">
      <div className="container mx-auto px-4 py-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500 to-green-600 rounded-full mb-6">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-vintage-3xl font-playfair font-bold text-cream-light mb-4">
            Booking Confirmed!
          </h1>
          <p className="text-vintage-lg text-cream-light/80 font-cormorant mb-2">
            Your reservation has been successfully created
          </p>
          <p className="text-vintage-base text-cream-light/60 font-cormorant">
            Booking ID: <span className="font-mono text-copper-accent">{booking.id}</span>
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content - Booking Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hotel Information */}
            {hotel && (
              <Card className="bg-walnut-dark/80 border border-copper-accent/30 backdrop-blur-sm shadow-2xl shadow-walnut-darkest/50">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h2 className="text-vintage-2xl font-playfair font-bold text-cream-light mb-2">{hotel.name}</h2>
                      <div className="flex items-center text-cream-light/80 mb-2 font-cormorant text-vintage-base">
                        <MapPin className="w-4 h-4 mr-2 text-copper-accent" />
                        <span>{hotel.address}, {hotel.location?.city || hotel.city}, {hotel.location?.state || hotel.state}</span>
                      </div>
                      <div className="flex items-center text-cream-light/80 font-cormorant text-vintage-base">
                        <Phone className="w-4 h-4 mr-2 text-copper-accent" />
                        <span>{hotel.phone_number}</span>
                      </div>
                    </div>
                    
                    {hotel.avg_rating && Number(hotel.avg_rating) > 0 && (
                      <div className="text-center">
                        <div className="flex items-center bg-gradient-to-r from-copper-accent to-copper-light text-walnut-dark px-3 py-2 rounded-lg mb-1">
                          <Star className="w-4 h-4 mr-1 fill-current" />
                          <span className="text-vintage-sm font-cinzel font-bold">{Number(hotel.avg_rating).toFixed(1)}</span>
                        </div>
                        <div className="text-vintage-xs text-cream-light/60 font-cormorant">
                          {hotel.total_reviews || 0} reviews
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Booking Details */}
            <Card className="bg-walnut-dark/80 border border-copper-accent/30 backdrop-blur-sm shadow-2xl shadow-walnut-darkest/50">
              <CardHeader>
                <CardTitle className="text-vintage-xl font-playfair text-cream-light">Booking Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-playfair font-semibold text-cream-light mb-2">Check-in Information</h3>
                      <div className="space-y-2 text-sm text-cream-light/80 font-cormorant">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-copper-accent" />
                          <span>{formatDate(booking.check_in_date)}</span>
                        </div>
                        <div className="text-cream-light/60">
                          Check-in time: 3:00 PM
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-playfair font-semibold text-cream-light mb-2">Check-out Information</h3>
                      <div className="space-y-2 text-sm text-cream-light/80 font-cormorant">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-copper-accent" />
                          <span>{formatDate(booking.check_out_date)}</span>
                        </div>
                        <div className="text-cream-light/60">
                          Check-out time: 11:00 AM
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="font-playfair font-semibold text-cream-light mb-2">Guest Information</h3>
                      <div className="space-y-2 text-sm text-cream-light/80 font-cormorant">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-2 text-copper-accent" />
                          <span>{booking.number_of_guests} guest{booking.number_of_guests > 1 ? 's' : ''}</span>
                        </div>
                        <div className="text-cream-light/60">
                          Guest: {booking.guest_name}
                        </div>
                        <div className="text-cream-light/60">
                          Email: {booking.guest_email}
                        </div>
                        {booking.guest_phone && (
                          <div className="text-cream-light/60">
                            Phone: {booking.guest_phone}
                          </div>
                        )}
                      </div>
                    </div>

                    {room && (
                      <div>
                        <h3 className="font-playfair font-semibold text-cream-light mb-2">Room Information</h3>
                        <div className="space-y-2 text-sm text-cream-light/80 font-cormorant">
                          <div className="text-cream-light">
                            {room.room_type}
                          </div>
                          <div className="text-cream-light/60">
                            {room.description}
                          </div>
                          <div className="text-cream-light/60">
                            Max occupancy: {room.max_occupancy} guests
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {booking.special_requests && (
                  <div>
                    <h3 className="font-playfair font-semibold text-cream-light mb-2">Special Requests</h3>
                    <div className="text-sm text-cream-light/80 font-cormorant bg-walnut-darkest/30 p-3 rounded-lg">
                      {booking.special_requests}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card className="bg-walnut-dark/80 border border-copper-accent/30 backdrop-blur-sm shadow-2xl shadow-walnut-darkest/50">
              <CardHeader>
                <CardTitle className="text-vintage-xl font-playfair text-cream-light">What's Next?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-copper-accent rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-walnut-dark text-xs font-bold">1</span>
                    </div>
                    <div>
                      <h4 className="font-playfair font-semibold text-cream-light">Confirmation Email</h4>
                      <p className="text-sm text-cream-light/70 font-cormorant">
                        You will receive a confirmation email with all booking details shortly.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-copper-accent rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-walnut-dark text-xs font-bold">2</span>
                    </div>
                    <div>
                      <h4 className="font-playfair font-semibold text-cream-light">Hotel Contact</h4>
                      <p className="text-sm text-cream-light/70 font-cormorant">
                        The hotel will contact you closer to your check-in date with additional information.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-copper-accent rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-walnut-dark text-xs font-bold">3</span>
                    </div>
                    <div>
                      <h4 className="font-playfair font-semibold text-cream-light">Chat with Hotel</h4>
                      <p className="text-sm text-cream-light/70 font-cormorant">
                        You can start chatting with the hotel owner for any questions or special arrangements.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Actions & Summary */}
          <div className="space-y-6">
            {/* Payment Summary */}
            <Card className="bg-walnut-dark/80 border border-copper-accent/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-cream-light font-playfair">Payment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm text-cream-light/80 font-cormorant">
                  <div className="flex justify-between">
                    <span>Booking ID:</span>
                    <span className="font-mono text-copper-accent">{booking.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="text-green-400 font-semibold">{booking.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment:</span>
                    <span className="text-green-400 font-semibold">{booking.payment_status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Paid:</span>
                    <span className="font-bold text-copper-accent">${Number(booking.total_price).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Booked on:</span>
                    <span>{formatDate(booking.created_at)}</span>
                  </div>
                </div>

                <div className="border-t border-copper-accent/20 pt-4">
                  <Button
                    onClick={handleDownloadReceipt}
                    variant="outline"
                    className="w-full border-copper-accent/30 text-cream-light hover:bg-copper-accent/20 font-cormorant bg-walnut-dark/60"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Receipt
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card className="bg-walnut-dark/80 border border-copper-accent/30 backdrop-blur-sm">
              <CardContent className="p-6 space-y-4">
                <Button
                  onClick={handleStartChat}
                  className="w-full bg-gradient-to-r from-copper-accent to-copper-light text-walnut-dark font-cinzel font-bold hover:shadow-lg hover:shadow-copper-accent/30 transition-all duration-300"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Chat with Hotel Owner
                </Button>

                <Button
                  onClick={() => router.push('/dashboard')}
                  variant="outline"
                  className="w-full border-copper-accent/30 text-cream-light hover:bg-copper-accent/20 font-cormorant bg-walnut-dark/60"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go to Dashboard
                </Button>

                <Button
                  onClick={() => router.push('/hotels/')}
                  variant="outline"
                  className="w-full border-copper-accent/30 text-cream-light hover:bg-copper-accent/20 font-cormorant bg-walnut-dark/60"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Book Another Hotel
                </Button>
              </CardContent>
            </Card>

            {/* Support */}
            <Card className="bg-walnut-dark/80 border border-copper-accent/30 backdrop-blur-sm">
              <CardContent className="p-6">
                <h3 className="font-playfair font-semibold text-cream-light mb-3">Need Help?</h3>
                <p className="text-sm text-cream-light/70 font-cormorant mb-4">
                  If you have any questions about your booking, please contact our support team.
                </p>
                <div className="space-y-2 text-sm text-cream-light/60 font-cormorant">
                  <div>Email: support@aurevia.com</div>
                  <div>Phone: +1 (555) 123-4567</div>
                  <div>Available 24/7</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <>
      <Header />
      <Suspense fallback={
        <div className="min-h-screen bg-gradient-to-br from-walnut-darkest via-walnut-dark to-walnut-light flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-4 border-copper-accent/20 border-t-copper-accent mx-auto mb-4"></div>
            <p className="text-cream-light font-cormorant text-vintage-lg">Loading booking confirmation...</p>
          </div>
        </div>
      }>
        <BookingSuccessContent />
      </Suspense>
    </>
  );
}
