import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Briefcase, Building2, GraduationCap, Award, ClipboardList, BookOpen, 
  ArrowRight, TrendingUp, Clock, MapPin, Users, Search, Bell, Star,
  ChevronRight, Zap, FileText, Shield, Share2, Smartphone, Globe
} from "lucide-react";
import { SiTelegram, SiWhatsapp } from "react-icons/si";
import { JobAlertsHeader } from "@/components/JobAlertsHeader";
import { JobAlertsFooter } from "@/components/JobAlertsFooter";
import { JobAlertSubscribe } from "@/components/JobAlertSubscribe";
import { AdBanner, SponsoredJobAd } from "@/components/AdBanner";
import { usePortal } from "@/hooks/use-portal";
import { usePageTracking } from "@/hooks/use-page-tracking";
import { format, parseISO, isValid, differenceInHours } from "date-fns";
import { useEffect } from "react";

function safeFormatDate(dateValue: any, formatStr: string = "dd MMM yyyy"): string {
  if (!dateValue) return "";
  try {
    const date = typeof dateValue === "string" ? parseISO(dateValue) : new Date(dateValue);
    return isValid(date) ? format(date, formatStr) : "";
  } catch {
    return "";
  }
}

export default function RojgarHubHome() {
  usePageTracking("rojgar-hub-home");
  const { jobBasePath } = usePortal();
  const base = jobBasePath;

  const { data: settings } = useQuery<Record<string, any>>({
    queryKey: ["/api/settings"],
  });

  const portalName = settings?.jobPortalName || "Rojgar Hub";
  const examPortalName = settings?.portalName || "Examination Portal";

  useEffect(() => {
    document.title = `${portalName} - Latest Government Jobs, Sarkari Naukri, Results & Admit Cards 2026`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", `${portalName} - Get latest government job notifications, Sarkari Naukri 2026, SSC, Railway, Bank, UPSC jobs, results, admit cards & answer keys. Free job alerts daily.`);
    }

    const existingOg = document.querySelectorAll('meta[property^="og:"]');
    existingOg.forEach(el => el.remove());
    
    const ogTags = [
      { property: "og:title", content: `${portalName} - Government & Private Jobs Portal` },
      { property: "og:description", content: "Your trusted source for latest government jobs, Sarkari Naukri, results, admit cards & exam updates." },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: portalName },
      { property: "og:url", content: window.location.href },
    ];
    ogTags.forEach(tag => {
      const meta = document.createElement("meta");
      meta.setAttribute("property", tag.property);
      meta.setAttribute("content", tag.content);
      document.head.appendChild(meta);
    });
  }, [portalName]);

  const categoryCards = [
    { label: "Latest Jobs", href: `${base}?category=LATEST_JOB`, icon: Briefcase, color: "bg-blue-500", desc: "New job openings" },
    { label: "Results", href: `${base}?category=RESULT`, icon: Award, color: "bg-green-500", desc: "Check your results" },
    { label: "Admit Cards", href: `${base}?category=ADMIT_CARD`, icon: ClipboardList, color: "bg-orange-500", desc: "Download admit cards" },
    { label: "Answer Keys", href: `${base}?category=ANSWER_KEY`, icon: BookOpen, color: "bg-purple-500", desc: "View answer keys" },
    { label: "Syllabus", href: `${base}?category=SYLLABUS`, icon: FileText, color: "bg-teal-500", desc: "Exam syllabus" },
    { label: "Admissions", href: `${base}?category=ADMISSION`, icon: GraduationCap, color: "bg-pink-500", desc: "Admission updates" },
  ];

  const jobTypeCards = [
    { label: "Government Jobs", href: `${base}?jobType=GOVERNMENT`, icon: Building2, color: "from-blue-600 to-blue-800", count: "500+" },
    { label: "Private Jobs", href: `${base}?jobType=PRIVATE`, icon: Briefcase, color: "from-orange-500 to-red-600", count: "200+" },
    { label: "Remote Jobs", href: `${base}?jobType=REMOTE`, icon: MapPin, color: "from-green-500 to-emerald-700", count: "100+" },
  ];

  const { data: alerts, isLoading } = useQuery<any[]>({
    queryKey: ["/api/job-alerts", { limit: 12 }],
  });

  const { data: stats } = useQuery<any>({
    queryKey: ["/api/job-alerts/stats"],
  });

  const latestAlerts = alerts?.slice(0, 8) || [];
  const trendingAlerts = alerts?.filter((a: any) => a.isHot || a.views > 50)?.slice(0, 4) || [];

  const shareUrl = typeof window !== "undefined" ? window.location.origin : "";
  const shareText = `Check out ${portalName} for latest government job notifications, results & admit cards!`;

  return (
    <div className="min-h-screen bg-gray-50">
      <JobAlertsHeader />

      <section className="relative bg-gradient-to-br from-orange-600 via-red-600 to-red-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-yellow-400 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-12 md:py-20">
          <div className="text-center max-w-3xl mx-auto">
            <Badge variant="secondary" className="mb-4 bg-white/20 text-white border-white/30 no-default-hover-elevate no-default-active-elevate">
              <Zap className="w-3 h-3 mr-1" /> {stats?.totalActive || "500"}+ Active Job Listings
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight" data-testid="text-hero-title">
              Your Gateway to
              <span className="block text-yellow-300">Government & Private Jobs</span>
            </h1>
            <p className="text-base md:text-lg text-white/80 mb-8 max-w-2xl mx-auto">
              Get latest job notifications, results, admit cards, and answer keys. 
              Stay updated with real-time alerts for all government and private sector opportunities.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href={base}>
                <Button size="lg" className="bg-white text-red-700 font-semibold min-h-[44px] w-full sm:w-auto" data-testid="button-browse-jobs">
                  <Search className="w-4 h-4 mr-2" /> Browse All Jobs
                </Button>
              </Link>
              <Link href={`${base}?category=LATEST_JOB`}>
                <Button size="lg" variant="outline" className="border-white/40 text-white bg-white/10 backdrop-blur-sm min-h-[44px] w-full sm:w-auto" data-testid="button-latest-jobs">
                  <Bell className="w-4 h-4 mr-2" /> Latest Updates
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-4xl mx-auto">
            {[
              { label: "Total Jobs", value: stats?.totalActive || "500+", icon: Briefcase },
              { label: "Govt Jobs", value: stats?.govtJobs || "300+", icon: Building2 },
              { label: "Today's Updates", value: stats?.todayCount || "20+", icon: TrendingUp },
              { label: "Subscribers", value: stats?.subscribers || "10K+", icon: Users },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-lg p-3 md:p-4 text-center border border-white/10">
                <stat.icon className="w-5 h-5 mx-auto mb-1 text-yellow-300" />
                <div className="text-xl md:text-2xl font-bold">{stat.value}</div>
                <div className="text-[10px] md:text-xs text-white/70">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-4 bg-white border-b">
        <div className="max-w-5xl mx-auto px-4">
          <AdBanner size="leaderboard" slot="top-banner" className="mx-auto" />
        </div>
      </section>

      <section className="py-8 md:py-12 max-w-7xl mx-auto px-4">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6 text-center">Browse by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {categoryCards.map((cat) => (
            <Link key={cat.label} href={cat.href}>
              <Card className="hover-elevate cursor-pointer h-full">
                <CardContent className="p-4 text-center">
                  <div className={`${cat.color} w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3`}>
                    <cat.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-sm text-gray-900" data-testid={`text-category-${cat.label.toLowerCase().replace(/\s+/g, '-')}`}>{cat.label}</h3>
                  <p className="text-[10px] text-muted-foreground mt-1">{cat.desc}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="py-6 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-4">
            {jobTypeCards.map((jt) => (
              <Link key={jt.label} href={jt.href}>
                <div className={`bg-gradient-to-r ${jt.color} rounded-xl p-6 text-white hover-elevate cursor-pointer`}>
                  <jt.icon className="w-8 h-8 mb-3 opacity-80" />
                  <h3 className="text-lg font-bold">{jt.label}</h3>
                  <p className="text-sm text-white/70 mt-1">{jt.count} listings</p>
                  <div className="mt-3 flex items-center text-sm font-medium">
                    View All <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-4 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <AdBanner size="banner" slot="infeed" className="mx-auto" />
        </div>
      </section>

      <section className="py-8 md:py-12 max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between gap-2 mb-6 flex-wrap">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Latest Updates</h2>
          <Link href={base}>
            <Button variant="outline" size="sm" data-testid="button-view-all-jobs">
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {isLoading ? (
              <div className="grid md:grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2 mb-1" />
                      <Skeleton className="h-4 w-1/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-3 md:gap-4">
                {latestAlerts.map((alert: any) => {
                  const hoursAgo = alert.publishDate ? differenceInHours(new Date(), new Date(alert.publishDate)) : null;
                  return (
                    <Link key={alert.id} href={`${base}/${alert.id}`}>
                      <Card className="hover-elevate cursor-pointer h-full">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold ${
                              alert.category === "LATEST_JOB" ? "bg-blue-500" :
                              alert.category === "RESULT" ? "bg-green-500" :
                              alert.category === "ADMIT_CARD" ? "bg-orange-500" :
                              alert.category === "ANSWER_KEY" ? "bg-purple-500" :
                              "bg-gray-500"
                            }`}>
                              {alert.category === "LATEST_JOB" ? <Briefcase className="w-5 h-5" /> :
                               alert.category === "RESULT" ? <Award className="w-5 h-5" /> :
                               alert.category === "ADMIT_CARD" ? <ClipboardList className="w-5 h-5" /> :
                               <BookOpen className="w-5 h-5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                {alert.isNew && (
                                  <Badge variant="destructive" className="text-[9px] px-1.5 py-0">NEW</Badge>
                                )}
                                {alert.isHot && (
                                  <Badge className="bg-orange-100 text-orange-700 text-[9px] px-1.5 py-0 no-default-hover-elevate no-default-active-elevate">
                                    <Star className="w-2.5 h-2.5 mr-0.5" /> HOT
                                  </Badge>
                                )}
                                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 no-default-hover-elevate no-default-active-elevate">
                                  {(alert.category || "").replace(/_/g, " ")}
                                </Badge>
                              </div>
                              <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 mb-1" data-testid={`text-job-title-${alert.id}`}>
                                {alert.title}
                              </h3>
                              <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                                {alert.organization && (
                                  <span className="flex items-center gap-1">
                                    <Building2 className="w-3 h-3" /> {alert.organization}
                                  </span>
                                )}
                                {alert.publishDate && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {hoursAgo !== null && hoursAgo < 24 
                                      ? `${hoursAgo}h ago` 
                                      : safeFormatDate(alert.publishDate)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 mt-1" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <AdBanner size="sidebar" slot="sidebar-1" />

            <SponsoredJobAd />

            <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardContent className="p-4 text-center">
                <Shield className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <h3 className="font-bold text-sm text-gray-900 mb-1">Apply for Government Exams</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Register for upcoming examinations on {examPortalName}
                </p>
                <a href="https://examinationportal.com" target="_blank" rel="noopener noreferrer">
                  <Button size="sm" className="w-full" data-testid="button-visit-exam-portal">
                    <Globe className="w-4 h-4 mr-2" /> Visit {examPortalName}
                  </Button>
                </a>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
              <CardContent className="p-4">
                <h3 className="font-bold text-sm text-gray-900 mb-3 flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-green-600" /> Share with Friends
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + " " + shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded-lg bg-green-500 text-white text-xs font-medium justify-center"
                    data-testid="button-share-whatsapp"
                  >
                    <SiWhatsapp className="w-4 h-4" /> WhatsApp
                  </a>
                  <a
                    href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded-lg bg-blue-500 text-white text-xs font-medium justify-center"
                    data-testid="button-share-telegram"
                  >
                    <SiTelegram className="w-4 h-4" /> Telegram
                  </a>
                </div>
              </CardContent>
            </Card>

            <AdBanner size="sidebar" slot="sidebar-2" />
          </div>
        </div>
      </section>

      <section className="py-4 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <AdBanner size="leaderboard" slot="bottom-banner" className="mx-auto" />
        </div>
      </section>

      {trendingAlerts.length > 0 && (
        <section className="py-8 md:py-12 bg-gradient-to-br from-orange-50 to-red-50">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-orange-600" /> Trending Now
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {trendingAlerts.map((alert: any) => (
                <Link key={alert.id} href={`${base}/${alert.id}`}>
                  <Card className="hover-elevate cursor-pointer h-full">
                    <CardContent className="p-4">
                      <Badge className="mb-2 text-[9px] bg-orange-100 text-orange-700 no-default-hover-elevate no-default-active-elevate">
                        <TrendingUp className="w-2.5 h-2.5 mr-0.5" /> Trending
                      </Badge>
                      <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 mb-2">{alert.title}</h3>
                      {alert.organization && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Building2 className="w-3 h-3" /> {alert.organization}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-6 bg-gradient-to-r from-indigo-600 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <div>
              <h2 className="text-xl md:text-2xl font-bold mb-2">Get Instant Job Alerts</h2>
              <p className="text-white/80 text-sm md:text-base">
                Subscribe to get free notifications for latest government jobs, results, and admit cards directly to your inbox.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent("Subscribe me to " + portalName + " job alerts: " + shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="lg" className="bg-green-500 text-white w-full sm:w-auto" data-testid="button-whatsapp-subscribe">
                  <SiWhatsapp className="w-5 h-5 mr-2" /> WhatsApp Alerts
                </Button>
              </a>
              <a
                href="https://t.me/rojgarhub"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="lg" variant="outline" className="border-white/40 text-white bg-white/10 w-full sm:w-auto" data-testid="button-telegram-subscribe">
                  <SiTelegram className="w-5 h-5 mr-2" /> Join Telegram
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 md:py-12 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <JobAlertSubscribe />
        </div>
      </section>

      <section className="py-6 bg-gradient-to-r from-gray-100 to-gray-50 border-t">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                <Bell className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-bold text-sm text-gray-900">Daily Updates</h3>
              <p className="text-xs text-muted-foreground">Get fresh job notifications every day from all major recruitment boards</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-bold text-sm text-gray-900">100% Free</h3>
              <p className="text-xs text-muted-foreground">All job alerts, results, and admit card notifications are completely free</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-bold text-sm text-gray-900">Mobile Friendly</h3>
              <p className="text-xs text-muted-foreground">Access all features on your smartphone with our mobile-optimized design</p>
            </div>
          </div>
        </div>
      </section>

      <JobAlertsFooter />
    </div>
  );
}
