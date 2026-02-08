import { Link, useLocation } from "wouter";
import { Briefcase, Award, ClipboardList, BookOpen, Home, Menu, X, Building2, GraduationCap, Bell } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PushNotificationButton } from "./PushNotificationButton";
import { usePortal } from "@/hooks/use-portal";
import { useQuery } from "@tanstack/react-query";

export function JobAlertsHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const [currentUrl, setCurrentUrl] = useState("");
  const { isDedicatedDomain, jobBasePath } = usePortal();
  const base = jobBasePath;
  const homeHref = isDedicatedDomain ? "/" : "/job-alerts";

  const { data: settings } = useQuery<Record<string, any>>({
    queryKey: ["/api/settings"],
  });

  const portalName = settings?.jobPortalName || "Rojgar Hub";
  const portalTagline = settings?.jobPortalTagline || "Jobs & Career Portal";

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").then(
        (registration) => {
          console.log("SW registered:", registration.scope);
        },
        (error) => {
          console.log("SW registration failed:", error);
        }
      );
    }
  }, []);

  useEffect(() => {
    const checkUrl = () => {
      const fullUrl = window.location.pathname + window.location.search;
      if (fullUrl !== currentUrl) {
        setCurrentUrl(fullUrl);
      }
    };
    checkUrl();
    const interval = setInterval(checkUrl, 100);
    return () => clearInterval(interval);
  }, [currentUrl]);

  const mainNavItems = [
    { label: "All Jobs", href: base, icon: Home },
    { label: "Govt Jobs", href: `${base}?jobType=GOVERNMENT`, icon: Building2 },
    { label: "Private Jobs", href: `${base}?jobType=PRIVATE`, icon: Briefcase },
    { label: "Test Series", href: `${base}/test-series`, icon: GraduationCap },
  ];

  const categoryItems = [
    { label: "Latest Jobs", href: `${base}?category=LATEST_JOB`, icon: Briefcase },
    { label: "Results", href: `${base}?category=RESULT`, icon: Award },
    { label: "Admit Card", href: `${base}?category=ADMIT_CARD`, icon: ClipboardList },
    { label: "Answer Key", href: `${base}?category=ANSWER_KEY`, icon: BookOpen },
  ];

  const isActive = (href: string) => {
    if ((href === base || href === "/job-alerts") && (currentUrl === base || currentUrl === "/job-alerts")) return true;
    if (href !== base && href !== "/job-alerts" && currentUrl.includes(href.split("?")[1] || href)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-gradient-to-r from-orange-600 via-red-600 to-red-700 text-white shadow-lg">
      <div className="bg-orange-800/50 py-1 text-center text-xs px-4">
        <span className="flex items-center justify-center gap-1.5 flex-wrap">
          <Bell className="w-3 h-3" />
          <span className="truncate">Your trusted source for Government Job Updates, Results & Admit Cards</span>
          <span className="text-white/50 hidden sm:inline">|</span>
          <a href="https://examinationportal.com" target="_blank" rel="noopener noreferrer" className="hidden sm:inline text-yellow-300 hover:text-yellow-200 underline underline-offset-2" data-testid="link-exam-portal-top">
            Apply for Exams
          </a>
        </span>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 h-14 md:h-16 flex items-center justify-between">
        <Link href={homeHref} className="flex items-center gap-2 group">
          <div className="bg-white/20 p-1.5 md:p-2 rounded-lg group-hover:bg-white/30 transition-colors">
            <Briefcase className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base md:text-lg leading-tight" data-testid="text-portal-name">{portalName}</span>
            <span className="text-[10px] text-white/70 leading-tight hidden sm:block">{portalTagline}</span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {mainNavItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                size="sm"
                className={`text-white/90 hover:text-white hover:bg-white/10 ${
                  isActive(item.href) ? "bg-white/20" : ""
                }`}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <item.icon className="w-4 h-4 mr-1" />
                {item.label}
              </Button>
            </Link>
          ))}
          <span className="text-white/30 mx-1">|</span>
          {categoryItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                size="sm"
                className={`text-white/90 hover:text-white hover:bg-white/10 ${
                  isActive(item.href) ? "bg-white/20" : ""
                }`}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <item.icon className="w-4 h-4 mr-1" />
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <PushNotificationButton />
          
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            data-testid="button-mobile-menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="lg:hidden bg-red-800 border-t border-red-600/50">
          <div className="max-w-7xl mx-auto px-4 py-3 space-y-1">
            <p className="text-xs text-white/50 uppercase font-semibold px-3 pb-1">Browse</p>
            {mainNavItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <button
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive(item.href) ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  data-testid={`mobile-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              </Link>
            ))}
            <div className="border-t border-red-600/50 my-2" />
            <p className="text-xs text-white/50 uppercase font-semibold px-3 pb-1">Categories</p>
            {categoryItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <button
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive(item.href) ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  data-testid={`mobile-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
