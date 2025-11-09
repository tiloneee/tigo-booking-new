'use client';

import { Hotel } from '@/types/hotel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Star, Users, Car, Wifi, Utensils, Camera } from 'lucide-react';

interface HotelCardProps {
  hotel: Hotel;
  onViewDetails: (hotelId: string) => void;
  checkInDate?: string;
  checkOutDate?: string;
  numberOfGuests?: number;
}

export default function HotelCard({ 
  hotel, 
  onViewDetails, 
  checkInDate, 
  checkOutDate, 
  numberOfGuests 
}: HotelCardProps) {
  const handleViewDetails = () => {
    onViewDetails(hotel.id);
  };

  // Mock image for demo purposes - in production, you'd have actual hotel images
  const imageUrl = hotel.images?.[0] || `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=250&fit=crop&auto=format`;

  // Get popular amenities to display (max 3)
  const displayAmenities = hotel.amenities?.slice(0, 3) || [];

  // Calculate nights between dates for pricing
  const calculateNights = () => {
    if (!checkInDate || !checkOutDate) return 1;
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const nights = calculateNights();
  const pricePerNight = hotel.pricing?.min_price || 100;
  const totalPrice = pricePerNight * nights;
  const shouldShowPrice = checkInDate && checkOutDate;

  return (
    <Card className="overflow-hidden hover:shadow-2xl hover:shadow-terracotta-rose/20 transition-all duration-500 cursor-pointer group bg-gradient-to-r from-dark-brown/90 to-deep-brown backdrop-blur-sm border-terracotta-rose/30 px-2" onClick={handleViewDetails}>
      <div className="flex flex-col md:flex-row">
        {/* Hotel Image */}
        <div className="relative md:w-80 h-48 md:h-auto">
          <img
            src={imageUrl}
            alt={hotel.name}
            className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-brown/60 to-transparent"></div>
          
          <div className="absolute top-3 left-3">
            <div className="bg-gradient-to-r from-terracotta-rose to-terracotta-orange text-dark-brown px-3 py-1 rounded-full text-vintage-sm font-libre font-bold">
              Featured
            </div>
          </div>
          <div className="absolute top-3 right-3">

          </div>
        </div>

        {/* Hotel Details */}
        <CardContent className="flex-1 p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <CardTitle className="text-xl font-fraunces font-semibold text-creamy-yellow group-hover:text-terracotta-rose transition-colors">
                {hotel.name}
              </CardTitle>
              <div className="flex items-center text-creamy-yellow/70 mt-1">
                <MapPin className="w-4 h-4 mr-1 text-terracotta-rose" />
                <span className="text-vintage-sm font-varela">
                   {hotel.city || hotel.location?.city || 'City not available'}, {hotel.country}
                </span>
              </div>
            </div>
            
            {/* Rating */}
            {hotel.avg_rating && hotel.avg_rating > 0 && (
              <div className="text-center">
                <div className="flex items-center bg-gradient-to-r from-terracotta-rose to-terracotta-orange text-dark-brown px-3 py-2 rounded-lg mb-1">
                  <Star className="w-4 h-4 mr-1 fill-current" />
                  <span className="text-vintage-sm font-libre font-bold">
                    {Number(hotel.avg_rating).toFixed(1)}
                  </span>
                </div>
                <div className="text-vintage-xs text-creamy-yellow/60 font-varela">
                  {hotel.total_reviews || 0} reviews
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <p className="text-creamy-yellow/70 text-vintage-sm mb-3 line-clamp-2 font-varela leading-relaxed">
            {hotel.description}
          </p>

          {/* Amenities */}
          {displayAmenities.length > 0 && (
            <div className="flex items-center gap-4 mb-3">
              {displayAmenities.map((amenity, index) => (
                <div key={amenity.id || index} className="flex items-center text-vintage-xs text-terracotta-rose">
                  {amenity.category === 'connectivity' && <Wifi className="w-3 h-3 mr-1" />}
                  {amenity.category === 'services' && amenity.name.includes('Parking') && <Car className="w-3 h-3 mr-1" />}
                  {amenity.category === 'dining' && <Utensils className="w-3 h-3 mr-1" />}
                  {!['connectivity', 'services', 'dining'].includes(amenity.category) && <Users className="w-3 h-3 mr-1" />}
                  <span className="font-varela">{amenity.name}</span>
                </div>
              ))}
              {hotel.amenities && hotel.amenities.length > 3 && (
                <span className="text-vintage-xs text-terracotta-rose/70 font-varela">
                  +{hotel.amenities.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Guest capacity and room info */}
          {hotel.rooms && hotel.rooms.length > 0 && (
            <div className="text-vintage-xs text-creamy-yellow/60 mb-4 font-varela">
              <span>Max occupancy: {Math.max(...hotel.rooms.map(room => room.max_occupancy))} guests</span>
              <span className="mx-2 text-terracotta-rose">•</span>
              <span>{hotel.rooms.length} room types available</span>
            </div>
          )}

          {/* Footer with pricing and booking */}
          <div className="flex justify-between items-end">
            <div className="text-right">
              {shouldShowPrice ? (
                <>
                  <div className="text-vintage-2xl font-libre font-bold text-creamy-yellow">
                    ${pricePerNight}
                    <span className="text-vintage-sm font-varela font-normal text-creamy-yellow/60"> / night</span>
                  </div>
                  {nights > 1 && (
                    <div className="text-vintage-sm text-creamy-yellow/60 font-varela">
                      Total: ${totalPrice} for {nights} nights
                    </div>
                  )}
                </>
              ) : (
                <div className="text-vintage-base text-creamy-yellow/60 font-varela italic">
                  Select dates to see pricing
                </div>
              )}
            </div>
            
            <Button 
              onClick={handleViewDetails}
              className="bg-gradient-to-r from-terracotta-rose to-terracotta-orange text-dark-brown font-libre font-bold px-6 hover:shadow-lg hover:shadow-terracotta-rose/30 transition-all duration-300"
            >
              View Details
            </Button>
          </div>
        </CardContent>
      </div>

    </Card>
  );
}