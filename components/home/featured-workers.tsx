"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Star, MapPin, Briefcase, ArrowRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Worker {
  id: string;
  title: string;
  district: string;
  avg_rating: number;
  total_reviews: number;
  starting_price: number | null;
  profile_image_url: string | null;
  experience_years: number;
  user: { full_name: string; avatar_url: string | null } | null;
  category: { name: string; slug: string } | null;
}

export function FeaturedWorkers({ workers }: { workers: Worker[] }) {
  if (!workers.length) return null;

  return (
    <section className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-14">
          <div>
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">
              Top rated
            </p>
            <h2 className="text-4xl font-display font-bold text-foreground">
              Featured workers
            </h2>
          </div>
          <Button variant="outline" asChild className="hidden sm:flex">
            <Link href="/workers">
              View all <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {workers.map((worker, i) => (
            <motion.div
              key={worker.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.4 }}
            >
              <Link href={`/workers/${worker.id}`} className="group block card-premium p-5">
                {/* Header */}
                <div className="flex items-start gap-3 mb-4">
                  <Avatar className="w-12 h-12 ring-2 ring-border group-hover:ring-primary/30 transition-all">
                    <AvatarImage
                      src={worker.profile_image_url ?? worker.user?.avatar_url ?? ""}
                      alt={worker.user?.full_name}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                      {worker.user?.full_name?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {worker.user?.full_name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{worker.title}</p>
                  </div>
                </div>

                {/* Category + District */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {worker.category && (
                    <Badge variant="secondary" className="text-xs font-medium">
                      {worker.category.name}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs text-muted-foreground gap-1">
                    <MapPin className="w-3 h-3" />
                    {worker.district}
                  </Badge>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1.5 mb-3">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-sm font-semibold">
                    {Number(worker.avg_rating).toFixed(1)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({worker.total_reviews} reviews)
                  </span>
                </div>

                {/* Experience + Price */}
                <div className="flex items-center justify-between pt-3 border-t border-border/40">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Briefcase className="w-3.5 h-3.5" />
                    {worker.experience_years}y exp
                  </div>
                  {worker.starting_price && (
                    <p className="text-sm font-semibold text-foreground">
                      From{" "}
                      <span className="text-primary">
                        LKR {Number(worker.starting_price).toLocaleString()}
                      </span>
                    </p>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-8 sm:hidden">
          <Button variant="outline" asChild>
            <Link href="/workers">View all workers <ArrowRight className="w-4 h-4 ml-1.5" /></Link>
          </Button>
        </div>
      </div>
    </section>
  );
}