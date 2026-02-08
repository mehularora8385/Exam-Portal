import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileText, Users, ClipboardList, Bell, 
  Plus, LogOut, LayoutDashboard, Settings, Globe, Home,
  FileKey, Trophy, IdCard, Palette, RefreshCw, Briefcase, GraduationCap,
  Eye, TrendingUp, Monitor
} from "lucide-react";

export default function AdminDashboard() {
  const { user, isAuthenticated, isAdmin, logout, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const { data: stats } = useQuery<any>({ 
    queryKey: ["/api/admin/stats"],
    enabled: isAuthenticated && isAdmin,
  });
  const { data: applications } = useQuery<any[]>({ 
    queryKey: ["/api/admin/applications"],
    enabled: isAuthenticated && isAdmin,
  });
  const { data: visitorStats } = useQuery<any>({ 
    queryKey: ["/api/admin/visitor-stats"],
    enabled: isAuthenticated && isAdmin,
  });

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) {
      setLocation("/login");
    }
  }, [isAuthenticated, isAdmin, authLoading, setLocation]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-100 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="w-8 h-8" />
            <div>
              <h1 className="text-xl font-bold">Admin Panel</h1>
              <p className="text-xs text-primary-foreground/70">Examination Portal Management</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild className="text-primary-foreground hover:bg-primary-foreground/10">
              <Link href="/"><Home className="w-4 h-4 mr-2" /> View Site</Link>
            </Button>
            <span className="text-sm">Welcome, {user?.firstName}</span>
            <Button variant="outline" size="sm" onClick={() => logout()} className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow" data-testid="card-exams">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Exams</CardTitle>
              <FileText className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalExams || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">{stats?.activeExams || 0} active</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow" data-testid="card-applications">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Applications</CardTitle>
              <ClipboardList className="w-5 h-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalApplications || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Total submissions</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow" data-testid="card-users">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Registered Users</CardTitle>
              <Users className="w-5 h-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Candidates registered</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow" data-testid="card-notices">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Notices</CardTitle>
              <Bell className="w-5 h-5 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalNotices || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Published notices</p>
            </CardContent>
          </Card>
        </div>

        {/* Visitor Stats */}
        <Card className="mb-8" data-testid="card-visitor-stats">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" /> Visitor Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center" data-testid="stat-total-views">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-medium text-blue-600 uppercase">All-Time Views</span>
                </div>
                <p className="text-2xl font-bold text-blue-900">{visitorStats?.allTime?.totalViews?.toLocaleString() || 0}</p>
              </div>
              <div className="bg-indigo-50 rounded-lg p-4 text-center" data-testid="stat-exam-views">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Monitor className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-medium text-indigo-600 uppercase">Exam Portal</span>
                </div>
                <p className="text-2xl font-bold text-indigo-900">{visitorStats?.exam?.totalViews?.toLocaleString() || 0}</p>
                <p className="text-xs text-indigo-600 mt-1">Today: {visitorStats?.exam?.todayViews || 0}</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 text-center" data-testid="stat-jobs-views">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Briefcase className="w-4 h-4 text-orange-600" />
                  <span className="text-xs font-medium text-orange-600 uppercase">Rojgar Hub</span>
                </div>
                <p className="text-2xl font-bold text-orange-900">{visitorStats?.jobs?.totalViews?.toLocaleString() || 0}</p>
                <p className="text-xs text-orange-600 mt-1">Today: {visitorStats?.jobs?.todayViews || 0}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center" data-testid="stat-exam-today">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Eye className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-medium text-green-600 uppercase">Today (Exam)</span>
                </div>
                <p className="text-2xl font-bold text-green-900">{visitorStats?.exam?.todayViews || 0}</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-4 text-center" data-testid="stat-jobs-today">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Eye className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-medium text-amber-600 uppercase">Today (Rojgar Hub)</span>
                </div>
                <p className="text-2xl font-bold text-amber-900">{visitorStats?.jobs?.todayViews || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Button variant="outline" className="h-24 flex-col gap-2" asChild data-testid="button-manage-exams">
                <Link href="/admin/exams">
                  <FileText className="w-6 h-6" />
                  <span>Manage Exams</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-24 flex-col gap-2" asChild data-testid="button-manage-notices">
                <Link href="/admin/notices">
                  <Bell className="w-6 h-6" />
                  <span>Manage Notices</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-24 flex-col gap-2" asChild data-testid="button-view-applications">
                <Link href="/admin/applications">
                  <ClipboardList className="w-6 h-6" />
                  <span>View Applications</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-24 flex-col gap-2" asChild data-testid="button-site-settings">
                <Link href="/admin/settings">
                  <Settings className="w-6 h-6" />
                  <span>Site Settings</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-24 flex-col gap-2" asChild data-testid="button-subdomain-config">
                <Link href="/admin/subdomain">
                  <Globe className="w-6 h-6" />
                  <span>Subdomain Config</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-24 flex-col gap-2" asChild data-testid="button-answer-keys">
                <Link href="/admin/answer-keys">
                  <FileKey className="w-6 h-6" />
                  <span>Answer Keys</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-24 flex-col gap-2" asChild data-testid="button-results">
                <Link href="/admin/results">
                  <Trophy className="w-6 h-6" />
                  <span>Upload Results</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-24 flex-col gap-2" asChild data-testid="button-admit-cards">
                <Link href="/admin/admit-cards">
                  <IdCard className="w-6 h-6" />
                  <span>Admit Cards</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-24 flex-col gap-2" asChild data-testid="button-templates">
                <Link href="/admin/templates">
                  <Palette className="w-6 h-6" />
                  <span>Templates</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-24 flex-col gap-2" asChild data-testid="button-job-alerts">
                <Link href="/admin/job-alerts">
                  <Briefcase className="w-6 h-6" />
                  <span>Job Alerts</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-24 flex-col gap-2" asChild data-testid="button-test-series">
                <Link href="/admin/test-series">
                  <GraduationCap className="w-6 h-6" />
                  <span>Test Series</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-24 flex-col gap-2" asChild data-testid="button-revaluations">
                <Link href="/admin/revaluations">
                  <RefreshCw className="w-6 h-6" />
                  <span>Revaluations</span>
                </Link>
              </Button>
              <Button className="h-24 flex-col gap-2" asChild data-testid="button-add-exam">
                <Link href="/admin/exams/new">
                  <Plus className="w-6 h-6" />
                  <span>Add New Exam</span>
                </Link>
              </Button>
              <Button className="h-24 flex-col gap-2 bg-amber-600 hover:bg-amber-700" asChild data-testid="button-add-notice">
                <Link href="/admin/notices/new">
                  <Plus className="w-6 h-6" />
                  <span>Add New Notice</span>
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Recent Applications */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Applications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {applications && applications.length > 0 ? (
                applications.slice(0, 5).map((app: any) => (
                  <div key={app.id} className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded" data-testid={`app-${app.id}`}>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{app.candidate?.fullName || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{app.exam?.code || "N/A"}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded shrink-0 ${
                      app.status === 'SUBMITTED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {app.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No applications yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
