// User types
export interface DashboardUser {
  id: string
  first_name: string
  last_name: string
  email: string
  phone_number?: string
  is_active: boolean
  roles: { id: string; name: string }[]
  created_at: string
  updated_at: string
}

// Hotel types
export interface Hotel {
  id: string
  name: string
  description: string
  address: string
  city: string
  state: string
  zip_code: string
  country: string
  phone_number: string
  latitude?: number
  longitude?: number
  avg_rating: number | null
  total_reviews: number
  is_active: boolean
  owner_id: string
  owner?: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
  rooms?: Room[]
  bookings?: Booking[]
  created_at: string
  updated_at: string
}

// Room types
export interface Room {
  id: string
  room_number: string
  room_type: string
  description?: string
  max_occupancy: number
  bed_configuration?: string
  size_sqm?: number | null
  is_active: boolean
  hotel_id: string
  availability?: RoomAvailability[]
  bookings?: Booking[]
  created_at: string
  updated_at: string
}

// Room Availability types
export interface RoomAvailability {
  id: string
  room_id: string
  date: string
  available_units: number
  price_per_night: number | string
  status: boolean
  created_at: string
  updated_at: string
}

// Booking types
export interface Booking {
  id: string
  hotel_id: string
  room_id: string
  user_id: string
  check_in_date: string
  check_out_date: string
  number_of_guests: number
  units_requested: number
  total_price: number | string
  paid_amount: number | string
  guest_name?: string
  guest_phone?: string
  guest_email?: string
  special_requests?: string
  status: 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed' | 'CheckedIn' | 'CheckedOut' | 'NoShow'
  payment_status: 'Pending' | 'Paid' | 'Refunded' | 'PartialRefund' | 'Failed'
  cancellation_reason?: string
  admin_notes?: string
  cancelled_at?: string
  confirmed_at?: string
  hotel?: Hotel
  room?: Room
  created_at: string
  updated_at: string
}

