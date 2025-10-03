'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Hotel, Room, CreateBookingData } from '@/types/hotel';
import { HotelApiService } from '@/lib/api/hotels';
import { 
  ArrowLeft, 
  Star, 
  MapPin, 
  Phone, 
  Calendar,
  Users,
  Bed,
  Maximize,
  CreditCard,
  User,
  Mail,
  Phone as PhoneIcon,
  MessageSquare,
  Tag,
  Shield,
  CheckCircle
} from 'lucide-react';
import Header from '@/components/header';

function BookingSummaryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [selectedRooms, setSelectedRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pricingBreakdown, setPricingBreakdown] = useState<{
    nights: Array<{ date: string; dayName: string; price: number }>;
    subtotal: number;
    numberOfNights: number;
  } | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoError, setPromoError] = useState('');
  const [applyingPromo, setApplyingPromo] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    guestName: session?.user?.name || '',
    guestEmail: session?.user?.email || '',
    guestPhone: '',
    specialRequests: '',
    agreedToTerms: false,
  });

  // Get parameters from URL
  const hotelId = searchParams.get('hotel_id');
  const roomIds = searchParams.get('room_ids')?.split(',') || [];
  const checkInDate = searchParams.get('check_in_date');
  const checkOutDate = searchParams.get('check_out_date');
  const numberOfGuests = parseInt(searchParams.get('number_of_guests') || '2');
  const roomDataParam = searchParams.get('room_data');
  console.log('hotelId: ', hotelId);
  console.log('roomIds: ', roomIds);
  console.log('checkInDate: ', checkInDate);
  console.log('checkOutDate: ', checkOutDate);
  console.log('numberOfGuests: ', numberOfGuests);
  console.log('roomDataParam: ', roomDataParam);

  // Validate required parameters
  if (!hotelId || !roomIds.length || !checkInDate || !checkOutDate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-walnut-darkest via-walnut-dark to-walnut-light flex items-center justify-center">
        <Card className="max-w-md bg-walnut-dark/80 border border-copper-accent/30 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <h2 className="text-vintage-xl font-playfair font-bold text-cream-light mb-4">Invalid Booking</h2>
            <p className="text-cream-light/70 font-cormorant text-vintage-base mb-6">
              Missing required booking information. Please start your search again.
            </p>
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

  // Fetch hotel and room details
  useEffect(() => {
    // Don't fetch if required parameters are missing
    if (!hotelId || !roomIds.length || !checkInDate || !checkOutDate) {
      return;
    }

    const fetchBookingData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch hotel details
        const hotelData = await HotelApiService.getHotelById(hotelId);
        setHotel(hotelData);
        console.log('hotelData: ', hotelData);

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
              hotel_id: hotelId,
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
            hotel_id: hotelId,
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
              checkInDate,
              checkOutDate
            );
            setPricingBreakdown(breakdown);
            console.log('breakdown: ', breakdown);
          } catch (pricingError) {
            console.warn('Failed to fetch pricing breakdown:', pricingError);
            // Fallback calculation
            const nights = Math.ceil(
              (new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24)
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

    fetchBookingData();
  }, [hotelId, roomIds.join(','), checkInDate, checkOutDate, roomDataParam]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePromoCodeSubmit = async () => {
    if (!promoCode.trim()) {
      setPromoError('Please enter a promotion code');
      return;
    }

    setApplyingPromo(true);
    setPromoError('');

    try {
      // Simulate promo code validation (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock validation - in real app, this would be an API call
      const validPromoCodes = ['SAVE10', 'WELCOME20', 'FIRST15'];
      if (validPromoCodes.includes(promoCode.toUpperCase())) {
        const discountPercent = promoCode.toUpperCase() === 'SAVE10' ? 10 : 
                               promoCode.toUpperCase() === 'WELCOME20' ? 20 : 15;
        setPromoDiscount(discountPercent);
        setPromoError('');
      } else {
        setPromoError('Invalid promotion code');
        setPromoDiscount(0);
      }
    } catch (err) {
      setPromoError('Failed to validate promotion code');
    } finally {
      setApplyingPromo(false);
    }
  };

  const handleProceedToPayment = () => {
    if (!session?.user) {
      alert('Please sign in to continue with your booking');
      return;
    }

    if (!formData.agreedToTerms) {
      alert('Please agree to the terms and conditions');
      return;
    }

    if (!formData.guestName.trim() || !formData.guestEmail.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    // Navigate to payment page with booking data
    const params = new URLSearchParams({
      hotel_id: hotelId,
      room_ids: roomIds.join(','),
      check_in_date: checkInDate,
      check_out_date: checkOutDate,
      number_of_guests: numberOfGuests.toString(),
      guest_name: formData.guestName,
      guest_email: formData.guestEmail,
      guest_phone: formData.guestPhone,
      special_requests: formData.specialRequests,
      promo_code: promoCode,
      promo_discount: promoDiscount.toString(),
      // Pass room data to payment page
      room_data: selectedRooms.length > 0 ? JSON.stringify({
        id: selectedRooms[0].id,
        room_type: selectedRooms[0].room_type,
        description: selectedRooms[0].description,
        max_occupancy: selectedRooms[0].max_occupancy,
        bed_configuration: selectedRooms[0].bed_configuration,
        size_sqm: selectedRooms[0].size_sqm,
        pricing: selectedRooms[0].pricing
      }) : roomDataParam || '',
    });

    router.push(`/booking/payment?${params.toString()}`);
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
  const taxes = subtotalAfterDiscount * 0.10; // 10% tax rate
  const total = subtotalAfterDiscount + taxes;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-walnut-darkest via-walnut-dark to-walnut-light flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-4 border-copper-accent/20 border-t-copper-accent mx-auto mb-4"></div>
          <p className="text-cream-light font-cormorant text-vintage-lg">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error || !hotel || selectedRooms.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-walnut-darkest via-walnut-dark to-walnut-light flex items-center justify-center">
        <Card className="max-w-md bg-walnut-dark/80 border border-copper-accent/30 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <h2 className="text-vintage-xl font-playfair font-bold text-cream-light mb-4">Booking Error</h2>
            <p className="text-cream-light/70 font-cormorant text-vintage-base mb-6">{error || 'Unable to load booking information'}</p>
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
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            className="border-copper-accent/30 text-cream-light hover:bg-copper-accent/20 font-cormorant bg-walnut-dark/60 backdrop-blur-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Hotel
          </Button>
          
          <div className="text-vintage-base text-cream-light/80 font-cormorant bg-walnut-dark/60 px-4 py-2 rounded-lg border border-copper-accent/20 backdrop-blur-sm">
            <Calendar className="w-4 h-4 inline mr-2 text-copper-accent" />
            {formatDate(checkInDate)} - {formatDate(checkOutDate)} • {numberOfGuests} guests
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content - Booking Summary */}
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

            {/* Selected Rooms */}
            <Card className="bg-walnut-dark/80 border border-copper-accent/30 backdrop-blur-sm shadow-2xl shadow-walnut-darkest/50">
              <CardHeader>
                <CardTitle className="text-vintage-xl font-playfair text-cream-light">Selected Rooms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedRooms.map((room, index) => (
                  <div key={room.id} className="border border-copper-accent/20 rounded-lg p-4 bg-walnut-darkest/20">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-playfair font-semibold text-vintage-lg text-cream-light">{room.room_type}</h3>
                        <p className="text-cream-light/80 text-sm font-cormorant">{room.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-vintage-lg font-bold text-copper-accent font-playfair">
                          ${room.pricing?.price_per_night || 100}
                          <span className="text-sm font-normal text-cream-light/60 font-cormorant"> / night</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm text-cream-light/80 font-cormorant">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-2 text-copper-accent" />
                        <span>Max {room.max_occupancy} guests</span>
                      </div>
                      {room.bed_configuration && (
                        <div className="flex items-center">
                          <Bed className="w-4 h-4 mr-2 text-copper-accent" />
                          <span>{room.bed_configuration}</span>
                        </div>
                      )}
                      {room.size_sqm && (
                        <div className="flex items-center">
                          <Maximize className="w-4 h-4 mr-2 text-copper-accent" />
                          <span>{room.size_sqm} sqm</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Guest Information Form */}
            <Card className="bg-walnut-dark/80 border border-copper-accent/30 backdrop-blur-sm shadow-2xl shadow-walnut-darkest/50">
              <CardHeader>
                <CardTitle className="text-vintage-xl font-playfair text-cream-light">Guest Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-cream-light font-cormorant text-sm font-medium mb-2">
                      <User className="inline w-4 h-4 mr-1" />
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.guestName}
                      onChange={(e) => handleInputChange('guestName', e.target.value)}
                      className="w-full px-3 py-2 bg-walnut-darkest/60 border border-copper-accent/30 rounded text-cream-light font-cormorant focus:outline-none focus:border-copper-accent"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-cream-light font-cormorant text-sm font-medium mb-2">
                      <Mail className="inline w-4 h-4 mr-1" />
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={formData.guestEmail}
                      onChange={(e) => handleInputChange('guestEmail', e.target.value)}
                      className="w-full px-3 py-2 bg-walnut-darkest/60 border border-copper-accent/30 rounded text-cream-light font-cormorant focus:outline-none focus:border-copper-accent"
                      placeholder="Enter your email address"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-cream-light font-cormorant text-sm font-medium mb-2">
                    <PhoneIcon className="inline w-4 h-4 mr-1" />
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.guestPhone}
                    onChange={(e) => handleInputChange('guestPhone', e.target.value)}
                    className="w-full px-3 py-2 bg-walnut-darkest/60 border border-copper-accent/30 rounded text-cream-light font-cormorant focus:outline-none focus:border-copper-accent"
                    placeholder="Enter your phone number"
                    required
                  />
                </div>

                <div>
                  <label className="block text-cream-light font-cormorant text-sm font-medium mb-2">
                    <MessageSquare className="inline w-4 h-4 mr-1" />
                    Special Requests
                  </label>
                  <textarea
                    value={formData.specialRequests}
                    onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                    className="w-full px-3 py-2 bg-walnut-darkest/60 border border-copper-accent/30 rounded text-cream-light font-cormorant focus:outline-none focus:border-copper-accent"
                    rows={3}
                    placeholder="Any special requests or requirements..."
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Pricing & Payment */}
          <div className="space-y-6">
            {/* Promotion Code */}
            <Card className="bg-walnut-dark/80 border border-copper-accent/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-cream-light font-playfair flex items-center">
                  <Tag className="w-5 h-5 mr-2 text-copper-accent" />
                  Promotion Code
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="flex-1 px-3 py-2 bg-walnut-darkest/60 border border-copper-accent/30 rounded text-cream-light font-cormorant focus:outline-none focus:border-copper-accent"
                    placeholder="Enter promo code"
                  />
                  <Button
                    onClick={handlePromoCodeSubmit}
                    disabled={applyingPromo || !promoCode.trim()}
                    className="bg-gradient-to-r from-copper-accent to-copper-light text-walnut-dark font-cinzel font-bold hover:shadow-lg transition-all duration-300"
                  >
                    {applyingPromo ? 'Applying...' : 'Apply'}
                  </Button>
                </div>
                
                {promoError && (
                  <p className="text-red-400 text-sm font-cormorant">{promoError}</p>
                )}
                
                {promoDiscount > 0 && (
                  <div className="flex items-center text-green-400 text-sm font-cormorant">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {promoDiscount}% discount applied!
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pricing Summary */}
            <Card className="bg-walnut-dark/80 border border-copper-accent/30 backdrop-blur-sm sticky top-6">
              <CardHeader>
                <CardTitle className="text-cream-light font-playfair">Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Dates and Guests */}
                <div className="space-y-2 text-vintage-lg text-cream-light/80 font-cormorant">
                  <div className="flex justify-between">
                    <span>Check-in:</span>
                    <span className="font-bold text-cream-light">{formatDate(checkInDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Check-out:</span>
                    <span className="font-bold text-cream-light">{formatDate(checkOutDate)}</span>
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
                    <div className="flex justify-between text-vintage-lg text-cream-light/80 font-cormorant text-green-400">
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

                {/* Terms */}
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={formData.agreedToTerms}
                    onChange={(e) => handleInputChange('agreedToTerms', e.target.checked)}
                    className="mt-1 mr-3"
                    required
                  />
                  <label htmlFor="terms" className="text-sm text-cream-light/70 font-cormorant">
                    I agree to the{' '}
                    <a href="#" className="text-copper-accent hover:underline">
                      Terms and Conditions
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-copper-accent hover:underline">
                      Privacy Policy
                    </a>
                  </label>
                </div>

                {/* Proceed to Payment Button */}
                <Button
                  onClick={handleProceedToPayment}
                  disabled={!formData.agreedToTerms || !formData.guestName.trim() || !formData.guestEmail.trim()}
                  className="w-full bg-gradient-to-r from-copper-accent to-copper-light text-walnut-dark font-cinzel font-bold hover:shadow-lg hover:shadow-copper-accent/30 transition-all duration-300"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Proceed to Payment - ${total.toFixed(2)}
                </Button>

                {/* Security Notice */}
                <div className="flex items-center text-xs text-cream-light/60 font-cormorant">
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

export default function BookingSummaryPage() {
  return (
    <>
      <Header />
      <Suspense fallback={
        <div className="min-h-screen bg-gradient-to-br from-walnut-darkest via-walnut-dark to-walnut-light flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-4 border-copper-accent/20 border-t-copper-accent mx-auto mb-4"></div>
            <p className="text-cream-light font-cormorant text-vintage-lg">Loading booking details...</p>
          </div>
        </div>
      }>
        <BookingSummaryContent />
      </Suspense>
    </>
  );
}
