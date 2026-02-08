import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { NewsTicker } from "@/components/NewsTicker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, FileText, ChevronRight, ArrowRight, CheckCircle2, Users, Bell, Download, Shield, Award, Clock, Building2, Briefcase } from "lucide-react";
import { AdBanner } from "@/components/AdBanner";
import { format, isValid, parseISO } from "date-fns";
import bgImage from "@assets/bg_1769739419861.jpg";
import { useSubdomain } from "@/hooks/use-subdomain";
import { usePageTracking } from "@/hooks/use-page-tracking";

function safeFormatDate(dateValue: any, formatStr: string): string {
  if (!dateValue) return "";
  try {
    const date = typeof dateValue === "string" ? parseISO(dateValue) : new Date(dateValue);
    return isValid(date) ? format(date, formatStr) : "";
  } catch {
    return "";
  }
}

export default function Home() {
  usePageTracking("home");
  const subdomain = useSubdomain();
  
  const { data: exams, isLoading: loadingExams } = useQuery<any[]>({
    queryKey: ["/api/exams"],
  });

  const { data: notices, isLoading: loadingNotices } = useQuery<any[]>({
    queryKey: ["/api/notices"],
  });

  const { data: settings } = useQuery<Record<string, any>>({
    queryKey: ["/api/settings"],
  });

  const portalName = settings?.portalName || "Examination Portal";
  const heroTitle = settings?.heroTitle || "Welcome to Examination Portal";
  const heroSubtitle = settings?.heroSubtitle || "Your Gateway to Employment Opportunities";
  const heroBgUrl = settings?.heroBgUrl;
  // Filter exams by subdomain if detected
  const filteredExams = subdomain 
    ? exams?.filter(e => e.subdomain === subdomain)
    : exams;
  const activeExams = filteredExams?.filter(e => e.isActive) || [];
  const totalVacancies = activeExams.reduce((sum, e) => sum + (e.totalVacancies || 0), 0);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <NewsTicker />

      <main className="flex-1">
        {/* Hero Section with Background Image */}
        <section className="relative min-h-[400px] md:min-h-[600px] flex items-center">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${heroBgUrl || bgImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/85 to-primary/70" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />
          
          <div className="max-w-6xl mx-auto px-4 relative z-10 w-full py-16">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="text-white"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm mb-6 text-sm font-medium">
                  <Shield className="w-4 h-4 text-secondary" />
                  <span>Official Examination Portal</span>
                </div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight text-white drop-shadow-lg">
                  {heroTitle}
                </h1>
                <p className="text-lg md:text-xl text-white/90 mb-8 leading-relaxed drop-shadow-md">
                  {heroSubtitle}
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" className="bg-secondary text-secondary-foreground font-bold shadow-xl" asChild>
                    <Link href="/register">
                      <Users className="w-5 h-5 mr-2" />
                      New Registration
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="border-2 border-white text-white font-semibold bg-white/10 backdrop-blur-sm" asChild>
                    <Link href="/login">Candidate Login</Link>
                  </Button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="bg-white/95 backdrop-blur shadow-2xl border-0 hidden md:block">
                  <CardHeader className="bg-primary text-white rounded-t-lg pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Award className="w-5 h-5 text-secondary" />
                      Quick Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-3xl font-bold text-primary mb-1">{activeExams.length}</div>
                        <div className="text-sm text-muted-foreground font-medium">Active Exams</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-3xl font-bold text-green-600 mb-1">{totalVacancies.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground font-medium">Vacancies</div>
                      </div>
                      <div className="text-center p-4 bg-amber-50 rounded-lg">
                        <div className="text-3xl font-bold text-amber-600 mb-1">24/7</div>
                        <div className="text-sm text-muted-foreground font-medium">Online Support</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-3xl font-bold text-purple-600 mb-1">100%</div>
                        <div className="text-sm text-muted-foreground font-medium">Secure Portal</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <div className="grid grid-cols-2 gap-3 md:hidden mt-6">
                  <div className="bg-white/15 backdrop-blur-sm rounded-lg p-3 text-center border border-white/20">
                    <div className="text-xl font-bold text-white">{activeExams.length}</div>
                    <div className="text-xs text-white/80">Active Exams</div>
                  </div>
                  <div className="bg-white/15 backdrop-blur-sm rounded-lg p-3 text-center border border-white/20">
                    <div className="text-xl font-bold text-white">{totalVacancies.toLocaleString()}</div>
                    <div className="text-xs text-white/80">Vacancies</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 bg-white border-b">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
              <div className="flex items-start gap-3 md:gap-4 p-3 md:p-4">
                <div className="w-10 h-10 md:w-14 md:h-14 bg-blue-100 rounded-lg flex items-center justify-center text-primary shrink-0">
                  <Shield className="w-5 h-5 md:w-7 md:h-7" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-1 text-sm md:text-base">Secure Platform</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">Government grade security for your data</p>
                </div>
              </div>
              <div className="flex items-start gap-3 md:gap-4 p-3 md:p-4">
                <div className="w-10 h-10 md:w-14 md:h-14 bg-green-100 rounded-lg flex items-center justify-center text-green-600 shrink-0">
                  <Clock className="w-5 h-5 md:w-7 md:h-7" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-1 text-sm md:text-base">Quick Process</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">Easy registration and application</p>
                </div>
              </div>
              <div className="flex items-start gap-3 md:gap-4 p-3 md:p-4">
                <div className="w-10 h-10 md:w-14 md:h-14 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600 shrink-0">
                  <Bell className="w-5 h-5 md:w-7 md:h-7" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-1 text-sm md:text-base">Real-time Updates</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">Get instant notifications</p>
                </div>
              </div>
              <div className="flex items-start gap-3 md:gap-4 p-3 md:p-4">
                <div className="w-10 h-10 md:w-14 md:h-14 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 shrink-0">
                  <Building2 className="w-5 h-5 md:w-7 md:h-7" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-1 text-sm md:text-base">Multiple Exams</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">Apply for various government posts</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Job Alerts Section - Internal Link for SEO */}
        <section className="py-12 bg-gradient-to-r from-orange-50 to-amber-50 border-y border-orange-200">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg">
                  <Briefcase className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-orange-800">Latest Job Alerts 2026</h2>
                  <p className="text-orange-700/80 text-sm md:text-base">Government jobs, Sarkari Naukri, SSC, Railway, Bank jobs & more</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" className="bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg" asChild>
                  <Link href="/job-alerts" data-testid="link-view-job-notifications">
                    <Bell className="w-5 h-5 mr-2" />
                    View Government Job Notifications
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-orange-300 text-orange-700" asChild>
                  <Link href="/job-alerts" data-testid="link-check-job-alerts">
                    Check Latest Job Alerts
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Active Examinations */}
        <section className="py-10 md:py-16 bg-slate-50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8 gap-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Active Examinations</h2>
                <p className="text-muted-foreground mt-1 text-sm md:text-base">Apply for ongoing government examinations</p>
              </div>
              <Button variant="outline" asChild className="shrink-0">
                <Link href="/exams">
                  View All <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>

            {loadingExams ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-6">
                    <Skeleton className="h-6 w-20 mb-4" />
                    <Skeleton className="h-5 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4 mb-4" />
                    <Skeleton className="h-10 w-full" />
                  </Card>
                ))}
              </div>
            ) : activeExams.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeExams.slice(0, 6).map((exam) => (
                  <Card key={exam.id} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-md overflow-hidden" data-testid={`card-exam-${exam.id}`}>
                    <div className="h-2 bg-gradient-to-r from-primary to-blue-600" />
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start gap-2">
                        <Badge className="bg-primary/10 text-primary border-0 font-bold tracking-wide">{exam.code}</Badge>
                        <Badge className="bg-green-100 text-green-700 border-0">Open</Badge>
                      </div>
                      <CardTitle className="line-clamp-2 text-lg group-hover:text-primary transition-colors mt-3">
                        {exam.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-3 text-sm text-muted-foreground space-y-3">
                      {exam.conductingBody && (
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-slate-400" />
                          <span className="font-medium text-foreground">{exam.conductingBody}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span>Vacancies: <span className="text-foreground font-semibold">{exam.totalVacancies?.toLocaleString() || "TBD"}</span></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span>
                          Last Date: <span className="text-red-600 font-semibold">
                            {safeFormatDate(exam.applyEndDate, 'dd MMM yyyy') || "TBD"}
                          </span>
                        </span>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-4 border-t bg-slate-50/50">
                      <Button className="w-full" asChild>
                        <Link href={`/exams/${exam.id}`}>View Details & Apply</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center py-16 border-dashed border-2">
                <CardContent>
                  <FileText className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Active Examinations</h3>
                  <p className="text-muted-foreground">Check back later for new examination announcements.</p>
                </CardContent>
              </Card>
            )}

          
          </div>
        </section>

        {/* Notices & How to Apply */}
        <section className="py-10 md:py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Latest Notices */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <Bell className="w-5 h-5 text-primary" />
                    Latest Notices
                  </h2>
                  <Link href="/notices" className="text-primary font-medium text-sm hover:underline flex items-center gap-1">
                    View All <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="space-y-3">
                  {loadingNotices ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="p-4 bg-slate-50 rounded-lg">
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-3 w-1/3" />
                        </div>
                      ))}
                    </div>
                  ) : notices && notices.length > 0 ? (
                    notices.slice(0, 5).map((notice) => (
                      <div key={notice.id} className="bg-slate-50 p-4 rounded-lg hover:bg-slate-100 transition-colors flex items-start gap-4 group border border-slate-100" data-testid={`notice-${notice.id}`}>
                        <div className="bg-primary text-white p-2 rounded shrink-0 font-bold text-center min-w-[50px]">
                          <span className="block text-xs uppercase">{safeFormatDate(notice.publishedAt, 'MMM') || 'Jan'}</span>
                          <span className="block text-lg leading-none">{safeFormatDate(notice.publishedAt, 'dd') || '01'}</span>
                        </div>
                        <div className="flex-1 pt-1">
                          <h4 className="font-medium text-foreground group-hover:text-primary transition-colors cursor-pointer text-sm leading-snug">
                            {notice.title}
                            {notice.isNew && <Badge className="ml-2 bg-red-100 text-red-600 border-0 text-[10px] px-1.5">NEW</Badge>}
                          </h4>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mt-1">{notice.type}</p>
                        </div>
                        {notice.pdfUrl && (
                          <Button variant="ghost" size="icon" className="shrink-0 text-slate-400 hover:text-primary">
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground bg-slate-50 rounded-lg">
                      No notices available
                    </div>
                  )}
                </div>
              </div>

              {/* How to Apply */}
              <div>
                <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  How to Apply
                </h2>
                <div className="space-y-4">
                  {[
                    { step: "1", title: "New Registration", desc: "Create your account with valid email and mobile number" },
                    { step: "2", title: "Complete Profile", desc: "Fill in your personal details, education, and upload documents" },
                    { step: "3", title: "Select Examination", desc: "Browse and select the exam you want to apply for" },
                    { step: "4", title: "Submit Application", desc: "Complete the application form and pay the fees" },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold shrink-0">
                        {item.step}
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{item.title}</h4>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button className="w-full mt-6 h-12" asChild>
                  <Link href="/register">
                    <Users className="w-5 h-5 mr-2" />
                    Start Registration
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-6 bg-white dark:bg-gray-900">
          <div className="max-w-6xl mx-auto px-4">
            <AdBanner size="leaderboard" slot="bottom-banner" className="mx-auto max-w-4xl" />
          </div>
        </section>

        {/* Quick Links */}
        <section className="py-12 bg-gradient-to-br from-primary via-primary to-blue-800 text-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-xl font-bold text-center mb-8">Quick Links</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/login" className="bg-white/10 backdrop-blur-sm p-6 rounded-lg text-center hover:bg-white/20 transition-all border border-white/10">
                <Users className="w-10 h-10 mx-auto mb-3 text-secondary" />
                <span className="font-semibold">Candidate Login</span>
              </Link>
              <Link href="/register" className="bg-white/10 backdrop-blur-sm p-6 rounded-lg text-center hover:bg-white/20 transition-all border border-white/10">
                <FileText className="w-10 h-10 mx-auto mb-3 text-secondary" />
                <span className="font-semibold">New Registration</span>
              </Link>
              <Link href="/exams" className="bg-white/10 backdrop-blur-sm p-6 rounded-lg text-center hover:bg-white/20 transition-all border border-white/10">
                <Calendar className="w-10 h-10 mx-auto mb-3 text-secondary" />
                <span className="font-semibold">Active Exams</span>
              </Link>
              <Link href="/notices" className="bg-white/10 backdrop-blur-sm p-6 rounded-lg text-center hover:bg-white/20 transition-all border border-white/10">
                <Bell className="w-10 h-10 mx-auto mb-3 text-secondary" />
                <span className="font-semibold">All Notices</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
