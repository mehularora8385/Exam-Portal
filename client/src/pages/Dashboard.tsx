import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { useApplications } from "@/hooks/use-applications";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, FileText, User as UserIcon, LogOut, LayoutDashboard } from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: applications, isLoading: appsLoading } = useApplications();
  const [_, setLocation] = useLocation();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, authLoading, setLocation]);

  if (authLoading || profileLoading) {
    return <DashboardSkeleton />;
  }

  if (isAuthenticated && !profile) {
     return (
       <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
         <Card className="max-w-md w-full text-center p-6 md:p-8">
            <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold mb-2">Profile Incomplete</h2>
            <p className="text-muted-foreground mb-6 text-sm md:text-base">
              You need to complete your One-Time Registration (OTR) profile to apply for exams.
            </p>
            <Button onClick={() => setLocation("/profile/create")} className="w-full bg-primary" size="lg">
              Complete Registration Now
            </Button>
         </Card>
       </div>
     );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      
      <div className="container-custom py-6 md:py-8 flex-1">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          <aside className="w-full md:w-64 shrink-0 space-y-4">
            <Card className="overflow-hidden">
              <div className="bg-primary/5 p-4 md:p-6 text-center border-b border-border">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-full mx-auto mb-3 shadow-sm flex items-center justify-center border-2 border-primary/20">
                  {profile?.photoUrl ? (
                    <img src={profile.photoUrl} alt="Profile" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <UserIcon className="w-6 h-6 md:w-8 md:h-8 text-primary/40" />
                  )}
                </div>
                <h3 className="font-bold text-foreground text-sm md:text-base">{profile?.fullName}</h3>
                <p className="text-xs text-muted-foreground font-mono mt-1">{profile?.registrationNumber}</p>
              </div>
              <div className="p-2">
                <nav className="space-y-1">
                  <Button variant="ghost" className="w-full justify-start font-medium bg-primary/10 text-primary" asChild>
                    <Link href="/dashboard"><LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard</Link>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start font-medium text-muted-foreground hover:text-foreground" asChild>
                    <Link href="/profile/edit"><UserIcon className="w-4 h-4 mr-2" /> My Profile</Link>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start font-medium text-muted-foreground hover:text-foreground" asChild>
                    <Link href="/applications"><FileText className="w-4 h-4 mr-2" /> Applications</Link>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start font-medium text-destructive hover:bg-destructive/5 hover:text-destructive" onClick={() => logout()}>
                    <LogOut className="w-4 h-4 mr-2" /> Logout
                  </Button>
                </nav>
              </div>
            </Card>
          </aside>

          <main className="flex-1 space-y-6">
            <h1 className="text-2xl md:text-3xl font-bold font-display text-primary">Candidate Dashboard</h1>

            {!profile?.isProfileComplete && (
               <Alert variant="warning" className="bg-yellow-50 border-yellow-200">
                 <AlertCircle className="h-4 w-4 text-yellow-600" />
                 <AlertTitle className="text-yellow-800">Profile Pending</AlertTitle>
                 <AlertDescription className="text-yellow-700">
                   Some details are missing. <Link href="/profile/edit" className="underline font-semibold">Update now</Link> to avoid application rejection.
                 </AlertDescription>
               </Alert>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base md:text-lg font-medium text-muted-foreground">Total Applications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl md:text-4xl font-bold text-foreground">{applications?.length || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base md:text-lg font-medium text-muted-foreground">Last Applied</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-base md:text-lg font-semibold text-foreground">
                    {applications && applications.length > 0 
                      ? format(new Date(applications[0].createdAt || new Date()), 'dd MMM yyyy') 
                      : "N/A"}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
                <CardTitle className="text-lg">Recent Applications</CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/applications">View All</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {appsLoading ? (
                  <div className="space-y-4">
                    {[1, 2].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                  </div>
                ) : applications && applications.length > 0 ? (
                  <div className="space-y-3 md:space-y-4">
                    {applications.slice(0, 3).map(app => (
                      <div key={app.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 border rounded-lg bg-white shadow-sm gap-3">
                        <div className="flex items-center gap-3 md:gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                            app.status === 'SUBMITTED' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                          }`}>
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground text-sm md:text-base truncate">Exam ID: {app.examId}</p>
                            <p className="text-xs text-muted-foreground">Applied on {format(new Date(app.createdAt || new Date()), 'dd MMM yyyy')}</p>
                          </div>
                        </div>
                        <div className="ml-[52px] sm:ml-0">
                           <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                             app.status === 'SUBMITTED' ? 'bg-green-100 text-green-800' : 
                             app.status === 'ADMIT_CARD_GENERATED' ? 'bg-purple-100 text-purple-800' : 
                             'bg-gray-100 text-gray-800'
                           }`}>
                             {app.status}
                           </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No applications found. <Link href="/exams" className="text-primary font-medium hover:underline">View Live Exams</Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="h-16 md:h-20 bg-white border-b" />
      <div className="container-custom py-8 flex flex-col md:flex-row gap-8">
        <Skeleton className="w-full md:w-64 h-48 md:h-96" />
        <div className="flex-1 space-y-4">
          <Skeleton className="h-10 w-1/3" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    </div>
  );
}
