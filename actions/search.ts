"use server";

import { createClient }      from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import type { WorkerProfileWithDetails } from "@/types/database";

// ============================================
// SEARCH PARAMS
// ============================================
export interface SearchParams {
  q?:           string;
  category?:    string;   // slug
  district?:    string;
  availability?: string;
  min_price?:   number;
  max_price?:   number;
  min_rating?:  number;
  sort?:        "rating" | "price_asc" | "price_desc" | "newest";
  page?:        number;
}

export interface SearchResult {
  workers:    WorkerProfileWithDetails[];
  total:      number;
  page:       number;
  totalPages: number;
  hasNext:    boolean;
  hasPrev:    boolean;
}

const PAGE_SIZE = 12;

// ============================================
// SEARCH WORKERS
// Uses PostgreSQL full-text search + filters
// ============================================
export async function searchWorkersAction(
  params: SearchParams
): Promise<SearchResult> {
  const supabase = await createClient();

  const page    = Math.max(1, params.page ?? 1);
  const offset  = (page - 1) * PAGE_SIZE;

  // Start query
  let query = supabase
    .from("worker_profiles")
    .select(
      `
      id, title, description, district, avg_rating,
      total_reviews, starting_price, profile_image_url,
      experience_years, availability, is_verified,
      created_at,
      user:users!worker_profiles_user_id_fkey(
        id, full_name, avatar_url
      ),
      category:categories!worker_profiles_category_id_fkey(
        id, name, slug, icon
      ),
      portfolio:worker_portfolio(
        id, image_url, caption, sort_order
      )
    `,
      { count: "exact" }
    )
    .eq("is_active", true);

  // Full-text search
  if (params.q && params.q.trim() !== "") {
    const searchTerm = params.q.trim();
    // Use textSearch for full-text + ilike for partial match fallback
    query = query.or(
      `search_vector.fts.${searchTerm},title.ilike.%${searchTerm}%,district.ilike.%${searchTerm}%`
    );
  }

  // Category filter (by slug — join through category)
  if (params.category) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", params.category)
      .single();

    if (cat) {
      query = query.eq("category_id", cat.id);
    }
  }

  // District filter
  if (params.district) {
    query = query.ilike("district", params.district);
  }

  // Availability filter
  if (
    params.availability &&
    ["available", "busy", "unavailable"].includes(params.availability)
  ) {
    query = query.eq("availability", params.availability);
  }

  // Price filters
  if (params.min_price !== undefined && params.min_price > 0) {
    query = query.gte("starting_price", params.min_price);
  }
  if (params.max_price !== undefined && params.max_price > 0) {
    query = query.lte("starting_price", params.max_price);
  }

  // Rating filter
  if (params.min_rating !== undefined && params.min_rating > 0) {
    query = query.gte("avg_rating", params.min_rating);
  }

  // Sorting
  switch (params.sort) {
    case "price_asc":
      query = query
        .not("starting_price", "is", null)
        .order("starting_price", { ascending: true });
      break;
    case "price_desc":
      query = query
        .not("starting_price", "is", null)
        .order("starting_price", { ascending: false });
      break;
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    case "rating":
    default:
      query = query
        .order("avg_rating",    { ascending: false })
        .order("total_reviews", { ascending: false });
      break;
  }

  // Pagination
  query = query.range(offset, offset + PAGE_SIZE - 1);

  const { data, count, error } = await query;

  if (error) {
    console.error("[Search] Query error:", error);
    return {
      workers: [], total: 0, page, totalPages: 0,
      hasNext: false, hasPrev: false,
    };
  }

  const total      = count ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return {
    workers:    (data ?? []) as unknown as WorkerProfileWithDetails[],
    total,
    page,
    totalPages,
    hasNext:  page < totalPages,
    hasPrev:  page > 1,
  };
}

// ============================================
// GET SINGLE WORKER PROFILE (for detail page)
// ============================================
export async function getWorkerProfileAction(
  workerId: string
): Promise<WorkerProfileWithDetails | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("worker_profiles")
    .select(
      `
      id, title, description, district, avg_rating,
      total_reviews, starting_price, profile_image_url,
      experience_years, availability, is_verified,
      total_jobs, created_at,
      user:users!worker_profiles_user_id_fkey(
        id, full_name, avatar_url
      ),
      category:categories!worker_profiles_category_id_fkey(
        id, name, slug, icon
      ),
      portfolio:worker_portfolio(
        id, image_url, caption, sort_order
      )
    `
    )
    .eq("id",        workerId)
    .eq("is_active", true)
    .order("sort_order", {
      referencedTable: "worker_portfolio",
      ascending:        true,
    })
    .single();

  if (error || !data) return null;
  return data as unknown as WorkerProfileWithDetails;
}

// ============================================
// GET WORKER REVIEWS
// ============================================
export interface ReviewWithHirer {
  id:         string;
  rating:     number;
  comment:    string | null;
  created_at: string;
  hirer: {
    id:        string;
    full_name: string;
    avatar_url: string | null;
  };
}

export async function getWorkerReviewsAction(
  workerId:  string,
  page = 1
): Promise<{ reviews: ReviewWithHirer[]; total: number }> {
  const supabase = await createClient();
  const pageSize = 10;
  const offset   = (page - 1) * pageSize;

  const { data, count, error } = await supabase
    .from("reviews")
    .select(
      `
      id, rating, comment, created_at,
      hirer:users!reviews_hirer_id_fkey(
        id, full_name, avatar_url
      )
    `,
      { count: "exact" }
    )
    .eq("worker_id",  workerId)
    .eq("is_flagged", false)
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) return { reviews: [], total: 0 };

  return {
    reviews: (data ?? []) as unknown as ReviewWithHirer[],
    total:   count ?? 0,
  };
}

// ============================================
// GET ALL CATEGORIES (for filter sidebar)
// ============================================
export async function getCategoriesAction() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id, name, slug, icon")
    .eq("is_active", true)
    .order("sort_order");
  return data ?? [];
}