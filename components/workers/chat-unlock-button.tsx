"use client";

import { useTransition }   from "react";
import { useRouter }       from "next/navigation";
import {
  MessageCircle, Lock,
  Loader2, LogIn,
} from "lucide-react";
import { toast }   from "sonner";
import { Button }  from "@/components/ui/button";
import { initiateChatPaymentAction } from "@/actions/payment";
import { PAYHERE_CONFIG }  from "@/lib/payhere";
import type { AuthUser }   from "@/types/actions";

interface ChatUnlockButtonProps {
  workerId:      string;   // worker_profile.id
  workerName:    string;
  workerUserId:  string;   // users.id of the worker
  currentUser:   AuthUser | null;
}

export function ChatUnlockButton({
  workerId, workerName, workerUserId, currentUser,
}: ChatUnlockButtonProps) {
  const router   = useRouter();
  const [isPending, startTransition] = useTransition();

  // ── Not logged in ──────────────────────────
  if (!currentUser) {
    return (
      <div className="space-y-3">
        <Button className="w-full" size="lg" asChild>
          <a href={`/login?redirect=/workers/${workerId}`}>
            <LogIn className="w-4 h-4 mr-2" />
            Sign in to contact
          </a>
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          Create a free account to hire workers
        </p>
      </div>
    );
  }

  // ── Worker viewing another worker ──────────
  if (currentUser.role === "worker") {
    return (
      <div className="bg-secondary/60 rounded-xl p-4 text-center">
        <p className="text-sm text-muted-foreground">
          Switch to a hirer account to contact workers.
        </p>
      </div>
    );
  }

  // ── Hirer — submit real PayHere form ───────
  function handleUnlock() {
    startTransition(async () => {
      const result = await initiateChatPaymentAction(workerId);

      if (!result.success) {
        // Already unlocked — go to chats
        if (result.error === "Chat already unlocked.") {
          toast.info("Chat already unlocked! Going to messages…");
          router.push("/dashboard/chats");
          return;
        }
        toast.error(result.error);
        return;
      }

      const { fields, checkoutUrl } = result.data!;

      // Submit hidden form to PayHere
      const form         = document.createElement("form");
      form.method        = "POST";
      form.action        = checkoutUrl;
      form.style.display = "none";

      Object.entries(fields).forEach(([key, value]) => {
        const input   = document.createElement("input");
        input.type    = "hidden";
        input.name    = key;
        input.value   = String(value);
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    });
  }

  return (
    <div className="space-y-3">
      <Button
        onClick={handleUnlock}
        disabled={isPending}
        className="w-full"
        size="lg"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Preparing payment…
          </>
        ) : (
          <>
            <MessageCircle className="w-4 h-4 mr-2" />
            Contact {workerName.split(" ")[0]}
          </>
        )}
      </Button>

      <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="w-3 h-3" />
        Unlock chat for LKR 1,000 via PayHere
      </div>

      {/* Sandbox test card hint */}
      {process.env.NEXT_PUBLIC_PAYHERE_MODE === "sandbox" && (
        <p className="text-xs text-center text-amber-600 bg-amber-50 border border-amber-100 rounded-lg py-2 px-3">
          🧪 Test card: 4916217501611292 · CVV: 100
        </p>
      )}
    </div>
  );
}