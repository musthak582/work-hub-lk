import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  MapPin, Star, Briefcase, Clock,
  CheckCircle2, Calendar, Shield,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getWorkerProfileAction, getWorkerReviewsAction } from "@/actions/search";
import { getSessionUser } from "@/lib/session";
import { formatDistanceToNow } from "date-fns";
import { ChatUnlockButton } from "@/components/workers/chat-unlock-button";
import { ReviewsList } from "@/components/workers/reviews-list";
import { PortfolioGrid } from "@/components/workers/portfolio-grid";
import { canReviewWorkerAction } from "@/actions/reviews";
import { SubmitReviewForm } from "@/components/workers/submit-review-form";


interface WorkerDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(
  { params }: WorkerDetailPageProps
): Promise<Metadata> {
  const { id } = await params;
  const worker = await getWorkerProfileAction(id);
  if (!worker) return { title: "Worker not found" };

  const name = (worker.user as any)?.full_name ?? "Worker";
  return {
    title: `${name} — ${worker.title}`,
    description: worker.description.slice(0, 160),
  };
}

export default async function WorkerDetailPage({ params }: WorkerDetailPageProps) {
  const { id } = await params;

  const [
    worker,
    currentUser,
    { reviews, total: totalReviews },
    reviewAccess
  ] = await Promise.all([
    getWorkerProfileAction(id),
    getSessionUser(),
    getWorkerReviewsAction(id),
    (async () => {
      const user = await getSessionUser();
      if (!user || user.role !== "hirer") return null;
      return canReviewWorkerAction(id);
    })(),
  ]);

  if (!worker) notFound();

  const name = (worker.user as any)?.full_name ?? "Worker";
  const avatar = (worker.user as any)?.avatar_url ?? null;
  const catName = (worker.category as any)?.name ?? "";
  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const isOwnProfile = currentUser?.id === (worker.user as any)?.id;
  const isHirer = currentUser?.role === "hirer";
  const joinedAgo = formatDistanceToNow(new Date(worker.created_at), { addSuffix: true });

  const AVAILABILITY_CONFIG = {
    available: { label: "Available now", color: "bg-green-100 text-green-700 border-green-200" },
    busy: { label: "Busy", color: "bg-amber-100 text-amber-700 border-amber-200" },
    unavailable: { label: "Not available", color: "bg-red-100   text-red-700   border-red-200" },
  };
  const avail = AVAILABILITY_CONFIG[worker.availability];

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* LEFT — Main profile */}
          <div className="lg:col-span-2 space-y-6">

            {/* Profile header card */}
            <div className="bg-card border border-border/60 rounded-2xl shadow-soft p-6">
              <div className="flex items-start gap-5">
                <Avatar className="w-20 h-20 ring-4 ring-border flex-shrink-0">
                  <AvatarImage src={worker.profile_image_url ?? avatar ?? ""} alt={name} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h1 className="text-xl font-display font-bold text-foreground">
                      {name}
                    </h1>
                    {worker.is_verified && (
                      <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        Verified
                      </div>
                    )}
                  </div>

                  <p className="text-base font-medium text-foreground/80 mb-2">
                    {worker.title}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="secondary">{catName}</Badge>
                    <Badge variant="outline" className="gap-1 text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      {worker.district}
                    </Badge>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${avail.color}`}>
                      {avail.label}
                    </span>
                  </div>

                  {/* Stats row */}
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="font-bold text-foreground">
                        {Number(worker.avg_rating).toFixed(1)}
                      </span>
                      <span className="text-muted-foreground">
                        ({worker.total_reviews} reviews)
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Briefcase className="w-4 h-4" />
                      {worker.experience_years} years exp.
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      Joined {joinedAgo}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* About */}
            <div className="bg-card border border-border/60 rounded-2xl shadow-soft p-6">
              <h2 className="text-base font-semibold text-foreground mb-3">About</h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {worker.description}
              </p>
            </div>

            {/* Portfolio */}
            {worker.portfolio && worker.portfolio.length > 0 && (
              <div className="bg-card border border-border/60 rounded-2xl shadow-soft p-6">
                <h2 className="text-base font-semibold text-foreground mb-4">
                  Portfolio
                </h2>
                <PortfolioGrid portfolio={worker.portfolio as any[]} />
              </div>
            )}

            {/* Reviews */}
            <div className="bg-card border border-border/60 rounded-2xl shadow-soft p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-semibold text-foreground">
                  Reviews{" "}
                  <span className="text-muted-foreground font-normal text-sm">
                    ({totalReviews})
                  </span>
                </h2>
                {worker.avg_rating > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="text-lg font-bold">
                      {Number(worker.avg_rating).toFixed(1)}
                    </span>
                    <span className="text-sm text-muted-foreground">/ 5</span>
                  </div>
                )}
              </div>
              <ReviewsList reviews={reviews} workerId={worker.id} />

              {reviewAccess?.canReview && (
                <div className="border-t border-border/40 mt-6 pt-6">
                  <SubmitReviewForm
                    workerId={worker.id}
                    chatId={reviewAccess.chatId!}
                    existingReview={reviewAccess.existingReview}
                  />
                </div>
              )}
            </div>
          </div>

          {/* RIGHT — Sidebar */}
          <div className="space-y-4">
            {/* Hire / Contact card */}
            <div className="bg-card border border-border/60 rounded-2xl shadow-soft p-5 sticky top-24">
              {worker.starting_price && (
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground mb-0.5">Starting from</p>
                  <p className="text-3xl font-display font-bold text-foreground">
                    LKR {Number(worker.starting_price).toLocaleString()}
                  </p>
                </div>
              )}

              {/* Chat unlock button */}
              {!isOwnProfile && (
                <ChatUnlockButton
                  workerId={worker.id}
                  workerName={name}
                  workerUserId={(worker.user as any)?.id}
                  currentUser={currentUser}
                />
              )}

              {isOwnProfile && (
                <div className="text-center py-2">
                  <p className="text-sm text-muted-foreground mb-3">This is your profile</p>
                  <a
                    href={`/profile/edit`}
                    className="text-sm text-primary hover:underline font-medium"
                  >
                    Edit profile →
                  </a>
                </div>
              )}

              <Separator className="my-4" />

              {/* Quick stats */}
              <div className="space-y-3">
                {[
                  {
                    icon: Star,
                    label: "Rating",
                    value: `${Number(worker.avg_rating).toFixed(1)} / 5.0`,
                  },
                  {
                    icon: Briefcase,
                    label: "Experience",
                    value: `${worker.experience_years} years`,
                  },
                  {
                    icon: MapPin,
                    label: "District",
                    value: worker.district,
                  },
                  {
                    icon: Shield,
                    label: "Phone verified",
                    value: "Yes",
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Icon className="w-3.5 h-3.5" />
                        {item.label}
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {item.value}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Safety notice */}
            <div className="bg-secondary/60 border border-border/40 rounded-xl p-4">
              <div className="flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-foreground mb-1">
                    Stay safe
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Always communicate through WorkHub LK chat.
                    Never share personal financial information.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}