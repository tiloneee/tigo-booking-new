// Hotel and booking related types

export interface Hotel {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  phone_number: string;
  latitude: number | null;
  longitude: number | null;
  avg_rating: number;
  total_reviews: number;
  is_active: boolean;
  owner_id: string;
  rooms: Room[];
  amenities: HotelAmenity[];
  created_at: string;
  updated_at: string;
  images?: string[];
  pricing?: {
    min_price: number;
    max_price: number;
    currency: string;
  };
  // Optional location object for search results (Elasticsearch format)
  location?: {
    city: string;
    country: string;
    state?: string;
    address?: string;
    coordinates?: {
      lat: number;
      lon: number;
    };
  };
}

export interface Room {
  id: string;
  room_number: string;
  room_type: string;
  description: string;
  max_occupancy: number;
  bed_configuration: string;
  size_sqm: number;
  is_active: boolean;
  hotel_id: string;
  created_at: string;
  updated_at: string;
  pricing?: {
    price_per_night: number;
    currency: string;
  };
  availability?: RoomAvailability[];
}

export interface RoomAvailability {
  id: string;
  room_id: string;
  date: string;
  available_units: number;
  price_per_night: number;
  is_blocked: boolean;
}

export interface HotelAmenity {
  id: string;
  name: string;
  category: string;
  icon?: string;
  description?: string;
}

export interface HotelSearchQuery {
  query?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  radius_km?: number;
  check_in_date?: string;
  check_out_date?: string;
  number_of_guests?: number;
  number_of_rooms?: number;
  amenity_ids?: string[];
  min_price?: number;
  max_price?: number;
  min_rating?: number;
  room_type?: string;
  sort_by?: 'price' | 'rating' | 'distance' | 'name' | 'relevance';
  sort_order?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export interface HotelSearchResult {
  hotels: Hotel[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
  aggregations?: {
    price_ranges?: {
      buckets: Array<{
        key: string;
        doc_count: number;
        from?: number;
        to?: number;
      }>;
    };
    rating_distribution?: {
      buckets: Array<{
        key: string;
        doc_count: number;
        from?: number;
        to?: number;
      }>;
    };
    cities?: {
      buckets: Array<{
        key: string;
        doc_count: number;
      }>;
    };
    amenities?: {
      amenity_names?: {
        buckets: Array<{
          key: string;
          doc_count: number;
        }>;
      };
    };
  };
}

export interface AutocompleteResult {
  suggestions: Array<{
    text: string;
    type: 'hotel' | 'city' | 'amenity';
    id?: string;
  }>;
}

export interface CreateBookingData {
  hotel_id: string;
  room_id: string;
  check_in_date: string;
  check_out_date: string;
  number_of_guests: number;
  number_of_rooms?: number;
  special_requests?: string;
  guest_name?: string;
  guest_phone?: string;
  guest_email?: string;
  units_requested?: number;
  total_price?: number;
  status?: 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed';
}

export interface Booking {
  id: string;
  hotel_id: string;
  room_id: string;
  user_id: string;
  check_in_date: string;
  check_out_date: string;
  number_of_guests: number;
  total_price: number;
  status: 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed' | 'CheckedIn' | 'CheckedOut' | 'NoShow';
  payment_status: 'Pending' | 'Paid' | 'Refunded' | 'PartialRefund' | 'Failed';
  guest_name: string;
  guest_phone: string;
  guest_email: string;
  special_requests?: string;
  created_at: string;
  updated_at: string;
  hotel?: Hotel;
  room?: Room;
}

export interface SearchFormData {
  destination: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  numberOfRooms: number;
}
