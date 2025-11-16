// Review related types

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  title: string | null;
  cleanliness_rating: number | null;
  location_rating: number | null;
  service_rating: number | null;
  value_rating: number | null;
  is_verified_stay: boolean;
  stay_date: string | null;
  helpful_votes: number;
  total_votes: number;
  hotel_id: string;
  user_id: string;
  booking_id: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
  hotel?: {
    id: string;
    name: string;
    city: string;
    country: string;
  };
  booking?: {
    id: string;
    check_in_date: string;
    check_out_date: string;
    number_of_guests: number;
    room?: {
      id: string;
      room_type: string;
    };
  };
}

export interface CreateReviewDto {
  booking_id: string;
  rating: number;
  comment?: string;
  title?: string;
  cleanliness_rating?: number;
  location_rating?: number;
  service_rating?: number;
  value_rating?: number;
}

export interface UpdateReviewDto {
  rating?: number;
  comment?: string;
  title?: string;
  cleanliness_rating?: number;
  location_rating?: number;
  service_rating?: number;
  value_rating?: number;
}

export interface ReviewStatistics {
  total_reviews: number;
  average_rating: number;
  rating_distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  average_cleanliness: number | null;
  average_location: number | null;
  average_service: number | null;
  average_value: number | null;
  verified_stays_count: number;
}
