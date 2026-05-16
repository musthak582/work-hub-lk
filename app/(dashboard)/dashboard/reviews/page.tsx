import { redirect }        from "next/navigation";
import { requireAuth }     from "@/lib/session";
import { getMyReviewsAction } from "@/actions/reviews";
import { ReviewsDashboard }   from "@/components/dashboard/reviews-dashboard";

export const metadata = { title: "Reviews — WorkHub LK" };

export default async function ReviewsPage() {
  const user = await requireAuth();
  if (user.role !== "worker") redirect("/dashboard");

  const { reviews, avgRating, total, breakdown } =
    await getMyReviewsAction();

  return (
    <ReviewsDashboard
      reviews={reviews}
      avgRating={avgRating}
      total={total}
      breakdown={breakdown}
    />
  );
}