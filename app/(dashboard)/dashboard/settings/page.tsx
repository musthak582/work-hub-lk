"use client";

import { useState, useTransition } from "react";
import { useRouter }    from "next/navigation";
import { useForm }      from "react-hook-form";
import { zodResolver }  from "@hookform/resolvers/zod";
import { motion }       from "framer-motion";
import { Loader2, Save, Shield, Bell, Palette } from "lucide-react";
import { toast } from "sonner";
import { z }      from "zod";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";

const settingsSchema = z.object({
  full_name: z.string().min(2).max(100),
});

type SettingsInput = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const [isPending, startTransition] = useTransition();
  const supabase = createClient();

  // We don't have the user here (this is a client component)
  // So we fetch it
  const [user, setUser] = useState<any>(null);

  useState(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase
          .from("users")
          .select("*")
          .eq("auth_id", data.user.id)
          .single()
          .then(({ data: u }) => setUser(u));
      }
    });
  });

  const form = useForm<SettingsInput>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { full_name: user?.full_name ?? "" },
  });

  function onSave(values: SettingsInput) {
    startTransition(async () => {
      const { error } = await supabase
        .from("users")
        .update({ full_name: values.full_name })
        .eq("id", user.id);

      if (error) {
        toast.error("Failed to save settings");
        return;
      }
      toast.success("Settings saved!");
    });
  }

  return (
    <div className="max-w-lg space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground mb-1">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your account preferences.
        </p>
      </div>

      {/* Account */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border/60 rounded-xl shadow-card p-6 space-y-4"
      >
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Account</h2>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="full_name">Full name</Label>
          <Input
            id="full_name"
            placeholder="Your full name"
            defaultValue={user?.full_name ?? ""}
            {...form.register("full_name")}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Email address</Label>
          <Input value={user?.email ?? ""} disabled className="bg-secondary" />
          <p className="text-xs text-muted-foreground">
            Email cannot be changed. Contact support if needed.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label>Phone number</Label>
          <div className="flex items-center gap-2">
            <Input value={user?.phone ?? ""} disabled className="bg-secondary flex-1" />
            <span className="text-xs text-green-600 font-medium bg-green-50 border border-green-200 px-2.5 py-1.5 rounded-lg">
              Verified ✓
            </span>
          </div>
        </div>

        <Button
          onClick={form.handleSubmit(onSave)}
          disabled={isPending}
          size="sm"
        >
          {isPending
            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</>
            : <><Save className="w-4 h-4 mr-2" />Save changes</>
          }
        </Button>
      </motion.div>

      {/* Danger zone */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-destructive/20 rounded-xl p-6"
      >
        <h2 className="text-sm font-semibold text-destructive mb-2">
          Danger zone
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          Once you delete your account, there is no going back.
        </p>
        <Button variant="destructive" size="sm" disabled>
          Delete account
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          Contact support to delete your account.
        </p>
      </motion.div>
    </div>
  );
}