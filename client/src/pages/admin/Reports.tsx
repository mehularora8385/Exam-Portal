import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BarChart3, ArrowLeft, Download, FileSpreadsheet, Users, 
  BookOpen, FileText, Award, Wallet, TrendingUp, Calendar,
  PieChart, Activity
} from "lucide-react";
import { format } from "date-fns";

interface Exam {
  id: number;
  name: string;
  code: string;
  status: string;
}

interface Application {
  id: number;
  applicationNumber: string;
  status: string;
  submittedAt: string | null;
  postCode?: string;
  examId: number;
}

interface ExamResult {
  id: number;
  candidateId: number;
  examId: number;
  status: string;
  totalMarks: number | null;
  obtainedMarks: number | null;
}

interface RevaluationRequest {
  id: number;
  status: string;
  paymentStatus: string;
  feeAmount: number;
}

interface Certificate {
  id: number;
  certificateType: string;
  status: string;
}

interface PaymentTransaction {
  id: number;
  amount: number;
  status: string;
  paymentType: string;
  createdAt: string;
}

function getDateRangeFilter(range: string): Date | null {
  const now = new Date();
  switch (range) {
    case "today":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case "week":
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return weekAgo;
    case "month":
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case "quarter":
      const quarterStart = new Date(now);
      quarterStart.setMonth(quarterStart.getMonth() - 3);
      return quarterStart;
    case "year":
      return new Date(now.getFullYear(), 0, 1);
    default:
      return null;
  }
}

function isInDateRange(dateStr: string | null | undefined, minDate: Date | null): boolean {
  if (!minDate) return true;
  if (!dateStr) return false;
  return new Date(dateStr) >= minDate;
}

export default function Reports() {
  const [selectedExam, setSelectedExam] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("all");

  const { data: exams, isLoading: examsLoading } = useQuery<Exam[]>({
    queryKey: ["/api/admin/exams"]
  });

  const { data: applications } = useQuery<Application[]>({
    queryKey: ["/api/admin/applications"]
  });

  const { data: results } = useQuery<ExamResult[]>({
    queryKey: ["/api/admin/all-results"]
  });

  const { data: revaluations } = useQuery<RevaluationRequest[]>({
    queryKey: ["/api/admin/revaluations"]
  });

  const { data: certificates } = useQuery<Certificate[]>({
    queryKey: ["/api/admin/certificates"]
  });

  const { data: payments } = useQuery<PaymentTransaction[]>({
    queryKey: ["/api/admin/payments"]
  });

  const minDate = getDateRangeFilter(dateRange);

  const filteredApplications = applications?.filter(app => {
    const matchesExam = selectedExam === "all" || app.examId.toString() === selectedExam;
    const matchesDate = isInDateRange(app.submittedAt, minDate);
    return matchesExam && matchesDate;
  }) || [];

  const filteredPayments = payments?.filter(p => isInDateRange(p.createdAt, minDate)) || [];

  const stats = {
    totalApplications: filteredApplications.length,
    submittedApplications: filteredApplications.filter(a => a.status === "SUBMITTED" || a.status === "APPROVED").length,
    pendingApplications: filteredApplications.filter(a => a.status === "PENDING" || a.status === "DRAFT").length,
    rejectedApplications: filteredApplications.filter(a => a.status === "REJECTED").length,
    totalResults: results?.length || 0,
    passedCandidates: results?.filter(r => r.status === "PASS" || r.status === "QUALIFIED").length || 0,
    failedCandidates: results?.filter(r => r.status === "FAIL" || r.status === "NOT_QUALIFIED").length || 0,
    totalRevaluations: revaluations?.length || 0,
    pendingRevaluations: revaluations?.filter(r => r.status === "PENDING").length || 0,
    totalCertificates: certificates?.length || 0,
    issuedCertificates: certificates?.filter(c => c.status === "ISSUED" || c.status === "GENERATED").length || 0,
    totalPayments: filteredPayments.length,
    successfulPayments: filteredPayments.filter(p => p.status === "SUCCESS").length,
    totalRevenue: filteredPayments.filter(p => p.status === "SUCCESS").reduce((sum, p) => sum + (p.amount || 0), 0)
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) return;
    
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(row => Object.values(row).map(v => 
      typeof v === "string" && v.includes(",") ? `"${v}"` : v
    ).join(","));
    const csv = [headers, ...rows].join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportApplicationsReport = () => {
    const exportData = filteredApplications.map(app => ({
      ApplicationNumber: app.applicationNumber,
      Status: app.status,
      SubmittedAt: app.submittedAt ? format(new Date(app.submittedAt), "dd/MM/yyyy") : "",
      PostCode: app.postCode || ""
    }));
    exportToCSV(exportData, "applications_report");
  };

  const exportResultsReport = () => {
    const exportData = (results || []).map(r => ({
      CandidateId: r.candidateId,
      ExamId: r.examId,
      Status: r.status,
      TotalMarks: r.totalMarks || "",
      ObtainedMarks: r.obtainedMarks || ""
    }));
    exportToCSV(exportData, "results_report");
  };

  const exportPaymentsReport = () => {
    const exportData = filteredPayments.map(p => ({
      Amount: p.amount,
      Status: p.status,
      Type: p.paymentType,
      Date: p.createdAt ? format(new Date(p.createdAt), "dd/MM/yyyy") : ""
    }));
    exportToCSV(exportData, "payments_report");
  };

  if (examsLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="w-6 h-6" /> MIS Reports & Analytics
            </h1>
            <p className="text-muted-foreground">Comprehensive examination statistics and reports</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <Select value={selectedExam} onValueChange={setSelectedExam}>
          <SelectTrigger className="w-64" data-testid="select-exam-filter">
            <SelectValue placeholder="Select Exam" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Exams</SelectItem>
            {exams?.map(exam => (
              <SelectItem key={exam.id} value={exam.id.toString()}>
                {exam.name} ({exam.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-48">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Time Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-3xl font-bold">{stats.totalApplications}</p>
                <p className="text-sm text-muted-foreground">Total Applications</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-3xl font-bold">{stats.passedCandidates}</p>
                <p className="text-sm text-muted-foreground">Qualified Candidates</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-3xl font-bold">{stats.issuedCertificates}</p>
                <p className="text-sm text-muted-foreground">Certificates Issued</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 rounded-lg">
                <Wallet className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-3xl font-bold">Rs.{(stats.totalRevenue / 100).toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" /> Application Status
                </CardTitle>
                <CardDescription>Distribution of application statuses</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={exportApplicationsReport} data-testid="button-export-applications">
                <Download className="w-4 h-4 mr-2" /> Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  Submitted/Approved
                </span>
                <Badge className="bg-green-100 text-green-800">{stats.submittedApplications}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                  Pending/Draft
                </span>
                <Badge className="bg-yellow-100 text-yellow-800">{stats.pendingApplications}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  Rejected
                </span>
                <Badge className="bg-red-100 text-red-800">{stats.rejectedApplications}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" /> Result Statistics
                </CardTitle>
                <CardDescription>Examination result breakdown</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={exportResultsReport} data-testid="button-export-results">
                <Download className="w-4 h-4 mr-2" /> Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span>Total Results Declared</span>
                <Badge variant="outline">{stats.totalResults}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  Passed/Qualified
                </span>
                <Badge className="bg-green-100 text-green-800">{stats.passedCandidates}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  Failed/Not Qualified
                </span>
                <Badge className="bg-red-100 text-red-800">{stats.failedCandidates}</Badge>
              </div>
              {stats.totalResults > 0 && (
                <div className="text-center pt-2 border-t">
                  <p className="text-2xl font-bold text-green-600">
                    {((stats.passedCandidates / stats.totalResults) * 100).toFixed(1)}%
                  </p>
                  <p className="text-sm text-muted-foreground">Pass Rate</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" /> Revaluation Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Requests</span>
                <span className="font-semibold">{stats.totalRevaluations}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pending</span>
                <Badge variant="outline" className="text-yellow-700">{stats.pendingRevaluations}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Processed</span>
                <span className="font-semibold">{stats.totalRevaluations - stats.pendingRevaluations}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" /> Certificate Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Generated</span>
                <span className="font-semibold">{stats.totalCertificates}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Issued</span>
                <Badge className="bg-green-100 text-green-800">{stats.issuedCertificates}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pending</span>
                <span className="font-semibold">{stats.totalCertificates - stats.issuedCertificates}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5" /> Payment Summary
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={exportPaymentsReport} data-testid="button-export-payments">
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Transactions</span>
                <span className="font-semibold">{stats.totalPayments}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Successful</span>
                <Badge className="bg-green-100 text-green-800">{stats.successfulPayments}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Revenue</span>
                <span className="font-bold text-green-600">Rs.{(stats.totalRevenue / 100).toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" /> Quick Export Reports
          </CardTitle>
          <CardDescription>Download detailed reports in CSV format</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-auto py-4 flex flex-col gap-2"
              onClick={exportApplicationsReport}
              data-testid="button-quick-export-applications"
            >
              <FileText className="w-6 h-6 text-blue-600" />
              <span>Applications Report</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-4 flex flex-col gap-2"
              onClick={exportResultsReport}
              data-testid="button-quick-export-results"
            >
              <Activity className="w-6 h-6 text-green-600" />
              <span>Results Report</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-4 flex flex-col gap-2"
              onClick={exportPaymentsReport}
              data-testid="button-quick-export-payments"
            >
              <Wallet className="w-6 h-6 text-amber-600" />
              <span>Payments Report</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-4 flex flex-col gap-2"
              onClick={() => {
                const examData = (exams || []).map(e => ({
                  Code: e.code,
                  Name: e.name,
                  Status: e.status
                }));
                exportToCSV(examData, "exams_report");
              }}
              data-testid="button-quick-export-exams"
            >
              <BookOpen className="w-6 h-6 text-purple-600" />
              <span>Exams Report</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
