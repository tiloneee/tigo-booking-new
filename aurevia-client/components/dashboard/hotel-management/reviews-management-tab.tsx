"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Star,
  MessageSquare,
  User,
  Search
} from "lucide-react"
import type { Review } from "@/types/review"

interface ReviewsManagementTabProps {
  hotelId: string
  reviews: Review[]
  accessToken: string
  onRefresh: () => void
}

export default function ReviewsManagementTab({ hotelId, reviews, accessToken, onRefresh }: ReviewsManagementTabProps) {
  const [filterRating, setFilterRating] = useState<number | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-creamy-yellow/30'
            }`}
          />
        ))}
      </div>
    )
  }

  const filteredReviews = reviews.filter((review) => {
    const matchesRating = filterRating === 'all' || review.rating === filterRating
    const matchesSearch = searchQuery === '' || 
      review.user?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.user?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.comment?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesRating && matchesSearch
  })

  const ratingCounts = {
    all: reviews.length,
    5: reviews.filter(r => r.rating === 5).length,
    4: reviews.filter(r => r.rating === 4).length,
    3: reviews.filter(r => r.rating === 3).length,
    2: reviews.filter(r => r.rating === 2).length,
    1: reviews.filter(r => r.rating === 1).length
  }

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0'

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-vintage-2xl font-libre text-deep-brown font-bold">
            Manage Reviews
          </h2>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1">
              {renderStars(Math.round(Number(averageRating)))}
            </div>
            <span className="text-vintage-lg font-libre font-semibold text-deep-brown">
              {averageRating}
            </span>
            <span className="text-vintage-sm text-creamy-yellow/60 font-varela">
              ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
            </span>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-creamy-yellow/60" />
          <input
            type="text"
            placeholder="Search reviews..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-dark-brown/60 border border-terracotta-rose/30 rounded-lg text-vintage-base text-creamy-yellow placeholder:text-creamy-yellow/40 font-varela focus:outline-none focus:ring-2 focus:ring-terracotta-rose/50"
          />
        </div>
      </div>

      {/* Rating Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {(['all', 5, 4, 3, 2, 1] as const).map((rating) => (
          <Button
            key={rating}
            onClick={() => setFilterRating(rating)}
            variant={filterRating === rating ? 'default' : 'outline'}
            className={`${
              filterRating === rating
                ? 'bg-gradient-to-r from-terracotta-rose/70 to-terracotta-orange/80 text-white border-terracotta-rose/30'
                : 'bg-dark-brown/40 text-creamy-yellow/80 border-terracotta-rose/30 hover:bg-terracotta-rose/20'
            } font-varela whitespace-nowrap`}
          >
            {rating === 'all' ? (
              'All Ratings'
            ) : (
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-current" />
                {rating}
              </div>
            )}
            <span className="ml-2 px-2 py-0.5 bg-creamy-yellow/20 rounded-full text-vintage-xs">
              {ratingCounts[rating]}
            </span>
          </Button>
        ))}
      </div>

      {/* Reviews List */}
      {filteredReviews.length === 0 ? (
        <Card className="bg-gradient-to-br from-dark-brown/90 to-deep-brown backdrop-blur-sm border-terracotta-rose/30">
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-16 w-16 text-terracotta-rose/60 mx-auto mb-4" />
            <h3 className="text-vintage-xl font-libre text-creamy-yellow mb-2">
              No Reviews Found
            </h3>
            <p className="text-vintage-base text-creamy-yellow/60 font-varela">
              {searchQuery || filterRating !== 'all'
                ? 'Try adjusting your filters or search query.'
                : 'No reviews have been submitted yet.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredReviews.map((review) => (
            <Card
              key={review.id}
              className="bg-gradient-to-br from-dark-brown/90 to-deep-brown backdrop-blur-sm border-terracotta-rose/30 hover:shadow-lg transition-all duration-300"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-terracotta-rose to-terracotta-orange rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-creamy-white" />
                    </div>
                    <div>
                      <CardTitle className="text-vintage-lg font-libre text-creamy-yellow">
                        {review.user?.first_name} {review.user?.last_name}
                      </CardTitle>
                      <p className="text-vintage-sm text-creamy-yellow/70 font-varela">
                        {new Date(review.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  {renderStars(review.rating)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Review Title */}
                {review.title && (
                  <h4 className="text-vintage-lg font-libre font-semibold text-creamy-yellow">
                    {review.title}
                  </h4>
                )}

                {/* Review Comment */}
                {review.comment && (
                  <p className="text-vintage-base text-creamy-yellow font-varela leading-relaxed">
                    {review.comment}
                  </p>
                )}

                {/* Detailed Ratings */}
                {(review.cleanliness_rating || review.location_rating || review.service_rating || review.value_rating) && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-terracotta-rose/30">
                    {review.cleanliness_rating && (
                      <div>
                        <p className="text-vintage-xs text-creamy-yellow/60 font-varela uppercase mb-1">
                          Cleanliness
                        </p>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-vintage-sm font-libre text-creamy-yellow">
                            {review.cleanliness_rating}
                          </span>
                        </div>
                      </div>
                    )}
                    {review.location_rating && (
                      <div>
                        <p className="text-vintage-xs text-creamy-yellow/60 font-varela uppercase mb-1">
                          Location
                        </p>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-vintage-sm font-libre text-creamy-yellow">
                            {review.location_rating}
                          </span>
                        </div>
                      </div>
                    )}
                    {review.service_rating && (
                      <div>
                        <p className="text-vintage-xs text-creamy-yellow/60 font-varela uppercase mb-1">
                          Service
                        </p>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-vintage-sm font-libre text-creamy-yellow">
                            {review.service_rating}
                          </span>
                        </div>
                      </div>
                    )}
                    {review.value_rating && (
                      <div>
                        <p className="text-vintage-xs text-creamy-yellow/60 font-varela uppercase mb-1">
                          Value
                        </p>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-vintage-sm font-libre text-creamy-yellow">
                            {review.value_rating}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Verified Badge */}
                {review.is_verified_stay && (
                  <div className="flex items-center gap-2 pt-2 text-vintage-sm text-green-300 font-varela">
                    <div className="w-5 h-5 bg-green-800/60 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    Verified Stay
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Results Summary */}
      <div className="text-center text-vintage-sm text-creamy-yellow/60 font-varela">
        Showing {filteredReviews.length} of {reviews.length} reviews
      </div>
    </div>
  )
}
