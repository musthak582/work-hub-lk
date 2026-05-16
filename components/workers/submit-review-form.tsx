"use client";

import { useState, useTransition } from "react";
import { motion }  from "framer-motion";
import { Loader2, Star, CheckCircle2 } from "lucide-react";
import { toast }   from "sonner";
import { Button }  from "@/components/ui/button";
import { Label }   from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/components/shared/star-rating";
import { submitReviewAction } from "@/actions/reviews";

interface SubmitReviewFormProps {
  workerId:       string;
  chatId:         string;
  existingReview: { id: string; rating: number; comment: string | null } | null;
  onSuccess?:     () => void;
}

export function SubmitReviewForm({
  workerId, chatId, existingReview, onSuccess,
}: SubmitReviewFormProps) {
  const [rating,   setRating]   = useState(existingReview?.rating   ?? 0);
  const [comment,  setComment]  = useState(existingReview?.comment  ?? "");
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (rating === 0) {
      toast.error("Please select a star rating");
      return;
    }

    startTransition(async () => {
      const fd = new FormData();
      fd.append("worker_id", workerId);
      fd.append("chat_id",   chatId);
      fd.append("rating",    String(rating));
      if (comment.trim()) fd.append("comment", comment.trim());

      const result = await submitReviewAction(fd);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(result.message ?? "Review submitted!");
      setSubmitted(true);
      onSuccess?.();
    });
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-6"
      >
        <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
        <p className="text-sm font-semibold text-foreground mb-1">
          Thank you for your review!
        </p>
        <p className="text-xs text-muted-foreground">
          Your feedback helps the community.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1">
          {existingReview ? "Update your review" : "Leave a review"}
        </h3>
        <p className="text-xs text-muted-foreground">
          Share your experience to help other hirers.
        </p>
      </div>

      {/* Star rating */}
      <div className="space-y-1.5">
        <Label>Your rating</Label>
        <StarRating
          value={rating}
          onChange={setRating}
          size="lg"
          showLabel
        />
        {rating === 0 && (
          <p className="text-xs text-muted-foreground">
            Click a star to rate
          </p>
        )}
      </div>

      {/* Comment */}
      <div className="space-y-1.5">
        <div className="flex justify-between">
          <Label htmlFor="comment">
            Comment{" "}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <span className="text-xs text-muted-foreground">
            {comment.length}/1000
          </span>
        </div>
        <Textarea
          id="comment"
          rows={3}
          placeholder="Describe your experience with this worker…"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={1000}
        />
      </div>

      <Button
        onClick={handleSubmit}
        disabled={isPending || rating === 0}
        className="w-full"
      >
        {isPending ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting…</>
        ) : existingReview ? (
          <><Star className="w-4 h-4 mr-2" />Update review</>
        ) : (
          <><Star className="w-4 h-4 mr-2" />Submit review</>
        )}
      </Button>
    </div>
  );
}