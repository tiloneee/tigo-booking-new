'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateBookingData, Hotel, Room } from '@/types/hotel';
import { HotelApiService } from '@/lib/api/hotels';
import { User, Phone, Mail, MessageSquare, CreditCard, Shield } from 'lucide-react';

interface BookingFormProps {
  hotel: Hotel;
  room: Room;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  onBookingComplete?: (bookingId: string) => void;
  onCancel?: () => void;
}

export default function BookingForm({
  hotel,
  room,
  checkInDate,
  checkOutDate,
  numberOfGuests,
  onBookingComplete,
  onCancel,
}: BookingFormProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    guestName: session?.user?.name || '',
    guestEmail: session?.user?.email || '',
    guestPhone: '',
    specialRequests: '',
    agreedToTerms: false,
  });

  // Calculate booking details
  const calculateNights = () => {
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const nights = calculateNights();
  const pricePerNight = room.pricing?.price_per_night || 100;
  const subtotal = pricePerNight * nights;
  const taxes = subtotal * 0.12; // 12% tax rate
  const total = subtotal + taxes;

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user) {
      alert('Please sign in to make a booking');
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

    setLoading(true);

    try {
      const bookingData: CreateBookingData = {
        hotel_id: hotel.id,
        room_id: room.id,
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        number_of_guests: numberOfGuests,
        guest_name: formData.guestName.trim(),
        guest_email: formData.guestEmail.trim(),
        guest_phone: formData.guestPhone.trim() || undefined,
        special_requests: formData.specialRequests.trim() || undefined,
        total_price: total,
      };

      const booking = await HotelApiService.createBooking(bookingData, session.accessToken as string);
      
      if (onBookingComplete) {
        onBookingComplete(booking.id);
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert('Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
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

  return (
    <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
      {/* Booking Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Booking Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg">{hotel.name}</h3>
            <p className="text-gray-600">{hotel.city}, {hotel.state}</p>
          </div>
          
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">{room.room_type}</h4>
            <p className="text-sm text-gray-600">{room.description}</p>
            <div className="text-sm text-gray-600 mt-1">
              <span>Max occupancy: {room.max_occupancy} guests</span>
              {room.bed_configuration && (
                <>
                  <span className="mx-2">•</span>
                  <span>{room.bed_configuration}</span>
                </>
              )}
            </div>
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between">
              <span>Check-in:</span>
              <span className="font-medium">{formatDate(checkInDate)}</span>
            </div>
            <div className="flex justify-between">
              <span>Check-out:</span>
              <span className="font-medium">{formatDate(checkOutDate)}</span>
            </div>
            <div className="flex justify-between">
              <span>Guests:</span>
              <span className="font-medium">{numberOfGuests}</span>
            </div>
            <div className="flex justify-between">
              <span>Nights:</span>
              <span className="font-medium">{nights}</span>
            </div>
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between">
              <span>${pricePerNight} × {nights} nights</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Taxes & fees</span>
              <span>${taxes.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Booking Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Guest Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="inline w-4 h-4 mr-1" />
                Full Name *
              </label>
              <input
                type="text"
                value={formData.guestName}
                onChange={(e) => handleInputChange('guestName', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your full name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="inline w-4 h-4 mr-1" />
                Email Address *
              </label>
              <input
                type="email"
                value={formData.guestEmail}
                onChange={(e) => handleInputChange('guestEmail', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email address"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="inline w-4 h-4 mr-1" />
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.guestPhone}
                onChange={(e) => handleInputChange('guestPhone', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MessageSquare className="inline w-4 h-4 mr-1" />
                Special Requests
              </label>
              <textarea
                value={formData.specialRequests}
                onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Any special requests or requirements..."
              />
            </div>

            {/* Payment Info */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-800 mb-3">
                <CreditCard className="inline w-4 h-4 mr-1" />
                Payment
              </h4>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center text-blue-700">
                  <Shield className="w-5 h-5 mr-2" />
                  <span className="text-sm font-medium">Secure Payment</span>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  Payment will be processed securely. You will be redirected to our payment partner.
                </p>
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
              <label htmlFor="terms" className="text-sm text-gray-600">
                I agree to the{' '}
                <a href="#" className="text-blue-600 hover:underline">
                  Terms and Conditions
                </a>{' '}
                and{' '}
                <a href="#" className="text-blue-600 hover:underline">
                  Privacy Policy
                </a>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="flex-1"
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={loading || !formData.agreedToTerms}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Processing...' : `Book Now - $${total.toFixed(2)}`}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
