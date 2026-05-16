"use client";

import Link   from "next/link";
import { motion } from "framer-motion";
import { XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentCancelledPage() {
  return (
    <div className="min-h-screen bg-secondary/30 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border/60 rounded-2xl shadow-soft-md p-12 text-center max-w-md w-full"
      >
        <XCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-display font-bold mb-2">
          Payment cancelled
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Your payment was cancelled. No charges were made.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Link>
          </Button>
          <Button asChild>
            <Link href="/payment/worker">
              Try again
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}