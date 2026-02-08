import { useEffect, useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ArrowLeft, User, FileText, CreditCard, Loader2, Search, Download, BarChart3, Users, CheckCircle, Clock } from "lucide-react";

export default function ViewApplications() {
  const { isAuthenticated, isAdmin, isLoading: authLoading } = useAuth();
  const { data: applications, isLoading } = useQuery<any[]>({ queryKey: ["/api/admin/applications"] });
  const { data: exams } = useQuery<any[]>({ queryKey: ["/api/exams"] });
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedExam, setSelectedExam] = useState<string>("");
  const [filterExam, setFilterExam] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const generateAdmitCards = useMutation({
    mutationFn: async (examId: string) => {
      const res = await apiRequest("POST", `/api/admin/exams/${examId}/generate-admit-cards`);
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Success", description: data.message || "Admit cards generated" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/applications"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) {
      setLocation("/login");
    }
  }, [isAuthenticated, isAdmin, authLoading, setLocation]);

  const filteredApplications = useMemo(() => {
    if (!applications) return [];
    
    let filtered = applications;
    
    if (filterExam && filterExam !== "all") {
      filtered = filtered.filter(app => app.examId?.toString() === filterExam);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(app => 
        app.candidate?.fullName?.toLowerCase().includes(query) ||
        app.candidate?.registrationNumber?.toLowerCase().includes(query) ||
        app.rollNumber?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [applications, filterExam, searchQuery]);

  const examStats = useMemo(() => {
    if (!applications || !exams) return {};
    
    const stats: Record<string, { total: number; submitted: number; admitted: number; pending: number }> = {};
    
    exams.forEach(exam => {
      const examApps = applications.filter(app => app.examId === exam.id);
      stats[exam.id] = {
        total: examApps.length,
        submitted: examApps.filter(a => a.status === 'SUBMITTED').length,
        admitted: examApps.filter(a => a.status === 'ADMIT_CARD_GENERATED').length,
        pending: examApps.filter(a => a.status === 'DRAFT' || a.status === 'PAYMENT_PENDING').length
      };
    });
    
    return stats;
  }, [applications, exams]);

  const exportToCSV = () => {
    if (!filteredApplications.length) return;
    
    const headers = ['Registration No', 'Candidate Name', 'Exam Code', 'Exam Title', 'Roll Number', 'Status', 'Applied Date'];
    const rows = filteredApplications.map(app => [
      app.candidate?.registrationNumber || '',
      app.candidate?.fullName || '',
      app.exam?.code || '',
      app.exam?.title || '',
      app.rollNumber || 'N/A',
      app.status?.replace(/_/g, ' ') || '',
      format(new Date(app.createdAt || new Date()), 'dd-MM-yyyy')
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `applications_${filterExam || 'all'}_${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 p-8">
        <div className="max-w-7xl mx-auto space-y-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-primary text-primary-foreground shadow-lg no-print">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="text-primary-foreground" data-testid="button-back-admin">
            <Link href="/admin"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <h1 className="text-xl font-bold">Manage Applications</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card data-testid="card-stat-total">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Applications</p>
                <p className="text-xl font-bold text-foreground" data-testid="text-stat-total">{applications?.length || 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card data-testid="card-stat-submitted">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Submitted</p>
                <p className="text-xl font-bold text-foreground" data-testid="text-stat-submitted">
                  {applications?.filter(a => a.status === 'SUBMITTED').length || 0}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card data-testid="card-stat-admitted">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Admit Cards Generated</p>
                <p className="text-xl font-bold text-foreground" data-testid="text-stat-admitted">
                  {applications?.filter(a => a.status === 'ADMIT_CARD_GENERATED').length || 0}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card data-testid="card-stat-pending">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-xl font-bold text-foreground" data-testid="text-stat-pending">
                  {applications?.filter(a => a.status === 'DRAFT' || a.status === 'PAYMENT_PENDING').length || 0}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {exams && exams.filter(e => e.isActive).length > 0 && (
          <Card className="mb-6 no-print">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Exam-wise Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 font-medium">Exam Code</th>
                      <th className="text-left py-2 px-3 font-medium">Exam Title</th>
                      <th className="text-center py-2 px-3 font-medium">Total</th>
                      <th className="text-center py-2 px-3 font-medium">Submitted</th>
                      <th className="text-center py-2 px-3 font-medium">Admit Cards</th>
                      <th className="text-center py-2 px-3 font-medium">Pending</th>
                      <th className="text-center py-2 px-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exams.filter(e => e.isActive).map(exam => (
                      <tr key={exam.id} className="border-b hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono">{exam.code}</td>
                        <td className="py-2 px-3">{exam.title}</td>
                        <td className="py-2 px-3 text-center">{examStats[exam.id]?.total || 0}</td>
                        <td className="py-2 px-3 text-center text-green-600">{examStats[exam.id]?.submitted || 0}</td>
                        <td className="py-2 px-3 text-center text-purple-600">{examStats[exam.id]?.admitted || 0}</td>
                        <td className="py-2 px-3 text-center text-yellow-600">{examStats[exam.id]?.pending || 0}</td>
                        <td className="py-2 px-3 text-center">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setFilterExam(exam.id.toString())}
                            data-testid={`button-filter-exam-${exam.id}`}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mb-6 flex flex-col lg:flex-row justify-between gap-4 no-print">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search by name, reg. no, or roll no..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full sm:w-[280px]"
                data-testid="input-search-applications"
              />
            </div>
            <Select value={filterExam} onValueChange={setFilterExam}>
              <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-filter-exam">
                <SelectValue placeholder="Filter by Exam" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Exams</SelectItem>
                {exams?.map(exam => (
                  <SelectItem key={exam.id} value={exam.id.toString()}>{exam.code} - {exam.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Button variant="outline" onClick={exportToCSV} disabled={!filteredApplications.length} data-testid="button-export-csv">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Select value={selectedExam} onValueChange={setSelectedExam}>
              <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-exam-generate">
                <SelectValue placeholder="Select exam" />
              </SelectTrigger>
              <SelectContent>
                {exams?.filter(e => e.isActive).map(exam => (
                  <SelectItem key={exam.id} value={exam.id.toString()}>{exam.code}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={() => selectedExam && generateAdmitCards.mutate(selectedExam)}
              disabled={!selectedExam || generateAdmitCards.isPending}
              data-testid="button-generate-admit-cards"
            >
              {generateAdmitCards.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4 mr-2" />
              )}
              Generate Admit Cards
            </Button>
          </div>
        </div>

        <Card className="mb-4">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              Showing <strong>{filteredApplications.length}</strong> of <strong>{applications?.length || 0}</strong> applications
              {filterExam && filterExam !== "all" && (
                <Button 
                  variant="link" 
                  className="px-2 py-0 h-auto" 
                  onClick={() => setFilterExam("all")}
                  data-testid="button-clear-filter"
                >
                  Clear filter
                </Button>
              )}
            </p>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {filteredApplications.map((app: any) => (
            <Card key={app.id} className="hover:shadow-md transition-shadow" data-testid={`card-application-${app.id}`}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-foreground">{app.candidate?.fullName}</h3>
                      <p className="text-sm text-muted-foreground">Reg: {app.candidate?.registrationNumber}</p>
                      <div className="flex flex-wrap gap-3 mt-2 text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <FileText className="w-4 h-4" /> {app.exam?.code} - {app.exam?.title}
                        </span>
                        {app.postCode && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            Post: {app.postCode}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <Badge className={`
                      ${app.status === 'SUBMITTED' ? 'bg-green-100 text-green-800' :
                        app.status === 'ADMIT_CARD_GENERATED' ? 'bg-purple-100 text-purple-800' :
                        app.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }
                    `}>
                      {app.status?.replace(/_/g, ' ')}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Roll: {app.rollNumber || 'N/A'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Applied: {format(new Date(app.createdAt || new Date()), 'dd MMM yyyy')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredApplications.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground">No Applications Found</h3>
                <p className="text-muted-foreground">
                  {searchQuery || (filterExam && filterExam !== "all") 
                    ? "Try adjusting your search or filter criteria." 
                    : "Applications will appear here once candidates apply."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
