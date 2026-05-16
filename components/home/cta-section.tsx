"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Briefcase, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl bg-foreground px-8 py-16 sm:px-16 text-center"
        >
          {/* Subtle background pattern */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 50%, hsl(var(--primary)) 0%, transparent 50%), radial-gradient(circle at 80% 50%, hsl(199 89% 38%) 0%, transparent 50%)",
            }}
          />

          <div className="relative z-10">
            <h2 className="text-4xl sm:text-5xl font-display font-bold text-background mb-4">
              Ready to get started?
            </h2>
            <p className="text-background/60 text-lg max-w-xl mx-auto mb-10">
              Join thousands of Sri Lankans already using WorkHub LK to find work
              or hire skilled professionals.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                asChild
                className="bg-primary hover:bg-primary/90 text-white shadow-soft-lg rounded-xl px-8"
              >
                <Link href="/register?role=hirer">
                  <Search className="w-4 h-4 mr-2" />
                  Hire a worker
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="bg-background/10 border-background/20 text-background hover:bg-background/20 rounded-xl px-8"
              >
                <Link href="/register?role=worker">
                  <Briefcase className="w-4 h-4 mr-2" />
                  Become a worker
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}