import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useApplications } from "@/hooks/use-applications";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Download, Calendar, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Applications() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: applications, isLoading } = useApplications();
  const [_, setLocation] = useLocation();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, authLoading, setLocation]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="container-custom py-10">
          <Skeleton className="h-10 w-48 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      <main className="container-custom py-10 flex-1">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <h1 className="text-3xl font-display font-bold text-primary">My Applications</h1>
        </div>

        {applications && applications.length > 0 ? (
          <div className="space-y-4">
            {applications.map((app: any) => (
              <Card key={app.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        app.status === 'SUBMITTED' ? 'bg-green-100 text-green-600' :
                        app.status === 'ADMIT_CARD_GENERATED' ? 'bg-purple-100 text-purple-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-foreground">
                          {app.exam?.title || `Exam ID: ${app.examId}`}
                        </h3>
                        <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Applied: {format(new Date(app.createdAt || new Date()), 'dd MMM yyyy')}
                          </span>
                          {app.rollNumber && (
                            <span className="font-mono bg-slate-100 px-2 py-0.5 rounded">
                              Roll: {app.rollNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <Badge className={`
                        ${app.status === 'SUBMITTED' ? 'bg-green-100 text-green-800 border-green-200' :
                          app.status === 'ADMIT_CARD_GENERATED' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                          app.status === 'REJECTED' ? 'bg-red-100 text-red-800 border-red-200' :
                          'bg-gray-100 text-gray-800 border-gray-200'
                        }
                      `}>
                        {app.status?.replace(/_/g, ' ')}
                      </Badge>

                      {(app.admitCardGenerated || app.status === 'APPROVED' || app.status === 'ADMIT_CARD_GENERATED') && (
                        <Button size="sm" className="gap-2" asChild data-testid={`button-admit-card-${app.id}`}>
                          <Link href={`/admit-card/${app.id}`}>
                            <Download className="w-4 h-4" /> View Admit Card
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-16">
            <CardContent>
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No Applications Yet</h3>
              <p className="text-muted-foreground mb-6">You haven't applied for any exams yet.</p>
              <Button asChild>
                <Link href="/exams">Browse Live Exams</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
}
