"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Star, Loader2 } from "lucide-react"
import { ReviewApiService } from "@/lib/api/reviews"
import { CreateReviewDto } from "@/types/review"
import { toast } from "sonner"

interface ReviewFormProps {
  hotelId: string
  hotelName: string
  bookingId?: string
  onSuccess?: () => void
  onCancel?: () => void
}

export default function ReviewForm({ 
  hotelId, 
  hotelName, 
  bookingId, 
  onSuccess, 
  onCancel 
}: ReviewFormProps) {
  const [formData, setFormData] = useState<CreateReviewDto>({
    booking_id: bookingId || "",
    rating: 0,
    comment: "",
    title: "",
    cleanliness_rating: 0,
    location_rating: 0,
    service_rating: 0,
    value_rating: 0,
  })
  const [hoveredRating, setHoveredRating] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const handleRatingClick = (rating: number, field: keyof CreateReviewDto = 'rating') => {
    setFormData(prev => ({ ...prev, [field]: rating }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.rating === 0) {
      toast.error("Please select a rating")
      return
    }

    setSubmitting(true)
    try {
      await ReviewApiService.createHotelReview(hotelId, formData)
      toast.success("Review submitted successfully!")
      
      // Reset form
      setFormData({
        booking_id: bookingId || "",
        rating: 0,
        comment: "",
        title: "",
        cleanliness_rating: 0,
        location_rating: 0,
        service_rating: 0,
        value_rating: 0,
      })
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      console.error("Error submitting review:", error)
      toast.error(error.response?.data?.message || "Failed to submit review. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const RatingStars = ({ 
    value, 
    onChange, 
    label 
  }: { 
    value: number
    onChange: (rating: number) => void
    label: string 
  }) => {
    const [localHover, setLocalHover] = useState(0)
    
    return (
      <div className="space-y-2">
        <Label className="text-ash-brown font-varela">{label}</Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              onMouseEnter={() => setLocalHover(star)}
              onMouseLeave={() => setLocalHover(0)}
              className="focus:outline-none transition-transform hover:scale-110"
            >
              <Star
                className={`h-8 w-8 ${
                  star <= (localHover || value)
                    ? "fill-terracotta-rose text-terracotta-rose"
                    : "text-gray-300"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <Card className="bg-creamy-white border-terracotta-rose/20">
      <CardHeader>
        <CardTitle className="text-deep-brown font-libre">Write a Review</CardTitle>
        <CardDescription className="text-ash-brown font-varela">
          Share your experience at {hotelName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Main Rating */}
          <RatingStars
            value={formData.rating}
            onChange={(rating) => handleRatingClick(rating, 'rating')}
            label="Overall Rating *"
          />

          {/* Review Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-ash-brown font-varela">
              Review Title
            </Label>
            <Input
              id="title"
              placeholder="Summarize your experience"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              maxLength={200}
              className="border-terracotta-rose/20 focus:border-terracotta-rose"
            />
          </div>

          {/* Review Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment" className="text-ash-brown font-varela">
              Your Review
            </Label>
            <Textarea
              id="comment"
              placeholder="Tell us about your stay..."
              value={formData.comment}
              onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
              maxLength={1000}
              rows={5}
              className="border-terracotta-rose/20 focus:border-terracotta-rose resize-none"
            />
            <p className="text-sm text-ash-brown/60 font-varela">
              {formData.comment?.length || 0} / 1000 characters
            </p>
          </div>

          {/* Additional Ratings */}
          <div className="border-t border-terracotta-rose/20 pt-6">
            <h4 className="text-lg font-libre font-semibold text-deep-brown mb-4">
              Rate by Category (Optional)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <RatingStars
                value={formData.cleanliness_rating || 0}
                onChange={(rating) => handleRatingClick(rating, 'cleanliness_rating')}
                label="Cleanliness"
              />
              <RatingStars
                value={formData.location_rating || 0}
                onChange={(rating) => handleRatingClick(rating, 'location_rating')}
                label="Location"
              />
              <RatingStars
                value={formData.service_rating || 0}
                onChange={(rating) => handleRatingClick(rating, 'service_rating')}
                label="Service"
              />
              <RatingStars
                value={formData.value_rating || 0}
                onChange={(rating) => handleRatingClick(rating, 'value_rating')}
                label="Value for Money"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={submitting || formData.rating === 0}
              className="flex-1 bg-gradient-to-r from-terracotta-rose to-ash-brown hover:from-ash-brown hover:to-terracotta-rose text-creamy-white font-libre"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Review"
              )}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={submitting}
                className="border-terracotta-rose text-terracotta-rose hover:bg-terracotta-rose/10"
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
