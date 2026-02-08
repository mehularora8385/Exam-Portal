import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { IdCard, ArrowLeft, Download, CheckCircle, Search, RefreshCw, Upload, FileSpreadsheet } from "lucide-react";
import type { Exam, Application } from "@shared/schema";

export default function ManageAdmitCards() {
  const { toast } = useToast();
  const [selectedExamId, setSelectedExamId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [bulkCsv, setBulkCsv] = useState("");

  const { data: exams } = useQuery<Exam[]>({ queryKey: ["/api/exams"] });
  const { data: applications, isLoading } = useQuery<any[]>({ 
    queryKey: ["/api/admin/applications"],
  });

  const bulkGenerateCsvMutation = useMutation({
    mutationFn: async (candidates: any[]) => {
      return await apiRequest("POST", `/api/admin/exams/${selectedExamId}/generate-admit-cards-bulk`, { candidates });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/applications"] });
      toast({ title: `Generated ${data.count} admit cards from CSV` });
      setBulkCsv("");
      setIsBulkDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to process CSV", variant: "destructive" });
    }
  });

  const handleBulkCsvUpload = () => {
    const lines = bulkCsv.trim().split('\n');
    if (lines.length < 2) {
      toast({ title: "CSV must have header and at least one data row", variant: "destructive" });
      return;
    }
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    const rollIdx = headers.indexOf('rollnumber');
    const centerIdx = headers.indexOf('center');
    const venueIdx = headers.indexOf('venue');
    
    if (rollIdx === -1) {
      toast({ title: "CSV must have 'rollNumber' column", variant: "destructive" });
      return;
    }

    const candidates = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim());
      if (cols[rollIdx]) {
        candidates.push({
          rollNumber: cols[rollIdx],
          center: centerIdx !== -1 ? cols[centerIdx] : (venueIdx !== -1 ? cols[venueIdx] : ''),
        });
      }
    }

    if (candidates.length === 0) {
      toast({ title: "No valid candidates found in CSV", variant: "destructive" });
      return;
    }

    bulkGenerateCsvMutation.mutate(candidates);
  };

  const generateMutation = useMutation({
    mutationFn: async (applicationId: number) => {
      return await apiRequest("POST", `/api/admin/applications/${applicationId}/generate-admit-card`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/applications"] });
      toast({ title: "Admit card generated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to generate admit card", variant: "destructive" });
    }
  });

  const generateBulkMutation = useMutation({
    mutationFn: async (examId: number) => {
      return await apiRequest("POST", `/api/admin/exams/${examId}/generate-admit-cards`);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/applications"] });
      toast({ title: `Generated ${data.count} admit cards` });
    },
    onError: () => {
      toast({ title: "Failed to generate admit cards", variant: "destructive" });
    }
  });

  const filteredApplications = applications?.filter(app => {
    const matchesExam = !selectedExamId || selectedExamId === "all" || app.exam?.id === Number(selectedExamId);
    const matchesSearch = !searchTerm || 
      app.candidate?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.candidate?.registrationNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const isSubmitted = app.status === "SUBMITTED";
    return matchesExam && matchesSearch && isSubmitted;
  }) || [];

  const generatedCount = filteredApplications.filter(a => a.admitCardGenerated).length;
  const pendingCount = filteredApplications.length - generatedCount;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/admin"><ArrowLeft className="w-5 h-5" /></Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-primary" data-testid="text-admit-cards-title">
                  Manage Admit Cards
                </h1>
                <p className="text-muted-foreground">Generate and manage admit cards for candidates</p>
              </div>
            </div>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filter Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Label className="mb-2 block">Select Exam</Label>
                  <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                    <SelectTrigger data-testid="select-exam">
                      <SelectValue placeholder="All exams" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Exams</SelectItem>
                      {exams?.map(exam => (
                        <SelectItem key={exam.id} value={String(exam.id)}>
                          {exam.title} ({exam.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label className="mb-2 block">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search by name or roll number..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                      data-testid="input-search"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-sm">
                {filteredApplications.length} Submitted Applications
              </Badge>
              <Badge className="bg-green-600">{generatedCount} Generated</Badge>
              <Badge variant="secondary">{pendingCount} Pending</Badge>
            </div>
            <div className="flex gap-2">
              {selectedExamId && selectedExamId !== "all" && (
                <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" data-testid="button-bulk-csv">
                      <FileSpreadsheet className="w-4 h-4 mr-2" /> Bulk CSV Upload
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Bulk Admit Card Generation via CSV</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="p-4 bg-muted rounded-lg text-sm">
                        <p className="font-medium mb-2">CSV Format:</p>
                        <code className="block bg-background p-2 rounded text-xs">
                          rollNumber,center<br/>
                          CGL-2024-001234,New Delhi<br/>
                          CGL-2024-001235,Mumbai
                        </code>
                        <p className="mt-2 text-muted-foreground">
                          Required column: rollNumber. Optional: center (or venue)
                        </p>
                      </div>
                      
                      <div className="border-2 border-dashed rounded-lg p-4 text-center">
                        <input
                          type="file"
                          accept=".csv,.txt"
                          className="hidden"
                          id="admit-csv-file-upload"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                setBulkCsv(event.target?.result as string || "");
                              };
                              reader.readAsText(file);
                            }
                          }}
                          data-testid="input-file-csv"
                        />
                        <label htmlFor="admit-csv-file-upload" className="cursor-pointer">
                          <FileSpreadsheet className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm font-medium">Click to upload CSV file</p>
                          <p className="text-xs text-muted-foreground">or paste data below</p>
                        </label>
                      </div>

                      <div>
                        <Label>Or Paste CSV Data</Label>
                        <Textarea 
                          value={bulkCsv}
                          onChange={(e) => setBulkCsv(e.target.value)}
                          rows={8}
                          placeholder="rollNumber,center&#10;CGL-2024-001234,New Delhi&#10;CGL-2024-001235,Mumbai"
                          className="font-mono text-sm"
                          data-testid="textarea-bulk-csv"
                        />
                      </div>
                      <Button 
                        onClick={handleBulkCsvUpload}
                        disabled={!bulkCsv.trim() || bulkGenerateCsvMutation.isPending}
                        className="w-full"
                        data-testid="button-process-csv"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {bulkGenerateCsvMutation.isPending ? "Processing..." : "Process CSV & Generate Admit Cards"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              {selectedExamId && selectedExamId !== "all" && pendingCount > 0 && (
                <Button 
                  onClick={() => generateBulkMutation.mutate(Number(selectedExamId))}
                  disabled={generateBulkMutation.isPending}
                  data-testid="button-generate-all"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${generateBulkMutation.isPending ? 'animate-spin' : ''}`} />
                  Generate All ({pendingCount})
                </Button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12">Loading applications...</div>
          ) : filteredApplications.length > 0 ? (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Roll Number</TableHead>
                    <TableHead>Candidate Name</TableHead>
                    <TableHead>Exam</TableHead>
                    <TableHead>Center</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.map(app => (
                    <TableRow key={app.id} data-testid={`app-${app.id}`}>
                      <TableCell className="font-mono">{app.rollNumber || "Not Generated"}</TableCell>
                      <TableCell>{app.candidate?.fullName || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{app.exam?.code}</Badge>
                      </TableCell>
                      <TableCell>{app.allocatedCenter || app.preferredCenters?.[0] || "-"}</TableCell>
                      <TableCell>
                        {app.admitCardGenerated ? (
                          <Badge className="bg-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" /> Generated
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {!app.admitCardGenerated ? (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => generateMutation.mutate(app.id)}
                              disabled={generateMutation.isPending}
                            >
                              Generate
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" asChild>
                              <Link href={`/admit-card/${app.id}`}>
                                <Download className="w-4 h-4 mr-1" /> View
                              </Link>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <Card className="py-12">
              <CardContent className="text-center">
                <IdCard className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Submitted Applications</h3>
                <p className="text-muted-foreground">
                  Admit cards can only be generated for submitted applications
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
