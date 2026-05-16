import Link from "next/link";
import { Zap } from "lucide-react";

const FOOTER_LINKS = {
  Platform: [
    { label: "Find Workers",  href: "/workers" },
    { label: "How it Works", href: "/#how-it-works" },
    { label: "Categories",   href: "/#categories" },
    { label: "Become a Worker", href: "/register" },
  ],
  Support: [
    { label: "Help Center",    href: "/help" },
    { label: "Contact Us",     href: "/contact" },
    { label: "Safety Tips",    href: "/safety" },
    { label: "Report an Issue", href: "/report" },
  ],
  Legal: [
    { label: "Privacy Policy",    href: "/privacy" },
    { label: "Terms of Service",  href: "/terms" },
    { label: "Cookie Policy",     href: "/cookies" },
    { label: "Refund Policy",     href: "/refunds" },
  ],
};

const DISTRICTS = [
  "Colombo", "Gampaha", "Kandy", "Galle",
  "Matara", "Kurunegala", "Ratnapura", "Anuradhapura",
];

export function Footer() {
  return (
    <footer className="bg-foreground text-background mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer */}
        <div className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-semibold text-lg text-background">
                Work<span className="text-primary">Hub</span>
                <span className="opacity-60 text-sm font-normal ml-0.5">LK</span>
              </span>
            </Link>
            <p className="text-sm text-background/60 leading-relaxed max-w-xs">
              Sri Lanka's trusted marketplace for local skilled workers.
              Connect with verified professionals across all districts.
            </p>
            <div className="mt-6">
              <p className="text-xs text-background/40 font-medium uppercase tracking-wider mb-3">
                Popular Districts
              </p>
              <div className="flex flex-wrap gap-2">
                {DISTRICTS.map((d) => (
                  <Link
                    key={d}
                    href={`/workers?district=${d}`}
                    className="text-xs px-2.5 py-1 rounded-full bg-background/10 text-background/70 hover:bg-background/20 hover:text-background transition-colors"
                  >
                    {d}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section}>
              <p className="text-xs font-semibold text-background/40 uppercase tracking-wider mb-4">
                {section}
              </p>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-background/60 hover:text-background transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-background/10 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-background/40">
            © {new Date().getFullYear()} WorkHub LK. All rights reserved.
          </p>
          <p className="text-xs text-background/40">
            Built for Sri Lanka 🇱🇰 · Payments via PayHere · SMS via Twilio
          </p>
        </div>
      </div>
    </footer>
  );
} 