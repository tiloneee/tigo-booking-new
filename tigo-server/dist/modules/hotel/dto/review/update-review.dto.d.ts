import { CreateReviewDto } from './create-review.dto';
declare const UpdateReviewDto_base: import("@nestjs/mapped-types").MappedType<Partial<Omit<CreateReviewDto, "hotel_id" | "booking_id">>>;
export declare class UpdateReviewDto extends UpdateReviewDto_base {
}
export {};
