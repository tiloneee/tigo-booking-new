'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Booking } from '@/types/hotel';
import { HotelApiService } from '@/lib/api/hotels';
import { useAuth } from '@/lib/auth-context';
import { CheckCircle, Calendar, MapPin, Users, Phone, Mail, FileText, Home } from 'lucide-react';

export default function BookingConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const { user, accessToken } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedData = useRef(false); // Track if we've already fetched data

  const bookingId = params.id as string;

  useEffect(() => {
    const fetchBooking = async () => {
      if (!accessToken) {
        setError('Please sign in to view booking details');
        setLoading(false);
        return;
      }

      // Prevent refetching on token refresh
      if (hasFetchedData.current) {
        return;
      }

      try {
        // This would be a real API call to get booking details
        // For now, we'll create a mock booking object
        const mockBooking: Booking = {
          id: bookingId,
          hotel_id: 'hotel-1',
          room_id: 'room-1',
          user_id: user?.id || 'user-1',
          check_in_date: '2024-01-15',
          check_out_date: '2024-01-18',
          number_of_guests: 2,
          total_price: 450.00,
          status: 'Confirmed',
          payment_status: 'Paid',
          guest_name: 'John Doe',
          guest_phone: '+1 (555) 123-4567',
          guest_email: 'john.doe@example.com',
          special_requests: 'Late check-in requested',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          hotel: {
            id: 'hotel-1',
            name: 'Grand Plaza Hotel',
            city: 'New York',
            state: 'NY',
            address: '123 Main Street',
            phone_number: '+1 (555) 987-6543'
          } as any,
          room: {
            id: 'room-1',
            room_type: 'Deluxe King Room',
            description: 'Spacious room with king bed and city view'
          } as any
        };

        setBooking(mockBooking);
        hasFetchedData.current = true; // Mark as fetched
      } catch (err) {
        setError('Failed to load booking details');
        console.error('Error fetching booking:', err);
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId, accessToken, user]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateNights = () => {
    if (!booking) return 0;
    const checkIn = new Date(booking.check_in_date);
    const checkOut = new Date(booking.check_out_date);
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Booking Not Found</h2>
            <p className="text-gray-600 mb-4">{error || 'The booking you are looking for could not be found.'}</p>
            <Button onClick={() => router.push('/hotels/search')}>
              Book Another Stay
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Booking Confirmed!</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Your reservation has been successfully confirmed. You will receive a confirmation email shortly.
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Booking Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Booking Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm text-gray-600">Booking ID</div>
                  <div className="font-mono text-lg">{booking.id}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Status</div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-green-600 font-semibold">{booking.status}</span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-lg mb-2">{booking.hotel?.name}</h3>
                <div className="flex items-center text-gray-600 mb-2">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>{booking.hotel?.address}, {booking.hotel?.city}, {booking.hotel?.state}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Phone className="w-4 h-4 mr-2" />
                  <span>{booking.hotel?.phone_number}</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">{booking.room?.room_type}</h4>
                <p className="text-sm text-gray-600">{booking.room?.description}</p>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                  <span className="text-sm">
                    <strong>Check-in:</strong> {formatDate(booking.check_in_date)}
                  </span>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                  <span className="text-sm">
                    <strong>Check-out:</strong> {formatDate(booking.check_out_date)}
                  </span>
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2 text-gray-500" />
                  <span className="text-sm">
                    <strong>Guests:</strong> {booking.number_of_guests}
                  </span>
                </div>
                <div className="text-sm">
                  <strong>Duration:</strong> {calculateNights()} nights
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Guest Information & Payment */}
          <div className="space-y-6">
            {/* Guest Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Guest Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2 text-gray-500" />
                  <span>{booking.guest_name}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-gray-500" />
                  <span>{booking.guest_email}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-2 text-gray-500" />
                  <span>{booking.guest_phone}</span>
                </div>
                {booking.special_requests && (
                  <div className="border-t pt-3">
                    <div className="flex items-start">
                      <FileText className="w-4 h-4 mr-2 text-gray-500 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-1">Special Requests</div>
                        <div className="text-sm text-gray-600">{booking.special_requests}</div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Payment Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Amount</span>
                    <span className="text-2xl font-bold">${booking.total_price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Payment Status</span>
                    <span className="text-green-600 font-semibold">{booking.payment_status}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="max-w-4xl mx-auto mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => router.push('/hotels/search')}
            variant="outline"
            className="flex-1 sm:flex-none"
          >
            <Home className="w-4 h-4 mr-2" />
            Book Another Stay
          </Button>
          <Button
            onClick={() => window.print()}
            className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700"
          >
            <FileText className="w-4 h-4 mr-2" />
            Print Confirmation
          </Button>
        </div>

        {/* Important Information */}
        <Card className="max-w-4xl mx-auto mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Important Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-600">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Check-in Instructions</h4>
                <ul className="space-y-1">
                  <li>• Check-in time: 3:00 PM</li>
                  <li>• Please bring a valid photo ID</li>
                  <li>• Credit card required for incidentals</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Cancellation Policy</h4>
                <ul className="space-y-1">
                  <li>• Free cancellation until 24 hours before check-in</li>
                  <li>• Contact hotel directly for modifications</li>
                  <li>• Late cancellation may incur charges</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
