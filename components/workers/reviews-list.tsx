import { Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import type { ReviewWithHirer } from "@/actions/search";

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3.5 h-3.5 ${
            s <= rating
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

interface ReviewsListProps {
  reviews:  ReviewWithHirer[];
  workerId: string;
}

export function ReviewsList({ reviews, workerId }: ReviewsListProps) {
  if (reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">
          No reviews yet. Be the first to review this worker!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {reviews.map((review) => {
        const hirer    = review.hirer as any;
        const name     = hirer?.full_name ?? "Anonymous";
        const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
        const timeAgo  = formatDistanceToNow(new Date(review.created_at), { addSuffix: true });

        return (
          <div key={review.id} className="flex gap-3">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarImage src={hirer?.avatar_url ?? ""} alt={name} />
              <AvatarFallback className="bg-secondary text-muted-foreground text-xs font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{name}</span>
                  <StarRow rating={review.rating} />
                </div>
                <span className="text-xs text-muted-foreground">{timeAgo}</span>
              </div>
              {review.comment && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {review.comment}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}