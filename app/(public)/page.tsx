import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, Star, Shield, Zap, CheckCircle2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroSection }        from "@/components/home/hero-section";
import { CategoriesSection }  from "@/components/home/categories-section";
import { HowItWorks }         from "@/components/home/how-it-works";
import { FeaturedWorkers }    from "@/components/home/featured-workers";
import { StatsSection }       from "@/components/home/stats-section";
import { CtaSection }         from "@/components/home/cta-section";
import { createClient }       from "@/lib/supabase/server";

export default async function HomePage() {
  // Fetch categories + featured workers server-side
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug, icon, description")
    .eq("is_active", true)
    .order("sort_order")
    .limit(12);

  const { data: featuredWorkers } = await supabase
    .from("worker_profiles")
    .select(`
      id, title, district, avg_rating, total_reviews,
      starting_price, profile_image_url, experience_years,
      user:users(full_name, avatar_url),
      category:categories(name, slug)
    `)
    .eq("is_active", true)
    .eq("availability", "available")
    .order("avg_rating", { ascending: false })
    .limit(8);

  return (
    <>
      <HeroSection />
      <CategoriesSection categories={categories ?? []} />
      <StatsSection />
      <HowItWorks />
      <FeaturedWorkers workers={featuredWorkers ?? []} />
      <CtaSection />
    </>
  );
}