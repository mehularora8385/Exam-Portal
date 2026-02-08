import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Award, ArrowLeft, Search, Download, FileText, Plus,
  CheckCircle, Clock, XCircle, Filter, RefreshCw
} from "lucide-react";
import { format } from "date-fns";

interface Certificate {
  id: number;
  applicationId: number;
  candidateId: number;
  examId: number;
  certificateNumber: string;
  certificateType: string;
  status: string;
  issuedAt: string | null;
  validUntil: string | null;
  createdAt: string;
}

interface Exam {
  id: number;
  name: string;
  code: string;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "GENERATED":
    case "ISSUED":
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" /> {status}</Badge>;
    case "PENDING":
      return <Badge variant="outline" className="text-yellow-700"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
    case "REVOKED":
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Revoked</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getTypeBadge(type: string) {
  const colors: Record<string, string> = {
    PROVISIONAL: "bg-blue-100 text-blue-800",
    MARKSHEET: "bg-green-100 text-green-800",
    MIGRATION: "bg-purple-100 text-purple-800",
    DEGREE: "bg-amber-100 text-amber-800",
    TRANSCRIPT: "bg-gray-100 text-gray-800"
  };
  return <Badge className={colors[type] || "bg-gray-100 text-gray-800"}>{type}</Badge>;
}

export default function ManageCertificates() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedExam, setSelectedExam] = useState<string>("all");
  const [bulkGenOpen, setBulkGenOpen] = useState(false);
  const [bulkExamId, setBulkExamId] = useState("");
  const [bulkType, setBulkType] = useState("PROVISIONAL");
  const { toast } = useToast();

  const { data: certificates, isLoading } = useQuery<Certificate[]>({
    queryKey: ["/api/admin/certificates"]
  });

  const { data: exams } = useQuery<Exam[]>({
    queryKey: ["/api/admin/exams"]
  });

  const bulkGenerateMutation = useMutation({
    mutationFn: async (data: { examId: number; certificateType: string; onlyPassed: boolean }) => {
      const res = await apiRequest("POST", "/api/admin/certificates/bulk-generate", data);
      return res.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: "Certificates Generated", 
        description: `Generated ${data.generated} certificates out of ${data.total} eligible candidates` 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/certificates"] });
      setBulkGenOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Generation Failed", description: error.message, variant: "destructive" });
    }
  });

  const filteredCertificates = certificates?.filter(cert => {
    const matchesSearch = cert.certificateNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || cert.certificateType === filterType;
    const matchesStatus = filterStatus === "all" || cert.status === filterStatus;
    const matchesExam = selectedExam === "all" || cert.examId.toString() === selectedExam;
    return matchesSearch && matchesType && matchesStatus && matchesExam;
  }) || [];

  const stats = {
    total: certificates?.length || 0,
    issued: certificates?.filter(c => c.status === "ISSUED").length || 0,
    generated: certificates?.filter(c => c.status === "GENERATED").length || 0,
    pending: certificates?.filter(c => c.status === "PENDING").length || 0
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
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
              <Award className="w-6 h-6" /> Certificate Management
            </h1>
            <p className="text-muted-foreground">Generate, manage, and track certificates</p>
          </div>
        </div>
        <Dialog open={bulkGenOpen} onOpenChange={setBulkGenOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-bulk-generate">
              <Plus className="w-4 h-4 mr-2" /> Bulk Generate
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bulk Generate Certificates</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Select Exam</Label>
                <Select value={bulkExamId} onValueChange={setBulkExamId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose exam" />
                  </SelectTrigger>
                  <SelectContent>
                    {exams?.map(exam => (
                      <SelectItem key={exam.id} value={exam.id.toString()}>
                        {exam.name} ({exam.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Certificate Type</Label>
                <Select value={bulkType} onValueChange={setBulkType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PROVISIONAL">Provisional Certificate</SelectItem>
                    <SelectItem value="MARKSHEET">Mark Sheet</SelectItem>
                    <SelectItem value="MIGRATION">Migration Certificate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                className="w-full"
                disabled={!bulkExamId || bulkGenerateMutation.isPending}
                onClick={() => bulkGenerateMutation.mutate({
                  examId: parseInt(bulkExamId),
                  certificateType: bulkType,
                  onlyPassed: true
                })}
                data-testid="button-confirm-bulk-generate"
              >
                {bulkGenerateMutation.isPending ? (
                  <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                ) : (
                  "Generate Certificates"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.issued}</p>
                <p className="text-sm text-muted-foreground">Issued</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Award className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.generated}</p>
                <p className="text-sm text-muted-foreground">Generated</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>All Certificates</CardTitle>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search certificate number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                  data-testid="input-search-cert"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="PROVISIONAL">Provisional</SelectItem>
                  <SelectItem value="MARKSHEET">Mark Sheet</SelectItem>
                  <SelectItem value="MIGRATION">Migration</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="GENERATED">Generated</SelectItem>
                  <SelectItem value="ISSUED">Issued</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="REVOKED">Revoked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCertificates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Award className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p>No certificates found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3">Certificate No.</th>
                    <th className="text-left p-3">Type</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Issued Date</th>
                    <th className="text-left p-3">Valid Until</th>
                    <th className="text-left p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCertificates.map((cert) => (
                    <tr key={cert.id} className="border-b hover:bg-muted/30" data-testid={`row-cert-${cert.id}`}>
                      <td className="p-3 font-mono">{cert.certificateNumber}</td>
                      <td className="p-3">{getTypeBadge(cert.certificateType)}</td>
                      <td className="p-3">{getStatusBadge(cert.status)}</td>
                      <td className="p-3">
                        {cert.issuedAt ? format(new Date(cert.issuedAt), "dd MMM yyyy") : "-"}
                      </td>
                      <td className="p-3">
                        {cert.validUntil ? format(new Date(cert.validUntil), "dd MMM yyyy") : "No Expiry"}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Link href={`/certificate/${cert.id}`}>
                            <Button variant="outline" size="sm">View</Button>
                          </Link>
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
