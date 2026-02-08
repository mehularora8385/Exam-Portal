import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { usePageTracking } from "@/hooks/use-page-tracking";
import { motion, AnimatePresence } from "framer-motion";
import { JobAlertsHeader } from "@/components/JobAlertsHeader";
import { JobAlertsFooter } from "@/components/JobAlertsFooter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, Calendar, Building2, Users, ExternalLink, FileText, 
  Download, Clock, Flame, Star, ChevronRight, Briefcase,
  GraduationCap, Award, ClipboardList, Bell, BookOpen, TrendingUp,
  Eye, MapPin, Zap, ArrowRight, Timer, AlertCircle, Sparkles
} from "lucide-react";
import { AdBanner, InFeedAd, SponsoredJobAd } from "@/components/AdBanner";
import { JobAlertSubscribe } from "@/components/JobAlertSubscribe";
import { format, parseISO, isValid, differenceInDays, differenceInHours } from "date-fns";

function safeFormatDate(dateValue: any, formatStr: string = "dd MMM yyyy"): string {
  if (!dateValue) return "-";
  try {
    const date = typeof dateValue === "string" ? parseISO(dateValue) : new Date(dateValue);
    return isValid(date) ? format(date, formatStr) : "-";
  } catch {
    return "-";
  }
}

function getDeadlineInfo(endDate: any, startDate?: any): { text: string; urgent: boolean; expired: boolean; upcoming: boolean } {
  if (!endDate) return { text: "", urgent: false, expired: false, upcoming: false };
  try {
    const end = typeof endDate === "string" ? parseISO(endDate) : new Date(endDate);
    if (!isValid(end)) return { text: "", urgent: false, expired: false, upcoming: false };
    
    const now = new Date();
    const daysLeft = differenceInDays(end, now);
    const hoursLeft = differenceInHours(end, now);
    
    // Check if end date has passed (expired)
    if (daysLeft < 0) return { text: "Closed", urgent: false, expired: true, upcoming: false };
    
    // Check if start date is in the future (upcoming)
    if (startDate) {
      const start = typeof startDate === "string" ? parseISO(startDate) : new Date(startDate);
      if (isValid(start)) {
        const daysUntilStart = differenceInDays(start, now);
        if (daysUntilStart > 0) {
          return { 
            text: `Opens in ${daysUntilStart} day${daysUntilStart === 1 ? '' : 's'}`, 
            urgent: false, 
            expired: false, 
            upcoming: true 
          };
        }
      }
    }
    
    // Application is currently live
    if (daysLeft === 0) return { text: `${Math.max(0, hoursLeft)}h left!`, urgent: true, expired: false, upcoming: false };
    if (daysLeft <= 3) return { text: `${daysLeft} days left!`, urgent: true, expired: false, upcoming: false };
    if (daysLeft <= 7) return { text: `${daysLeft} days left`, urgent: false, expired: false, upcoming: false };
    return { text: `${daysLeft} days left`, urgent: false, expired: false, upcoming: false };
  } catch {
    return { text: "", urgent: false, expired: false, upcoming: false };
  }
}

const CATEGORIES = [
  { id: "ALL", label: "All Updates", icon: Bell, color: "bg-slate-500" },
  { id: "LATEST_JOB", label: "Latest Jobs", icon: Briefcase, color: "bg-green-500" },
  { id: "RESULT", label: "Results", icon: Award, color: "bg-blue-500" },
  { id: "ADMIT_CARD", label: "Admit Card", icon: ClipboardList, color: "bg-orange-500" },
  { id: "ANSWER_KEY", label: "Answer Key", icon: BookOpen, color: "bg-purple-500" },
  { id: "SYLLABUS", label: "Syllabus", icon: GraduationCap, color: "bg-cyan-500" },
  { id: "ADMISSION", label: "Admission", icon: GraduationCap, color: "bg-pink-500" },
  { id: "IMPORTANT", label: "Important", icon: Star, color: "bg-red-500" },
];

const STATES = [
  "All India", "Andhra Pradesh", "Bihar", "Delhi", "Gujarat", "Haryana", 
  "Karnataka", "Madhya Pradesh", "Maharashtra", "Punjab", "Rajasthan", 
  "Tamil Nadu", "Telangana", "Uttar Pradesh", "West Bengal"
];

export default function JobAlerts() {
  usePageTracking("job-alerts");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedJobType, setSelectedJobType] = useState("ALL"); // GOVERNMENT, PRIVATE, or ALL
  const [selectedState, setSelectedState] = useState("All India");
  const [selectedStatus, setSelectedStatus] = useState("LIVE"); // LIVE, UPCOMING, CLOSED, ALL
  const [tickerIndex, setTickerIndex] = useState(0);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Read category and jobType from URL query parameter - track URL changes
  useEffect(() => {
    const updateFiltersFromUrl = () => {
      const urlParams = new URLSearchParams(window.location.search);
      
      // Handle category
      const categoryParam = urlParams.get("category");
      if (categoryParam && CATEGORIES.some(c => c.id === categoryParam)) {
        setSelectedCategory(categoryParam);
      } else if (!categoryParam) {
        setSelectedCategory("ALL");
      }
      
      // Handle jobType
      const jobTypeParam = urlParams.get("jobType");
      if (jobTypeParam && ["GOVERNMENT", "PRIVATE"].includes(jobTypeParam)) {
        setSelectedJobType(jobTypeParam);
      } else if (!jobTypeParam) {
        setSelectedJobType("ALL");
      }
    };
    
    // Initial load
    updateFiltersFromUrl();
    
    // Listen for URL changes (popstate for back/forward, custom event for Link navigation)
    window.addEventListener("popstate", updateFiltersFromUrl);
    
    // Create a MutationObserver to detect URL changes from wouter Link navigation
    let lastUrl = window.location.href;
    const checkUrlChange = () => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        updateFiltersFromUrl();
      }
    };
    const intervalId = setInterval(checkUrlChange, 100);
    
    return () => {
      window.removeEventListener("popstate", updateFiltersFromUrl);
      clearInterval(intervalId);
    };
  }, []);

  const { data: jobAlerts, isLoading } = useQuery<any[]>({
    queryKey: ["/api/job-alerts"],
  });

  const getJobStatus = (alert: any): "LIVE" | "UPCOMING" | "CLOSED" | "UNKNOWN" => {
    const now = new Date();
    if (alert.applicationEndDate) {
      const end = typeof alert.applicationEndDate === "string" ? parseISO(alert.applicationEndDate) : new Date(alert.applicationEndDate);
      if (isValid(end) && differenceInDays(end, now) < 0) return "CLOSED";
    }
    if (alert.applicationStartDate) {
      const start = typeof alert.applicationStartDate === "string" ? parseISO(alert.applicationStartDate) : new Date(alert.applicationStartDate);
      if (isValid(start) && differenceInDays(start, now) > 0) return "UPCOMING";
    }
    if (alert.applicationStartDate || alert.applicationEndDate) return "LIVE";
    return "UNKNOWN"; // No dates - treat as live for display
  };

  const filteredAlerts = jobAlerts?.filter(alert => {
    const matchesSearch = !searchQuery || 
      alert.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.organization?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.postName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "ALL" || alert.category === selectedCategory;
    const matchesJobType = selectedJobType === "ALL" || (alert.jobType || "GOVERNMENT") === selectedJobType;
    const matchesState = selectedState === "All India" || alert.state === selectedState;
    
    const jobStatus = getJobStatus(alert);
    const matchesStatus = selectedStatus === "ALL" || 
      (selectedStatus === "LIVE" && (jobStatus === "LIVE" || jobStatus === "UNKNOWN")) ||
      (selectedStatus === "UPCOMING" && jobStatus === "UPCOMING") ||
      (selectedStatus === "CLOSED" && jobStatus === "CLOSED");
    
    return matchesSearch && matchesCategory && matchesJobType && matchesState && matchesStatus && alert.isActive;
  })?.sort((a, b) => {
    // Trending/Hot items first (position #1)
    if (a.isHot && !b.isHot) return -1;
    if (!a.isHot && b.isHot) return 1;
    // Then by view count (more views = higher trending)
    if ((b.viewCount || 0) !== (a.viewCount || 0)) {
      return (b.viewCount || 0) - (a.viewCount || 0);
    }
    // Then by newest first
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  }) || [];

  const hotAlerts = jobAlerts?.filter(a => a.isHot && a.isActive).slice(0, 3) || [];
  const newAlerts = jobAlerts?.filter(a => a.isNew && a.isActive).slice(0, 5) || [];
  const trendingAlerts = jobAlerts?.filter(a => a.isActive)
    .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)).slice(0, 5) || [];

  const latestJobs = jobAlerts?.filter(a => a.category === "LATEST_JOB" && a.isActive).slice(0, 5) || [];
  const results = jobAlerts?.filter(a => a.category === "RESULT" && a.isActive).slice(0, 5) || [];
  const admitCards = jobAlerts?.filter(a => a.category === "ADMIT_CARD" && a.isActive).slice(0, 5) || [];
  const answerKeys = jobAlerts?.filter(a => a.category === "ANSWER_KEY" && a.isActive).slice(0, 5) || [];

  const stats = {
    totalJobs: jobAlerts?.filter(a => a.category === "LATEST_JOB" && a.isActive).length || 0,
    totalResults: jobAlerts?.filter(a => a.category === "RESULT" && a.isActive).length || 0,
    totalAdmitCards: jobAlerts?.filter(a => a.category === "ADMIT_CARD" && a.isActive).length || 0,
    totalVacancies: jobAlerts?.reduce((sum, a) => sum + (a.totalVacancies || 0), 0) || 0,
  };

  useEffect(() => {
    if (newAlerts.length > 0) {
      const interval = setInterval(() => {
        setTickerIndex((prev) => (prev + 1) % newAlerts.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [newAlerts.length]);

  // SEO: Dynamic page title and meta tags for search engines
  useEffect(() => {
    document.title = "Latest Job Alerts 2026 | Government & Private Jobs in India – ExaminationPortal";
    
    // Update meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", `Get daily latest job alerts 2026, government jobs in India, Sarkari Naukri notifications, admit cards, results and exam updates. Apply online for free.`);
    }

    // Add structured data for job listings
    const existingScript = document.getElementById('job-listing-schema');
    if (existingScript) existingScript.remove();
    
    if (filteredAlerts.length > 0) {
      const jobListings = filteredAlerts.slice(0, 10).map(alert => ({
        "@type": "JobPosting",
        "title": alert.title,
        "description": alert.shortDescription || alert.title,
        "hiringOrganization": {
          "@type": "Organization",
          "name": alert.organization
        },
        "jobLocation": {
          "@type": "Place",
          "address": {
            "@type": "PostalAddress",
            "addressCountry": "IN",
            "addressRegion": alert.state || "India"
          }
        },
        "datePosted": alert.createdAt,
        "validThrough": alert.applicationEndDate,
        "employmentType": "FULL_TIME"
      }));

      const script = document.createElement('script');
      script.id = 'job-listing-schema';
      script.type = 'application/ld+json';
      script.text = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "ItemList",
        "itemListElement": jobListings.map((job, i) => ({
          "@type": "ListItem",
          "position": i + 1,
          "item": job
        }))
      });
      document.head.appendChild(script);
    }
  }, [stats, filteredAlerts]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-orange-50 to-white">
      <JobAlertsHeader />
      
      <main className="flex-1">
        {newAlerts.length > 0 && (
          <div className="bg-gradient-to-r from-red-600 to-red-500 text-white py-2 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 flex items-center gap-3">
              <span className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded text-xs font-bold shrink-0 animate-pulse">
                <Zap className="w-3 h-3" /> LIVE
              </span>
              <div className="flex-1 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={tickerIndex}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center gap-2"
                  >
                    <span className="text-sm font-medium truncate">{newAlerts[tickerIndex]?.title}</span>
                    <Link href={`/job-alerts/${newAlerts[tickerIndex]?.slug || newAlerts[tickerIndex]?.id}`}>
                      <Badge variant="secondary" className="bg-white/20 text-white text-xs cursor-pointer hover:bg-white/30">
                        View <ChevronRight className="w-3 h-3" />
                      </Badge>
                    </Link>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gradient-to-br from-orange-600 via-red-600 to-red-700 text-white py-10 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
          
          <div className="max-w-7xl mx-auto px-4 relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8"
            >
              <div className="flex items-center justify-center gap-2 mb-3">
                <Sparkles className="w-6 h-6 text-yellow-300" />
                <h1 className="text-xl sm:text-3xl md:text-4xl font-bold">Latest Job Alerts 2026 – Government & Private Jobs in India</h1>
                <Sparkles className="w-6 h-6 text-yellow-300" />
              </div>
              <p className="text-white/90 text-sm md:text-lg">Free Job Notifications | SSC, Railway, Bank Jobs | Results & Admit Cards</p>
              <p className="text-white/80 text-sm mt-2 flex items-center justify-center gap-2">
                <Clock className="w-4 h-4" />
                Last Updated: {format(new Date(), "d MMMM yyyy")}
              </p>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 text-center border border-white/20"
              >
                <Briefcase className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-green-300" />
                <div className="text-xl md:text-3xl font-bold">{stats.totalJobs}</div>
                <div className="text-xs md:text-sm text-white/80">Active Jobs</div>
              </motion.div>
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 text-center border border-white/20"
              >
                <Users className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-blue-300" />
                <div className="text-xl md:text-3xl font-bold">{stats.totalVacancies.toLocaleString()}+</div>
                <div className="text-xs md:text-sm text-white/80">Vacancies</div>
              </motion.div>
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 text-center border border-white/20"
              >
                <Award className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-yellow-300" />
                <div className="text-xl md:text-3xl font-bold">{stats.totalResults}</div>
                <div className="text-xs md:text-sm text-white/80">Results Out</div>
              </motion.div>
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 text-center border border-white/20"
              >
                <ClipboardList className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-orange-300" />
                <div className="text-xl md:text-3xl font-bold">{stats.totalAdmitCards}</div>
                <div className="text-xs md:text-sm text-white/80">Admit Cards</div>
              </motion.div>
            </div>

            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search jobs, results, admit cards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-24 h-14 bg-white text-gray-900 border-0 rounded-full shadow-xl text-base md:text-lg"
                  data-testid="input-search-jobs"
                />
                <Button size="sm" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-4 md:px-6">
                  Search
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Top Banner Ad */}
        <div className="max-w-7xl mx-auto px-4 py-4">
          <AdBanner size="leaderboard" slot="top-banner" className="mx-auto max-w-4xl" />
        </div>

        {/* SEO Intro Content Section */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
            <CardContent className="p-6">
              <p className="text-gray-700 leading-relaxed text-sm md:text-base">
                Welcome to <strong>ExaminationPortal Job Alerts</strong>. Here you will find daily updates of <strong>latest government jobs in India</strong>, 
                <strong> Sarkari Naukri</strong> notifications, private jobs, admit cards, results, and exam updates for 2026. 
                We provide <strong>free job notifications</strong> for SSC, Banking, Railway, State Government, and PSU exams. 
                Bookmark this page for regular updates and never miss an opportunity!
              </p>
            </CardContent>
          </Card>
        </div>

        {hotAlerts.length > 0 && (
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border-y border-orange-200 py-6">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex items-center gap-2 mb-4">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                >
                  <Flame className="w-6 h-6 text-orange-500" />
                </motion.div>
                <h2 className="text-xl font-bold text-orange-700">Sarkari Naukri & Government Job Notifications</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {hotAlerts.map((alert, idx) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Link href={`/job-alerts/${alert.slug || alert.id}`}>
                      <Card className="border-orange-200 bg-white hover:shadow-lg transition-all cursor-pointer hover:border-orange-400 group">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white shrink-0">
                              <Flame className="w-6 h-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-orange-600">{alert.title}</h3>
                              <p className="text-xs text-muted-foreground mt-1">{alert.organization}</p>
                              {alert.totalVacancies && (
                                <Badge variant="secondary" className="mt-2 text-xs bg-orange-100 text-orange-700">
                                  {alert.totalVacancies.toLocaleString()} Posts
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Status Filter - Live/Upcoming/Closed */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-sm font-medium text-muted-foreground self-center mr-2">Status:</span>
            {[
              { id: "LIVE", label: "Apply Now", icon: Zap, color: "bg-green-500" },
              { id: "UPCOMING", label: "Upcoming", icon: Clock, color: "bg-blue-500" },
              { id: "CLOSED", label: "Closed", icon: AlertCircle, color: "bg-gray-500" },
              { id: "ALL", label: "All", icon: Bell, color: "bg-slate-500" },
            ].map((status) => {
              const count = jobAlerts?.filter(a => {
                if (!a.isActive) return false;
                const jobStatus = getJobStatus(a);
                if (status.id === "ALL") return true;
                if (status.id === "LIVE") return jobStatus === "LIVE" || jobStatus === "UNKNOWN";
                return jobStatus === status.id;
              }).length || 0;
              return (
                <Button
                  key={status.id}
                  variant={selectedStatus === status.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedStatus(status.id)}
                  className={`whitespace-nowrap ${selectedStatus === status.id ? status.color : ''}`}
                  data-testid={`button-status-${status.id.toLowerCase()}`}
                >
                  <status.icon className="w-4 h-4 mr-1" />
                  {status.label}
                  <Badge variant="secondary" className="ml-2 text-xs px-1.5 py-0">{count}</Badge>
                </Button>
              );
            })}
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {CATEGORIES.map((cat) => {
              const count = cat.id === "ALL" 
                ? jobAlerts?.filter(a => a.isActive).length || 0
                : jobAlerts?.filter(a => a.category === cat.id && a.isActive).length || 0;
              return (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`whitespace-nowrap ${selectedCategory === cat.id ? cat.color : ''}`}
                  data-testid={`button-category-${cat.id.toLowerCase()}`}
                >
                  <cat.icon className="w-4 h-4 mr-1" />
                  {cat.label}
                  <Badge variant="secondary" className="ml-2 text-xs px-1.5 py-0">{count}</Badge>
                </Button>
              );
            })}
          </div>

          <div className="lg:hidden mb-4">
            <Button
              variant="outline"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="w-full justify-center"
              data-testid="button-toggle-filters"
            >
              <MapPin className="w-4 h-4 mr-2" />
              {showMobileFilters ? "Hide Filters & Sidebar" : "Show Filters & Sidebar"}
            </Button>
          </div>

          <div className="grid lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 space-y-6">
              <Card className="overflow-hidden">
                <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-transparent">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    {selectedCategory === "ALL" ? "All Updates" : CATEGORIES.find(c => c.id === selectedCategory)?.label}
                    <Badge variant="secondary" className="ml-2">{filteredAlerts.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {isLoading ? (
                    <div className="p-4 space-y-4">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="flex gap-4">
                          <Skeleton className="w-16 h-16 rounded-lg" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-4 w-1/4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredAlerts.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">
                      <Bell className="w-16 h-16 mx-auto mb-4 opacity-30" />
                      <p className="text-lg font-medium">No updates found</p>
                      <p className="text-sm">Try changing your filters or search query</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredAlerts.map((alert, idx) => (
                        <>
                          <JobAlertCard key={alert.id} alert={alert} index={idx} />
                          {(idx + 1) % 5 === 0 && idx < filteredAlerts.length - 1 && (
                            <div key={`ad-${idx}`} className="p-3 md:p-4 bg-gray-50 dark:bg-gray-800/50">
                              {(idx + 1) % 10 === 0 ? <SponsoredJobAd /> : <InFeedAd />}
                            </div>
                          )}
                        </>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className={`space-y-6 ${showMobileFilters ? 'block' : 'hidden lg:block'}`}>
              {trendingAlerts.length > 0 && (
                <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm font-bold text-purple-700">
                      <TrendingUp className="w-4 h-4" />
                      Most Viewed
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-2">
                    <div className="space-y-2">
                      {trendingAlerts.map((alert, idx) => (
                        <Link key={alert.id} href={`/job-alerts/${alert.slug || alert.id}`}>
                          <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-purple-100 transition-colors cursor-pointer group">
                            <span className="w-6 h-6 rounded-full bg-purple-200 text-purple-700 flex items-center justify-center text-xs font-bold">
                              {idx + 1}
                            </span>
                            <span className="text-xs flex-1 line-clamp-2 group-hover:text-purple-700">{alert.title}</span>
                            <Eye className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{alert.viewCount || 0}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Sidebar Ad */}
              <AdBanner size="sidebar" slot="sidebar-1" />

              <SidebarSection 
                title="Latest Jobs" 
                icon={Briefcase} 
                items={latestJobs}
                color="bg-green-500"
                borderColor="border-green-200"
              />
              <SidebarSection 
                title="Results" 
                icon={Award} 
                items={results}
                color="bg-blue-500"
                borderColor="border-blue-200"
              />
              <SidebarSection 
                title="Admit Cards" 
                icon={ClipboardList} 
                items={admitCards}
                color="bg-orange-500"
                borderColor="border-orange-200"
              />
              <SidebarSection 
                title="Answer Keys" 
                icon={BookOpen} 
                items={answerKeys}
                color="bg-purple-500"
                borderColor="border-purple-200"
              />

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Filter by State
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {STATES.map((state) => (
                      <Button
                        key={state}
                        variant={selectedState === state ? "default" : "ghost"}
                        size="sm"
                        className="w-full justify-start text-xs"
                        onClick={() => setSelectedState(state)}
                        data-testid={`button-state-${state.replace(/\s/g, '-').toLowerCase()}`}
                      >
                        {state}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <JobAlertSubscribe />

              {/* Second Sidebar Ad */}
              <AdBanner size="sidebar" slot="sidebar-2" />
            </div>
          </div>
        </div>

        {/* FAQ Section for SEO */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Card className="border-orange-200">
            <CardHeader className="bg-gradient-to-r from-orange-100 to-amber-100 border-b border-orange-200">
              <CardTitle className="flex items-center gap-2 text-xl text-orange-800">
                <AlertCircle className="w-5 h-5" />
                Frequently Asked Questions (FAQ)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Q1: Is ExaminationPortal job alerts free?</h3>
                <p className="text-gray-600 text-sm">Yes, all job notifications on ExaminationPortal are completely free. You can browse and apply for any government or private job without any charges.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Q2: How often is this page updated?</h3>
                <p className="text-gray-600 text-sm">We update this page daily with the latest government jobs, private jobs, admit cards, results, and exam notifications from across India.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Q3: Can I get admit cards and results here?</h3>
                <p className="text-gray-600 text-sm">Yes, admit cards and results are updated regularly. We provide direct links to official portals for downloading admit cards and checking results for SSC, UPSC, Railway, Bank, and State exams.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Q4: What types of jobs are posted here?</h3>
                <p className="text-gray-600 text-sm">We cover all types of government and private jobs including SSC, UPSC, Railway, Banking, Police, Defence, State PSC, PSU, Teaching, Engineering, Medical, and more for all qualifications from 10th pass to Postgraduate.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Q5: How can I get job alerts directly?</h3>
                <p className="text-gray-600 text-sm">Subscribe to our free email alerts or enable browser notifications to receive instant updates whenever new jobs matching your preferences are posted. Use the subscription form in the sidebar.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Banner Ad */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          <AdBanner size="leaderboard" slot="bottom-banner" className="mx-auto max-w-4xl" />
        </div>
      </main>

      <JobAlertsFooter />
    </div>
  );
}

function JobAlertCard({ alert, index }: { alert: any; index: number }) {
  const deadline = getDeadlineInfo(alert.applicationEndDate, alert.applicationStartDate);
  
  const getCategoryStyle = (category: string) => {
    const styles: Record<string, { bg: string; text: string; border: string; icon: string }> = {
      LATEST_JOB: { bg: "bg-green-100", text: "text-green-700", border: "border-green-200", icon: "bg-green-500" },
      RESULT: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200", icon: "bg-blue-500" },
      ADMIT_CARD: { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200", icon: "bg-orange-500" },
      ANSWER_KEY: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200", icon: "bg-purple-500" },
      SYLLABUS: { bg: "bg-cyan-100", text: "text-cyan-700", border: "border-cyan-200", icon: "bg-cyan-500" },
      ADMISSION: { bg: "bg-pink-100", text: "text-pink-700", border: "border-pink-200", icon: "bg-pink-500" },
      IMPORTANT: { bg: "bg-red-100", text: "text-red-700", border: "border-red-200", icon: "bg-red-500" },
    };
    return styles[category] || { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200", icon: "bg-gray-500" };
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      LATEST_JOB: "Latest Job",
      RESULT: "Result",
      ADMIT_CARD: "Admit Card",
      ANSWER_KEY: "Answer Key",
      SYLLABUS: "Syllabus",
      ADMISSION: "Admission",
      IMPORTANT: "Important",
    };
    return labels[category] || category;
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      LATEST_JOB: Briefcase,
      RESULT: Award,
      ADMIT_CARD: ClipboardList,
      ANSWER_KEY: BookOpen,
      SYLLABUS: GraduationCap,
      ADMISSION: GraduationCap,
      IMPORTANT: Star,
    };
    return icons[category] || Bell;
  };

  const style = getCategoryStyle(alert.category);
  const Icon = getCategoryIcon(alert.category);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group"
    >
      <Link href={`/job-alerts/${alert.slug || alert.id}`}>
        <div className={`p-4 hover:bg-slate-50 transition-all cursor-pointer border-l-4 ${style.border} hover:border-l-primary`}>
          <div className="flex gap-4">
            <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl ${style.icon} flex items-center justify-center text-white shrink-0 shadow-lg group-hover:scale-105 transition-transform`}>
              <Icon className="w-5 h-5 md:w-7 md:h-7" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors line-clamp-2">
                  {alert.title}
                </h3>
                <div className="flex items-center gap-1 shrink-0">
                  {index === 0 && alert.isHot && (
                    <motion.div
                      animate={{ scale: [1, 1.15, 1], rotate: [0, 2, -2, 0] }}
                      transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
                    >
                      <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs px-2 font-bold shadow-lg">
                        <TrendingUp className="w-3 h-3 md:mr-1" /> <span className="hidden md:inline">#1 Trending</span>
                      </Badge>
                    </motion.div>
                  )}
                  {index !== 0 && alert.isHot && (
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                    >
                      <Badge variant="destructive" className="text-xs px-1.5">
                        <Flame className="w-3 h-3 mr-0.5" /> Hot
                      </Badge>
                    </motion.div>
                  )}
                  {alert.isNew && (
                    <Badge className="bg-green-500 text-xs px-1.5 animate-pulse">New</Badge>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mb-2">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  {alert.organization}
                </span>
                {alert.totalVacancies && (
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {alert.totalVacancies.toLocaleString()} Posts
                  </span>
                )}
                {alert.state && alert.state !== "All India" && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {alert.state}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={`${style.bg} ${style.text} ${style.border} text-xs`}>
                  {getCategoryLabel(alert.category)}
                </Badge>
                
                {deadline.upcoming && (
                  <Badge 
                    variant="outline" 
                    className="text-xs bg-blue-50 text-blue-600 border-blue-200"
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    {deadline.text}
                  </Badge>
                )}
                {alert.applicationEndDate && !deadline.expired && !deadline.upcoming && (
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${deadline.urgent ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-green-50 text-green-700 border-green-200'}`}
                  >
                    <Timer className="w-3 h-3 mr-1" />
                    {deadline.text}
                  </Badge>
                )}
                {deadline.expired && (
                  <Badge variant="outline" className="text-xs bg-gray-100 text-gray-500 border-gray-200">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Closed
                  </Badge>
                )}
                
                <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {alert.viewCount || 0} views
                </span>
              </div>
            </div>

            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 self-center" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function SidebarSection({ 
  title, 
  icon: Icon, 
  items, 
  color,
  borderColor = "border-gray-200"
}: { 
  title: string; 
  icon: any; 
  items: any[];
  color: string;
  borderColor?: string;
}) {
  if (items.length === 0) return null;
  
  return (
    <Card className={`overflow-hidden ${borderColor}`}>
      <CardHeader className={`py-3 px-4 ${color} text-white`}>
        <CardTitle className="flex items-center gap-2 text-sm font-bold">
          <Icon className="w-4 h-4" />
          {title}
          <Badge variant="secondary" className="ml-auto bg-white/20 text-white">{items.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {items.map((item) => (
            <Link key={item.id} href={`/job-alerts/${item.slug || item.id}`}>
              <div className="px-3 py-2.5 hover:bg-slate-50 transition-colors cursor-pointer group flex items-center gap-2">
                <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-primary shrink-0" />
                <span className="text-xs line-clamp-2 flex-1 group-hover:text-primary">
                  {item.title}
                </span>
                {item.isNew && (
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shrink-0"></span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
