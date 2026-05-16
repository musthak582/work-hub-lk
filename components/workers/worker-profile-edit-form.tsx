"use client";

import { useState, useTransition } from "react";
import { useForm }     from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Save, ExternalLink } from "lucide-react";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Label }    from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { updateWorkerProfileAction } from "@/actions/worker";
import { workerProfileSchema, type WorkerProfileInput, SRI_LANKA_DISTRICTS } from "@/schemas/worker";
import { ImageUploadBox } from "@/components/shared/image-upload-box";
import Link from "next/link";

interface WorkerProfileEditFormProps {
  profile:    any;
  categories: { id: string; name: string; slug: string }[];
}

export function WorkerProfileEditForm({ profile, categories }: WorkerProfileEditFormProps) {
  const [isPending, startTransition] = useTransition();
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const form = useForm<WorkerProfileInput>({
    resolver: zodResolver(workerProfileSchema),
    defaultValues: {
      title:            profile.title,
      category_id:      profile.category_id,
      description:      profile.description,
      experience_years: profile.experience_years,
      district:         profile.district,
      starting_price:   profile.starting_price ?? null,
      availability:     profile.availability,
      profile_image_url: profile.profile_image_url ?? null,
    },
  });

  function onSubmit(values: WorkerProfileInput) {
    startTransition(async () => {
      const fd = new FormData();
      Object.entries(values).forEach(([k, v]) => {
        if (v !== null && v !== undefined) fd.append(k, String(v));
      });
      if (profileImage) fd.append("profile_image_base64", profileImage);

      const result = await updateWorkerProfileAction(profile.id, fd);

      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message ?? "Profile updated!");
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Profile image */}
      <div className="bg-card border border-border/60 rounded-xl p-5 shadow-card">
        <Label className="mb-3 block">Profile photo</Label>
        <div className="flex items-center gap-5">
          <div className="w-24">
            <ImageUploadBox
              label="Change photo"
              preview={profileImage ?? profile.profile_image_url}
              onSelect={setProfileImage}
              onRemove={() => setProfileImage(null)}
              aspectRatio="square"
            />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground mb-0.5">
              Profile photo
            </p>
            <p className="text-xs text-muted-foreground">
              JPG, PNG or WebP. Max 5MB.
            </p>
          </div>
        </div>
      </div>

      {/* Basic info */}
      <div className="bg-card border border-border/60 rounded-xl p-5 shadow-card space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Basic information</h3>

        <div className="space-y-1.5">
          <Label htmlFor="title">Professional title</Label>
          <Input id="title" {...form.register("title")} />
          {form.formState.errors.title && (
            <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="category_id">Category</Label>
          <Select
            value={form.watch("category_id")}
            onValueChange={(v) => form.setValue("category_id", v)}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            rows={5}
            {...form.register("description")}
          />
          {form.formState.errors.description && (
            <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="bg-card border border-border/60 rounded-xl p-5 shadow-card space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Details</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="experience_years">Years of experience</Label>
            <Input
              id="experience_years"
              type="number"
              min={0}
              {...form.register("experience_years", { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="starting_price">Starting price (LKR)</Label>
            <Input
              id="starting_price"
              type="number"
              min={0}
              placeholder="Optional"
              {...form.register("starting_price", { valueAsNumber: true })}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>District</Label>
          <Select
            value={form.watch("district")}
            onValueChange={(v) => form.setValue("district", v as any)}
          >
            <SelectTrigger><SelectValue placeholder="Select district" /></SelectTrigger>
            <SelectContent>
              {SRI_LANKA_DISTRICTS.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Availability</Label>
          <Select
            value={form.watch("availability")}
            onValueChange={(v) => form.setValue("availability", v as any)}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Available now</SelectItem>
              <SelectItem value="busy">Busy — limited availability</SelectItem>
              <SelectItem value="unavailable">Not available</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</>
            : <><Save className="w-4 h-4 mr-2" />Save changes</>
          }
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/workers/${profile.id}`} target="_blank">
            <ExternalLink className="w-4 h-4 mr-2" />
            View public profile
          </Link>
        </Button>
      </div>
    </form>
  );
}