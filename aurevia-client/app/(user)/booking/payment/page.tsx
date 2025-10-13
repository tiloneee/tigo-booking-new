'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Hotel, Room, CreateBookingData } from '@/types/hotel';
import { HotelApiService } from '@/lib/api/hotels';
import { NotificationApiService } from '@/lib/api/notifications';
import { useNotifications } from '@/components/notifications/notification-provider';
import { 
  ArrowLeft, 
  CreditCard,
  Shield,
  CheckCircle,
  Calendar,
  Users,
  MapPin,
  Star,
  Phone,
  Loader2,
  AlertCircle
} from 'lucide-react';
import Header from '@/components/header';

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { dispatch } = useNotifications();
  
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [selectedRooms, setSelectedRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
  });
  const [paypalStatus, setPaypalStatus] = useState<'idle' | 'processing' | 'completed'>('idle');

  // Get parameters from URL
  const hotelId = searchParams.get('hotel_id');
  const roomIds = searchParams.get('room_ids')?.split(',') || [];
  const checkInDate = searchParams.get('check_in_date');
  const checkOutDate = searchParams.get('check_out_date');
  const numberOfGuests = parseInt(searchParams.get('number_of_guests') || '2');
  const guestName = searchParams.get('guest_name') || '';
  const guestEmail = searchParams.get('guest_email') || '';
  const guestPhone = searchParams.get('guest_phone') || '';
  const specialRequests = searchParams.get('special_requests') || '';
  const promoCode = searchParams.get('promo_code') || '';
  const promoDiscount = parseFloat(searchParams.get('promo_discount') || '0');
  const roomDataParam = searchParams.get('room_data');

  // Calculate pricing
  const [pricingBreakdown, setPricingBreakdown] = useState<{
    nights: Array<{ date: string; dayName: string; price: number }>;
    subtotal: number;
    numberOfNights: number;
  } | null>(null);

  // Fetch hotel and room details
  useEffect(() => {
    const fetchBookingData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch hotel details
        const hotelData = await HotelApiService.getHotelById(hotelId!);
        setHotel(hotelData);

        // Try to use room data from URL parameters first
        let roomsToUse: Room[] = [];
        
        if (roomDataParam) {
          try {
            const roomData = JSON.parse(roomDataParam);
            console.log('Using room data from URL:', roomData);
            // Create a complete Room object from the passed data
            const room: Room = {
              id: roomData.id,
              room_number: `Room ${roomIds.indexOf(roomData.id) + 1}`,
              room_type: roomData.room_type,
              description: roomData.description,
              max_occupancy: roomData.max_occupancy,
              bed_configuration: roomData.bed_configuration,
              size_sqm: roomData.size_sqm,
              is_active: true,
              hotel_id: hotelId!,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              pricing: roomData.pricing
            };
            roomsToUse = [room];
            console.log('Room created from URL data:', room);
          } catch (error) {
            console.error('Failed to parse room data from URL:', error);
          }
        }
        
        // If no room data from URL, try to fetch from API
        if (roomsToUse.length === 0) {
          try {
            const roomsData = await Promise.all(
              roomIds.map(async (roomId) => {
                try {
                  console.log('Fetching room with ID:', roomId);
                  const room = await HotelApiService.getRoomById(roomId);
                  console.log('Room fetched successfully:', room);
                  return room;
                } catch (error) {
                  console.error('Failed to fetch room:', roomId, error);
                  return null;
                }
              })
            );
            console.log('roomsData: ', roomsData);
            const validRooms = roomsData.filter(room => room !== null && room !== undefined) as Room[];
            console.log('validRooms: ', validRooms);
            
            if (validRooms.length > 0) {
              roomsToUse = validRooms;
            }
          } catch (error) {
            console.error('Error fetching rooms:', error);
          }
        }

        // If still no rooms, create fallback room data
        if (roomsToUse.length === 0 && roomIds.length > 0) {
          console.log('No rooms available, creating fallback room data');
          const fallbackRooms: Room[] = roomIds.map((roomId, index) => ({
            id: roomId,
            room_number: `Room ${index + 1}`,
            room_type: 'Standard Room',
            description: 'Comfortable room with modern amenities',
            max_occupancy: numberOfGuests,
            bed_configuration: '1 King Bed',
            size_sqm: 25,
            is_active: true,
            hotel_id: hotelId!,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            pricing: {
              price_per_night: 100,
              currency: 'USD'
            }
          }));
          roomsToUse = fallbackRooms;
          console.log('Fallback rooms created:', fallbackRooms);
        }
        
        setSelectedRooms(roomsToUse);

        // Fetch pricing breakdown for the first room (assuming all rooms have same pricing)
        if (roomsToUse.length > 0) {
          try {
            const breakdown = await HotelApiService.getRoomPricingBreakdown(
              roomsToUse[0].id,
              checkInDate!,
              checkOutDate!
            );
            setPricingBreakdown(breakdown);
          } catch (pricingError) {
            console.warn('Failed to fetch pricing breakdown:', pricingError);
            // Fallback calculation
            const nights = Math.ceil(
              (new Date(checkOutDate!).getTime() - new Date(checkInDate!).getTime()) / (1000 * 60 * 60 * 24)
            );
            const pricePerNight = roomsToUse[0].pricing?.price_per_night || 100;
            setPricingBreakdown({
              nights: [],
              subtotal: pricePerNight * nights * roomsToUse.length,
              numberOfNights: nights,
            });
          }
        }
      } catch (err) {
        console.error('Error fetching booking data:', err);
        setError('Failed to load booking information. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (hotelId && roomIds.length && checkInDate && checkOutDate) {
      fetchBookingData();
    }
  }, [hotelId, roomIds.join(','), checkInDate, checkOutDate, roomDataParam]);

  const handleCardInputChange = (field: string, value: string) => {
    let formattedValue = value;
    
    // Format card number with spaces
    if (field === 'cardNumber') {
      // formattedValue = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
      // if (formattedValue.length > 19) formattedValue = formattedValue.slice(0, 19);
    }
    
    // Format expiry date
    if (field === 'expiryDate') {
      formattedValue = value.replace(/\D/g, '').replace(/(.{2})/, '$1/');
      if (formattedValue.length > 5) formattedValue = formattedValue.slice(0, 5);
    }
    
    // Format CVV
    if (field === 'cvv') {
      formattedValue = value.replace(/\D/g, '');
      if (formattedValue.length > 4) formattedValue = formattedValue.slice(0, 4);
    }
    
    setCardDetails(prev => ({ ...prev, [field]: formattedValue }));
  };

  const handlePayment = async () => {
    if (!session?.user) {
      alert('Please sign in to complete your booking');
      return;
    }

    // Validate card details
    if (paymentMethod === 'card') {
      if (!cardDetails.cardNumber.replace(/\s/g, '') || 
          !cardDetails.expiryDate || 
          !cardDetails.cvv || 
          !cardDetails.cardholderName) {
        alert('Please fill in all card details');
        return;
      }
    }

    if (paymentMethod === 'paypal' && paypalStatus !== 'completed') {
      setError('Please complete the PayPal authorization.');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Calculate final pricing
      const subtotal = pricingBreakdown?.subtotal || 0;
      const nights = pricingBreakdown?.numberOfNights || 0;
      const discountAmount = (subtotal * promoDiscount) / 100;
      const subtotalAfterDiscount = subtotal - discountAmount;
      const taxes = subtotalAfterDiscount * 0.10;
      const total = subtotalAfterDiscount + taxes;

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create booking
      const bookingData: CreateBookingData = {
        hotel_id: hotelId!,
        room_id: selectedRooms[0].id, // Use first room for now
        check_in_date: checkInDate!,
        check_out_date: checkOutDate!,
        number_of_guests: numberOfGuests,
        guest_name: guestName,
        guest_email: guestEmail,
        guest_phone: guestPhone || undefined,
        special_requests: specialRequests || undefined,
        total_price: total,
      };

      console.log('bookingData: ', bookingData);

      const booking = await HotelApiService.createBooking(bookingData, session.accessToken as string);
      
      console.log('booking: ', booking);
      console.log('booking.id: ', booking?.id);
      console.log('booking keys: ', booking ? Object.keys(booking) : 'booking is null/undefined');
      console.log('booking.hotel: ', booking?.hotel);
      console.log('booking.hotel.owner_id: ', booking?.hotel?.owner_id);

      // Validate booking response
      if (!booking) {
        throw new Error('Invalid booking response: booking is null or undefined');
      }
      
      if (!booking.id) {
        console.error('Booking response missing ID. Full response:', booking);
        throw new Error('Invalid booking response: missing booking ID');
      }

      // Create booking confirmation notification for current user (database)
      if (session?.accessToken && session?.user?.id) {
        try {
          await NotificationApiService.createNotification({
            user_id: session.user.id,
            type: 'BOOKING_CONFIRMATION',
            title: 'Booking Confirmed!',
            message: `Your booking at ${hotel?.name} has been confirmed. Booking ID: ${booking.id}`,
            metadata: {
              booking_id: booking.id,
              hotel_id: hotelId,
              total_price: total,
              check_in_date: checkInDate,
              check_out_date: checkOutDate,
            },
            related_entity_type: 'booking',
            related_entity_id: booking.id,
          }, session.accessToken);
          
          console.log('Booking confirmation notification created successfully');
        } catch (error) {
          console.error('Failed to create booking confirmation notification:', error);
          // Don't fail the payment process if notification creation fails
        }
      }

      // Create hotel owner notification via API
      if (booking.hotel?.owner_id && session?.accessToken) {
        try {
          await NotificationApiService.createNotification({
            user_id: booking.hotel.owner_id,
            type: 'NEW_BOOKING',
            title: 'New Booking Received!',
            message: `You have received a new booking at ${hotel?.name} from ${guestName}. Booking ID: ${booking.id}`,
            metadata: {
              booking_id: booking.id,
              hotel_id: hotelId,
              guest_name: guestName,
              guest_email: guestEmail,
              total_price: total,
              check_in_date: checkInDate,
              check_out_date: checkOutDate,
            },
            related_entity_type: 'booking',
            related_entity_id: booking.id,
          }, session.accessToken);
          
          console.log('Hotel owner notification created successfully');
        } catch (error) {
          console.error('Failed to create hotel owner notification:', error);
          // Don't fail the payment process if notification creation fails
        }
      }
      
      // Redirect to success page
      router.push(`/booking/success?booking_id=${booking.id}`);
      
    } catch (err) {
      console.error('Payment error:', err);
      setError('Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Calculate pricing
  const subtotal = pricingBreakdown?.subtotal || 0;
  const nights = pricingBreakdown?.numberOfNights || 0;
  const discountAmount = (subtotal * promoDiscount) / 100;
  const subtotalAfterDiscount = subtotal - discountAmount;
  const taxes = subtotalAfterDiscount * 0.10;
  const total = subtotalAfterDiscount + taxes;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-walnut-darkest via-walnut-dark to-walnut-light flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-4 border-copper-accent/20 border-t-copper-accent mx-auto mb-4"></div>
          <p className="text-cream-light font-cormorant text-vintage-lg">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error || !hotel || selectedRooms.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-walnut-darkest via-walnut-dark to-walnut-light flex items-center justify-center">
        <Card className="max-w-md bg-walnut-dark/80 border border-copper-accent/30 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <h2 className="text-vintage-xl font-playfair font-bold text-cream-light mb-4">Payment Error</h2>
            <p className="text-cream-light/70 font-cormorant text-vintage-base mb-6">{error || 'Unable to load payment information'}</p>
            <Button 
              onClick={() => router.push('/hotels/')}
              className="bg-gradient-to-r from-copper-accent to-copper-light text-walnut-dark font-cinzel font-bold hover:shadow-lg hover:shadow-copper-accent/30 transition-all duration-300"
            >
              Start New Search
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-walnut-darkest via-walnut-dark to-walnut-light">
      <div className="absolute top-0 left-1/4 w-80 h-80 bg-copper-accent/4 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-copper-light/3 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            className="border-copper-accent/30 text-cream-light hover:bg-copper-accent/20 font-cormorant bg-walnut-dark/60 backdrop-blur-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Summary
          </Button>
          
          <div className="text-vintage-base text-cream-light/80 font-cormorant bg-walnut-dark/60 px-4 py-2 rounded-lg border border-copper-accent/20 backdrop-blur-sm">
            <Calendar className="w-4 h-4 inline mr-2 text-copper-accent" />
            {formatDate(checkInDate!)} - {formatDate(checkOutDate!)} • {numberOfGuests} guests
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content - Payment Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hotel Information */}
            <Card className="bg-walnut-dark/80 border border-copper-accent/30 backdrop-blur-sm shadow-2xl shadow-walnut-darkest/50">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h1 className="text-vintage-2xl font-playfair font-bold text-cream-light mb-2">{hotel.name}</h1>
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

            {/* Payment Method Selection */}
            <Card className="bg-walnut-dark/80 border border-copper-accent/30 backdrop-blur-sm shadow-2xl shadow-walnut-darkest/50">
              <CardHeader>
                <CardTitle className="text-vintage-xl font-playfair text-cream-light">Payment Method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Payment Method Options */}
                <div className="grid md:grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      setPaymentMethod('card');
                      setPaypalStatus('idle');
                    }}
                    className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                      paymentMethod === 'card'
                        ? 'border-copper-accent bg-copper-accent/10'
                        : 'border-copper-accent/30 hover:border-copper-accent/60'
                    }`}
                  >
                    <div className="flex items-center">
                      <CreditCard className="w-6 h-6 mr-3 text-copper-accent" />
                      <div className="text-left">
                        <h3 className="font-playfair font-semibold text-cream-light">Credit/Debit Card</h3>
                        <p className="text-sm text-cream-light/70 font-cormorant">Visa, Mastercard, American Express</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setPaymentMethod('paypal');
                      setPaypalStatus('idle');
                    }}
                    className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                      paymentMethod === 'paypal'
                        ? 'border-copper-accent bg-copper-accent/10'
                        : 'border-copper-accent/30 hover:border-copper-accent/60'
                    }`}
                  >
                    <div className="flex items-center">
                      <Shield className="w-6 h-6 mr-3 text-copper-accent" />
                      <div className="text-left">
                        <h3 className="font-playfair font-semibold text-cream-light">PayPal</h3>
                        <p className="text-sm text-cream-light/70 font-cormorant">Pay with your PayPal account</p>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Card Details Form */}
                {paymentMethod === 'card' && (
                  <div className="space-y-4">
                    <h3 className="font-playfair font-semibold text-cream-light text-lg">Card Details</h3>
                    
                    <div>
                      <label className="block text-cream-light font-cormorant text-sm font-medium mb-2">
                        Card Number *
                      </label>
                      <input
                        type="text"
                        value={cardDetails.cardNumber}
                        onChange={(e) => handleCardInputChange('cardNumber', e.target.value)}
                        className="w-full px-3 py-2 bg-walnut-darkest/60 border border-copper-accent/30 rounded text-cream-light font-cormorant focus:outline-none focus:border-copper-accent"
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-cream-light font-cormorant text-sm font-medium mb-2">
                          Expiry Date *
                        </label>
                        <input
                          type="text"
                          value={cardDetails.expiryDate}
                          onChange={(e) => handleCardInputChange('expiryDate', e.target.value)}
                          className="w-full px-3 py-2 bg-walnut-darkest/60 border border-copper-accent/30 rounded text-cream-light font-cormorant focus:outline-none focus:border-copper-accent"
                          placeholder="MM/YY"
                          maxLength={5}
                        />
                      </div>

                      <div>
                        <label className="block text-cream-light font-cormorant text-sm font-medium mb-2">
                          CVV *
                        </label>
                        <input
                          type="text"
                          value={cardDetails.cvv}
                          onChange={(e) => handleCardInputChange('cvv', e.target.value)}
                          className="w-full px-3 py-2 bg-walnut-darkest/60 border border-copper-accent/30 rounded text-cream-light font-cormorant focus:outline-none focus:border-copper-accent"
                          placeholder="123"
                          maxLength={4}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-cream-light font-cormorant text-sm font-medium mb-2">
                        Cardholder Name *
                      </label>
                      <input
                        type="text"
                        value={cardDetails.cardholderName}
                        onChange={(e) => handleCardInputChange('cardholderName', e.target.value)}
                        className="w-full px-3 py-2 bg-walnut-darkest/60 border border-copper-accent/30 rounded text-cream-light font-cormorant focus:outline-none focus:border-copper-accent"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>
                )}

                {/* PayPal Option */}
                {paymentMethod === 'paypal' && (
                  <div className="text-center py-8">
                    {paypalStatus === 'completed' ? (
                      <CheckCircle className="w-16 h-16 mx-auto text-green-400 mb-4" />
                    ) : (
                      <Shield className="w-16 h-16 mx-auto text-copper-accent mb-4" />
                    )}
                    <h3 className="font-playfair font-semibold text-cream-light text-lg mb-2">PayPal Payment</h3>
                    <p className="text-cream-light/70 font-cormorant mb-4">
                      You will be redirected to PayPal to complete your payment securely.
                    </p>
                    <Button
                      onClick={async () => {
                        if (paypalStatus === 'processing' || paypalStatus === 'completed' || processing) return;
                        setPaypalStatus('processing');
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        setPaypalStatus('completed');
                      }}
                      disabled={paypalStatus === 'processing' || paypalStatus === 'completed' || processing}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800/60 disabled:cursor-not-allowed text-white font-cinzel font-bold"
                    >
                      {paypalStatus === 'processing' ? (
                        <span className="flex items-center justify-center">
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </span>
                      ) : paypalStatus === 'completed' ? (
                        <span className="flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Payment Complete
                        </span>
                      ) : (
                        'Pay with PayPal'
                      )}
                    </Button>
                  </div>
                )}

                {/* Security Notice */}
                <div className="flex items-center text-sm text-cream-light/60 font-cormorant bg-walnut-darkest/30 p-4 rounded-lg">
                  <Shield className="w-5 h-5 mr-3 text-copper-accent" />
                  <span>Your payment information is encrypted and secure. We never store your card details.</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Booking Summary & Payment */}
          <div className="space-y-6">
            
            {/* Booking Summary */}
            <Card className="bg-walnut-dark/80 border border-copper-accent/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-playfair text-cream-light">Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Dates and Guests */}
                <div className="space-y-2 text-vintage-lg text-cream-light/80 font-cormorant">
                  <div className="flex justify-between">
                    <span>Check-in:</span>
                    <span className="font-bold text-cream-light">{formatDate(checkInDate!)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Check-out:</span>
                    <span className="font-bold text-cream-light">{formatDate(checkOutDate!)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Guests:</span>
                    <span className="font-bold text-cream-light">{numberOfGuests}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Nights:</span>
                    <span className="font-bold text-cream-light">{nights}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rooms:</span>
                    <span className="font-bold text-cream-light">{selectedRooms.length}</span>
                  </div>
                </div>

                <div className="border-t border-copper-accent/20 pt-4 space-y-2">
                  <div className="flex justify-between text-vintage-lg text-cream-light/80 font-cormorant">
                    <span>Subtotal ({nights} nights)</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  
                  {promoDiscount > 0 && (
                    <div className="flex justify-between text-sm text-green-400">
                      <span>Discount ({promoDiscount}%)</span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-vintage-lg text-cream-light/80 font-cormorant">
                    <span>Taxes & fees (10%)</span>
                    <span>${taxes.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-copper-accent font-bold text-lg border-t border-copper-accent/20 pt-2">
                    <span>Total</span>
                    <span className="">${total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Button */}
            <Card className="bg-walnut-dark/80 border border-copper-accent/30 backdrop-blur-sm">
              <CardContent className="p-6">
                {error && (
                  <div className="flex items-center text-red-400 text-sm font-cormorant mb-4">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  onClick={handlePayment}
                  disabled={
                    processing ||
                    (paymentMethod === 'card' && (!cardDetails.cardNumber.replace(/\s/g, '') || !cardDetails.expiryDate || !cardDetails.cvv || !cardDetails.cardholderName)) ||
                    (paymentMethod === 'paypal' && paypalStatus !== 'completed')
                  }
                  className="w-full bg-gradient-to-r from-copper-accent to-copper-light text-walnut-dark font-cinzel font-bold hover:shadow-lg hover:shadow-copper-accent/30 transition-all duration-300"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Complete Payment - ${total.toFixed(2)}
                    </>
                  )}
                </Button>

                {/* Security Notice */}
                <div className="flex items-center text-xs text-cream-light/60 font-cormorant mt-4">
                  <Shield className="w-4 h-4 mr-2" />
                  <span>Your payment information is secure and encrypted</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <>
      <Header />
      <Suspense fallback={
        <div className="min-h-screen bg-gradient-to-br from-walnut-darkest via-walnut-dark to-walnut-light flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-4 border-copper-accent/20 border-t-copper-accent mx-auto mb-4"></div>
            <p className="text-cream-light font-cormorant text-vintage-lg">Loading payment details...</p>
          </div>
        </div>
      }>
        <PaymentContent />
      </Suspense>
    </>
  );
}
