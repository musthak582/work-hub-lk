"use client";

import { useState, useTransition, useRef, useCallback } from "react";
import { useRouter }   from "next/navigation";
import { useForm }     from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Briefcase, MapPin, Image as ImageIcon,
  ChevronRight, ChevronLeft, Loader2, Upload,
  X, Plus, CheckCircle2,
} from "lucide-react";
import { toast }   from "sonner";
import { Button }  from "@/components/ui/button";
import { Input }   from "@/components/ui/input";
import { Label }   from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { createWorkerProfileAction } from "@/actions/worker";
import { workerProfileSchema, type WorkerProfileInput, SRI_LANKA_DISTRICTS } from "@/schemas/worker";
import type { Category } from "@/types/database";

interface ProfileCreateFormProps {
  categories: Pick<Category, "id" | "name" | "slug">[];
  userId: string;
}

const STEPS = [
  { id: 1, label: "Basic info",   icon: User      },
  { id: 2, label: "Details",      icon: Briefcase  },
  { id: 3, label: "Location",     icon: MapPin     },
  { id: 4, label: "Photos",       icon: ImageIcon  },
];

const AVAILABILITY_OPTIONS = [
  { value: "available",   label: "Available now",    color: "text-green-600"  },
  { value: "busy",        label: "Busy — limited",   color: "text-amber-600"  },
  { value: "unavailable", label: "Not available",    color: "text-red-600"    },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((step, i) => {
        const Icon    = step.icon;
        const done    = current > step.id;
        const active  = current === step.id;
        return (
          <div key={step.id} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
              done   ? "bg-primary text-white" :
              active ? "bg-primary/15 text-primary border border-primary/30" :
                       "bg-secondary text-muted-foreground"
            }`}>
              {done
                ? <CheckCircle2 className="w-3.5 h-3.5" />
                : <Icon className="w-3.5 h-3.5" />
              }
              <span className="hidden sm:inline">{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-6 h-px ${done ? "bg-primary" : "bg-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ImageUploadBox({
  label, preview, onSelect, onRemove, aspectRatio = "square",
}: {
  label:        string;
  preview:      string | null;
  onSelect:     (dataUrl: string) => void;
  onRemove:     () => void;
  aspectRatio?: "square" | "landscape";
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") onSelect(reader.result);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div
      className={`relative border-2 border-dashed border-border rounded-xl overflow-hidden cursor-pointer group hover:border-primary/50 transition-colors ${
        aspectRatio === "square" ? "aspect-square" : "aspect-video"
      }`}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFile}
      />

      {preview ? (
        <>
          <img src={preview} alt={label} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <p className="text-white text-xs font-medium">Change photo</p>
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="absolute top-2 right-2 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
          <Upload className="w-6 h-6" />
          <p className="text-xs text-center px-2">{label}</p>
        </div>
      )}
    </div>
  );
}

export function ProfileCreateForm({ categories, userId }: ProfileCreateFormProps) {
  const [step, setStep]               = useState(1);
  const [isPending, startTransition]  = useTransition();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [portfolioImages, setPortfolioImages] = useState<(string | null)[]>(
    Array(4).fill(null)
  );
  const router = useRouter();

  const form = useForm<WorkerProfileInput>({
    resolver: zodResolver(workerProfileSchema),
    defaultValues: {
      title:            "",
      category_id:      "",
      description:      "",
      experience_years: 0,
      district:         undefined,
      starting_price:   null,
      availability:     "available",
    },
  });

  function nextStep() {
    // Validate current step fields before advancing
    const stepFields: Record<number, (keyof WorkerProfileInput)[]> = {
      1: ["title", "category_id"],
      2: ["description", "experience_years", "availability"],
      3: ["district"],
    };

    const fields = stepFields[step];
    if (fields) {
      form.trigger(fields).then((valid) => {
        if (valid) setStep((s) => Math.min(s + 1, 4));
      });
    } else {
      setStep((s) => Math.min(s + 1, 4));
    }
  }

  function prevStep() {
    setStep((s) => Math.max(s - 1, 1));
  }

  function handleSubmit() {
    form.handleSubmit((values) => {
      startTransition(async () => {
        const fd = new FormData();

        // Append all form values
        Object.entries(values).forEach(([k, v]) => {
          if (v !== null && v !== undefined) fd.append(k, String(v));
        });

        // Append images as base64
        if (profileImage) {
          fd.append("profile_image_base64", profileImage);
        }

        portfolioImages.forEach((img, i) => {
          if (img) fd.append(`portfolio_image_${i}`, img);
        });

        const result = await createWorkerProfileAction(fd);

        if (!result.success) {
          toast.error(result.error);
          return;
        }

        toast.success(result.message ?? "Profile created!");
        router.push("/dashboard");
      });
    })();
  }

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 40 : -40, opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit:   (dir: number) => ({
      x: dir > 0 ? -40 : 40, opacity: 0,
    }),
  };

  const [direction, setDirection] = useState(1);

  function goNext() { setDirection(1); nextStep(); }
  function goPrev() { setDirection(-1); prevStep(); }

  return (
    <div className="bg-card border border-border/60 rounded-2xl shadow-soft-md p-8">
      <StepIndicator current={step} />

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.25, ease: "easeInOut" }}
        >
          {/* STEP 1: Basic info */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-display font-bold text-foreground mb-1">
                  What's your professional title?
                </h2>
                <p className="text-sm text-muted-foreground">
                  This is the first thing hirers see.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="title">Professional title</Label>
                <Input
                  id="title"
                  placeholder="e.g. Certified Electrician with 8 years experience"
                  {...form.register("title")}
                  className={form.formState.errors.title ? "border-destructive" : ""}
                />
                {form.formState.errors.title && (
                  <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="category_id">Service category</Label>
                <Select
                  value={form.watch("category_id")}
                  onValueChange={(v) => form.setValue("category_id", v, { shouldValidate: true })}
                >
                  <SelectTrigger className={form.formState.errors.category_id ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select your main service" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.category_id && (
                  <p className="text-xs text-destructive">{form.formState.errors.category_id.message}</p>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Details */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-display font-bold text-foreground mb-1">
                  Tell us about your work
                </h2>
                <p className="text-sm text-muted-foreground">
                  A great description wins more jobs.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <Label htmlFor="description">About your service</Label>
                  <span className="text-xs text-muted-foreground">
                    {form.watch("description")?.length ?? 0}/2000
                  </span>
                </div>
                <Textarea
                  id="description"
                  rows={5}
                  placeholder="Describe your skills, experience, what makes you different, what jobs you take on…"
                  {...form.register("description")}
                  className={form.formState.errors.description ? "border-destructive" : ""}
                />
                {form.formState.errors.description && (
                  <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="experience_years">Years of experience</Label>
                  <Input
                    id="experience_years"
                    type="number"
                    min={0}
                    max={60}
                    placeholder="5"
                    {...form.register("experience_years", { valueAsNumber: true })}
                    className={form.formState.errors.experience_years ? "border-destructive" : ""}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="starting_price">Starting price (LKR) <span className="text-muted-foreground font-normal">optional</span></Label>
                  <Input
                    id="starting_price"
                    type="number"
                    min={0}
                    placeholder="2500"
                    {...form.register("starting_price", { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Availability</Label>
                <div className="grid grid-cols-3 gap-2">
                  {AVAILABILITY_OPTIONS.map((opt) => {
                    const isActive = form.watch("availability") === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => form.setValue("availability", opt.value as "available" | "busy" | "unavailable")}
                        className={`py-2.5 px-3 rounded-xl text-xs font-medium border-2 transition-all duration-150 ${
                          isActive
                            ? "border-primary bg-primary/8 text-primary"
                            : "border-border bg-background text-muted-foreground hover:border-border/80"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Location */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-display font-bold text-foreground mb-1">
                  Where do you work?
                </h2>
                <p className="text-sm text-muted-foreground">
                  Hirers search by district to find local workers.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label>District</Label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-64 overflow-y-auto pr-1">
                  {SRI_LANKA_DISTRICTS.map((d) => {
                    const isActive = form.watch("district") === d;
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => form.setValue("district", d, { shouldValidate: true })}
                        className={`py-2 px-2.5 rounded-lg text-xs font-medium border transition-all duration-150 ${
                          isActive
                            ? "border-primary bg-primary text-white shadow-soft"
                            : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                        }`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
                {form.formState.errors.district && (
                  <p className="text-xs text-destructive">{form.formState.errors.district.message}</p>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: Photos */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-display font-bold text-foreground mb-1">
                  Add your photos
                </h2>
                <p className="text-sm text-muted-foreground">
                  Profiles with photos get 3× more enquiries. Max 5MB each.
                </p>
              </div>

              {/* Profile photo */}
              <div>
                <Label className="mb-2 block">Profile photo</Label>
                <div className="w-32">
                  <ImageUploadBox
                    label="Upload photo"
                    preview={profileImage}
                    onSelect={setProfileImage}
                    onRemove={() => setProfileImage(null)}
                    aspectRatio="square"
                  />
                </div>
              </div>

              {/* Portfolio */}
              <div>
                <Label className="mb-2 block">
                  Portfolio images{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional, up to 4)
                  </span>
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {portfolioImages.map((img, i) => (
                    <ImageUploadBox
                      key={i}
                      label={`Portfolio ${i + 1}`}
                      preview={img}
                      onSelect={(url) => {
                        const next = [...portfolioImages];
                        next[i] = url;
                        setPortfolioImages(next);
                      }}
                      onRemove={() => {
                        const next = [...portfolioImages];
                        next[i] = null;
                        setPortfolioImages(next);
                      }}
                      aspectRatio="landscape"
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-border/40">
        <Button
          type="button"
          variant="outline"
          onClick={goPrev}
          disabled={step === 1 || isPending}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>

        <span className="text-xs text-muted-foreground">
          Step {step} of {STEPS.length}
        </span>

        {step < 4 ? (
          <Button type="button" onClick={goNext} disabled={isPending}>
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="min-w-32"
          >
            {isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating…</>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Go live!
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}