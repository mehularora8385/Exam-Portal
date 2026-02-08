import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, Download, Eye, Clock, CheckCircle2, XCircle, 
  AlertCircle, Calendar, MapPin, User, Award, RefreshCw
} from "lucide-react";
import type { Application, Exam, Profile } from "@shared/schema";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

interface ApplicationWithExam extends Application {
  exam?: Exam;
}

export default function CandidateDashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [_, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("applications");

  const { data: profile } = useQuery<Profile>({
    queryKey: ["/api/profile"],
    enabled: isAuthenticated,
  });

  const { data: applications, isLoading: appsLoading } = useQuery<ApplicationWithExam[]>({
    queryKey: ["/api/applications"],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, authLoading, setLocation]);

  if (authLoading || appsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const submittedApps = applications?.filter(app => app.status === "SUBMITTED") || [];
  const admitCardApps = submittedApps.filter(app => app.admitCardGenerated && app.rollNumber);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground" data-testid="text-dashboard-title">
            Candidate Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome, {profile?.fullName || user?.firstName}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Applications</p>
                  <p className="text-2xl font-bold" data-testid="text-total-applications">
                    {applications?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Submitted</p>
                  <p className="text-2xl font-bold" data-testid="text-submitted-count">
                    {submittedApps.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Download className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Admit Cards</p>
                  <p className="text-2xl font-bold" data-testid="text-admit-cards-count">
                    {admitCardApps.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Award className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Results Available</p>
                  <p className="text-2xl font-bold" data-testid="text-results-count">
                    {submittedApps.filter(a => a.exam?.resultDeclared).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="applications" data-testid="tab-applications">My Applications</TabsTrigger>
            <TabsTrigger value="admit-cards" data-testid="tab-admit-cards">Admit Cards</TabsTrigger>
            <TabsTrigger value="results" data-testid="tab-results">My Results</TabsTrigger>
          </TabsList>

          <TabsContent value="applications" className="space-y-4">
            {applications?.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No applications yet.</p>
                  <Button asChild className="mt-4">
                    <Link href="/exams">Browse Exams</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              applications?.map(app => (
                <Card key={app.id} data-testid={`card-application-${app.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{app.exam?.title}</CardTitle>
                        <CardDescription>{app.exam?.code}</CardDescription>
                      </div>
                      <Badge variant={app.status === "SUBMITTED" ? "default" : "secondary"}>
                        {app.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Application No.</p>
                        <p className="font-mono font-medium">{app.applicationNumber || "-"}</p>
                      </div>
                      {app.rollNumber && (
                        <div>
                          <p className="text-muted-foreground">Roll Number</p>
                          <p className="font-mono font-medium">{app.rollNumber}</p>
                        </div>
                      )}
                      {app.allocatedCenter && (
                        <div>
                          <p className="text-muted-foreground">Exam Center</p>
                          <p className="font-medium flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {app.allocatedCenter}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-muted-foreground">Submitted</p>
                        <p className="font-medium">
                          {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : "-"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="admit-cards" className="space-y-4">
            {admitCardApps.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Download className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No admit cards available yet.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Admit cards will be available after center allocation is complete.
                  </p>
                </CardContent>
              </Card>
            ) : (
              admitCardApps.map(app => (
                <Card key={app.id} data-testid={`card-admit-${app.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{app.exam?.title}</CardTitle>
                        <CardDescription>Roll Number: {app.rollNumber}</CardDescription>
                      </div>
                      <Badge className="bg-green-600">Admit Card Available</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-muted-foreground">Exam Center</p>
                        <p className="font-medium flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {app.allocatedCenter || "To be announced"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Exam Date</p>
                        <p className="font-medium flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> 
                          {app.exam?.examDate ? new Date(app.exam.examDate).toLocaleDateString() : "TBA"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Candidate</p>
                        <p className="font-medium flex items-center gap-1">
                          <User className="w-3 h-3" /> {profile?.fullName}
                        </p>
                      </div>
                    </div>
                    <Button asChild data-testid={`button-download-admit-${app.id}`}>
                      <Link href={`/admit-card/${app.id}`}>
                        <Eye className="w-4 h-4 mr-2" /> View / Download Admit Card
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            {submittedApps.filter(a => a.exam?.resultDeclared).length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No results declared yet.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Results will appear here once they are published.
                  </p>
                </CardContent>
              </Card>
            ) : (
              submittedApps.filter(a => a.exam?.resultDeclared).map(app => (
                <Card key={app.id} data-testid={`card-result-${app.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{app.exam?.title}</CardTitle>
                        <CardDescription>Roll Number: {app.rollNumber}</CardDescription>
                      </div>
                      <Badge className="bg-green-600">Result Declared</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      <Button asChild variant="default" data-testid={`button-view-result-${app.id}`}>
                        <Link href={`/my-result/${app.id}`}>
                          <Eye className="w-4 h-4 mr-2" /> View My Result
                        </Link>
                      </Button>
                      <Button asChild variant="outline" data-testid={`button-revaluation-${app.id}`}>
                        <Link href="/revaluation">
                          <RefreshCw className="w-4 h-4 mr-2" /> Apply for Revaluation
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}
