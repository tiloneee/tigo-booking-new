"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Star } from "lucide-react"
import { ReviewStatistics } from "@/types/review"

interface ReviewStatisticsDisplayProps {
  statistics: ReviewStatistics
}

export default function ReviewStatisticsDisplay({ statistics }: ReviewStatisticsDisplayProps) {
  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5
    
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-6 w-6 ${
              star <= fullStars
                ? "fill-terracotta-rose text-terracotta-rose"
                : star === fullStars + 1 && hasHalfStar
                ? "fill-terracotta-rose/50 text-terracotta-rose"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    )
  }

  const calculatePercentage = (count: number) => {
    if (statistics.total_reviews === 0) return 0
    return (count / statistics.total_reviews) * 100
  }

  return (
    <Card className="bg-soft-beige/40 border-terracotta-rose/20">
      <CardHeader>
        <CardTitle className="text-deep-brown font-libre">Guest Reviews</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Overall Rating */}
          <div className="text-center md:text-left">
            <div className="inline-flex flex-col items-center md:items-start">
              <div className="text-6xl font-libre font-bold text-deep-brown mb-2">
                {statistics.average_rating.toFixed(1)}
              </div>
              {renderStars(statistics.average_rating)}
              <p className="text-ash-brown font-varela mt-2">
                Based on {statistics.total_reviews} review{statistics.total_reviews !== 1 ? 's' : ''}
              </p>
              {statistics.verified_stays_count > 0 && (
                <p className="text-sm text-ash-brown/60 font-varela mt-1">
                  {statistics.verified_stays_count} verified stay{statistics.verified_stays_count !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = statistics.rating_distribution[rating as keyof typeof statistics.rating_distribution] || 0
              const percentage = calculatePercentage(count)
              
              return (
                <div key={rating} className="flex items-center gap-3">
                  <span className="text-sm font-varela text-ash-brown w-8">
                    {rating} <Star className="inline h-3 w-3 fill-terracotta-rose text-terracotta-rose" />
                  </span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-terracotta-rose to-ash-brown rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-varela text-ash-brown w-12 text-right">
                    {count}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Category Averages */}
        {(statistics.average_cleanliness || statistics.average_location || statistics.average_service || statistics.average_value) && (
          <div className="mt-8 pt-6 border-t border-terracotta-rose/20">
            <h4 className="font-libre font-semibold text-deep-brown mb-4">Category Ratings</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {statistics.average_cleanliness && (
                <div className="text-center p-3 bg-creamy-white rounded-lg border border-terracotta-rose/10">
                  <p className="text-sm text-ash-brown/60 font-varela mb-1">Cleanliness</p>
                  <div className="flex items-center justify-center gap-1">
                    <Star className="h-4 w-4 fill-terracotta-rose text-terracotta-rose" />
                    <span className="text-lg font-libre font-bold text-deep-brown">
                      {statistics.average_cleanliness.toFixed(1)}
                    </span>
                  </div>
                </div>
              )}
              {statistics.average_location && (
                <div className="text-center p-3 bg-creamy-white rounded-lg border border-terracotta-rose/10">
                  <p className="text-sm text-ash-brown/60 font-varela mb-1">Location</p>
                  <div className="flex items-center justify-center gap-1">
                    <Star className="h-4 w-4 fill-terracotta-rose text-terracotta-rose" />
                    <span className="text-lg font-libre font-bold text-deep-brown">
                      {statistics.average_location.toFixed(1)}
                    </span>
                  </div>
                </div>
              )}
              {statistics.average_service && (
                <div className="text-center p-3 bg-creamy-white rounded-lg border border-terracotta-rose/10">
                  <p className="text-sm text-ash-brown/60 font-varela mb-1">Service</p>
                  <div className="flex items-center justify-center gap-1">
                    <Star className="h-4 w-4 fill-terracotta-rose text-terracotta-rose" />
                    <span className="text-lg font-libre font-bold text-deep-brown">
                      {statistics.average_service.toFixed(1)}
                    </span>
                  </div>
                </div>
              )}
              {statistics.average_value && (
                <div className="text-center p-3 bg-creamy-white rounded-lg border border-terracotta-rose/10">
                  <p className="text-sm text-ash-brown/60 font-varela mb-1">Value</p>
                  <div className="flex items-center justify-center gap-1">
                    <Star className="h-4 w-4 fill-terracotta-rose text-terracotta-rose" />
                    <span className="text-lg font-libre font-bold text-deep-brown">
                      {statistics.average_value.toFixed(1)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
