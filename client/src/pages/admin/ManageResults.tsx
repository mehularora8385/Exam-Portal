import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Trophy, Trash2, Edit, ArrowLeft, Upload, FileUp, CheckCircle } from "lucide-react";
import type { Exam, ExamResult } from "@shared/schema";

export default function ManageResults() {
  const { toast } = useToast();
  const params = useParams<{ examId?: string }>();
  const [selectedExamId, setSelectedExamId] = useState(params.examId || "");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [bulkCsv, setBulkCsv] = useState("");
  const [editingResult, setEditingResult] = useState<ExamResult | null>(null);
  const [formData, setFormData] = useState({
    rollNumber: "",
    candidateName: "",
    fatherName: "",
    category: "",
    obtainedMarks: "",
    totalMarks: "",
    percentage: "",
    rank: "",
    status: "PENDING",
    remarks: "",
    stage: "TIER1",
  });

  const { data: exams } = useQuery<Exam[]>({ queryKey: ["/api/exams"] });
  const { data: results, isLoading } = useQuery<ExamResult[]>({ 
    queryKey: ["/api/admin/exams", selectedExamId, "results"],
    enabled: !!selectedExamId,
  });

  const selectedExam = exams?.find(e => e.id === Number(selectedExamId));

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", `/api/admin/exams/${selectedExamId}/results`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/exams", selectedExamId, "results"] });
      toast({ title: "Result added successfully" });
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to add result", variant: "destructive" });
    }
  });

  const bulkUploadMutation = useMutation({
    mutationFn: async (results: any[]) => {
      return await apiRequest("POST", `/api/admin/exams/${selectedExamId}/results/bulk`, { results });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/exams", selectedExamId, "results"] });
      toast({ title: `${data.count} results uploaded successfully` });
      setBulkCsv("");
      setIsBulkDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to upload results", variant: "destructive" });
    }
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/admin/exams/${selectedExamId}/results/publish`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/exams", selectedExamId, "results"] });
      queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
      toast({ title: "Results published successfully" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/results/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exams", selectedExamId, "results"] });
      toast({ title: "Result deleted" });
    }
  });

  const resetForm = () => {
    setFormData({
      rollNumber: "",
      candidateName: "",
      fatherName: "",
      category: "",
      obtainedMarks: "",
      totalMarks: "",
      percentage: "",
      rank: "",
      status: "PENDING",
      remarks: "",
      stage: "TIER1",
    });
    setEditingResult(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = () => {
    const data = {
      ...formData,
      obtainedMarks: formData.obtainedMarks ? Number(formData.obtainedMarks) : null,
      totalMarks: formData.totalMarks ? Number(formData.totalMarks) : null,
      rank: formData.rank ? Number(formData.rank) : null,
    };
    createMutation.mutate(data);
  };

  const handleBulkUpload = () => {
    try {
      const lines = bulkCsv.trim().split("\n");
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
      
      const results = lines.slice(1).map(line => {
        const values = line.split(",").map(v => v.trim());
        const result: any = { stage: "TIER1", status: "PENDING" };
        
        headers.forEach((header, idx) => {
          const value = values[idx] || "";
          if (header === "rollnumber" || header === "roll_number" || header === "roll") result.rollNumber = value;
          else if (header === "name" || header === "candidatename" || header === "candidate_name") result.candidateName = value;
          else if (header === "fathername" || header === "father_name" || header === "father") result.fatherName = value;
          else if (header === "category") result.category = value;
          else if (header === "obtained" || header === "obtainedmarks" || header === "obtained_marks" || header === "marks") result.obtainedMarks = Number(value) || null;
          else if (header === "total" || header === "totalmarks" || header === "total_marks") result.totalMarks = Number(value) || null;
          else if (header === "percentage" || header === "percent") result.percentage = value;
          else if (header === "rank") result.rank = Number(value) || null;
          else if (header === "status") result.status = value.toUpperCase();
          else if (header === "remarks") result.remarks = value;
        });
        
        return result;
      }).filter(r => r.rollNumber);

      if (results.length === 0) {
        toast({ title: "No valid results found in CSV", variant: "destructive" });
        return;
      }

      bulkUploadMutation.mutate(results);
    } catch (error) {
      toast({ title: "Invalid CSV format", variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "QUALIFIED": return <Badge className="bg-green-600">Qualified</Badge>;
      case "NOT_QUALIFIED": return <Badge variant="destructive">Not Qualified</Badge>;
      case "ABSENT": return <Badge variant="secondary">Absent</Badge>;
      case "DISQUALIFIED": return <Badge variant="destructive">Disqualified</Badge>;
      default: return <Badge variant="outline">Pending</Badge>;
    }
  };

  const publishedCount = results?.filter(r => r.isPublished).length || 0;
  const totalCount = results?.length || 0;

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
                <h1 className="text-2xl font-bold text-primary" data-testid="text-results-title">
                  Manage Results
                </h1>
                <p className="text-muted-foreground">Upload and publish exam results</p>
              </div>
            </div>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Select Exam</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                <SelectTrigger className="w-full md:w-96" data-testid="select-exam">
                  <SelectValue placeholder="Select an exam to manage results" />
                </SelectTrigger>
                <SelectContent>
                  {exams?.map(exam => (
                    <SelectItem key={exam.id} value={String(exam.id)}>
                      {exam.title} ({exam.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {selectedExamId && (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="text-sm">
                    {totalCount} Results
                  </Badge>
                  {publishedCount > 0 && (
                    <Badge className="bg-green-600">{publishedCount} Published</Badge>
                  )}
                  {selectedExam?.resultDeclared && (
                    <Badge className="bg-primary">Results Declared</Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" data-testid="button-bulk-upload">
                        <FileUp className="w-4 h-4 mr-2" /> Bulk Upload
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Bulk Upload Results</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div className="p-3 bg-muted rounded-lg text-sm">
                          <p className="font-medium mb-2">CSV Format:</p>
                          <code className="text-xs block overflow-x-auto">rollNumber,candidateName,fatherName,category,obtainedMarks,totalMarks,percentage,rank,status</code>
                          <p className="mt-2 text-muted-foreground">Status options: QUALIFIED, NOT_QUALIFIED, ABSENT, DISQUALIFIED</p>
                        </div>
                        
                        <div className="border-2 border-dashed rounded-lg p-4 text-center">
                          <input
                            type="file"
                            accept=".csv,.txt"
                            className="hidden"
                            id="csv-file-upload"
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
                          <label htmlFor="csv-file-upload" className="cursor-pointer">
                            <FileUp className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm font-medium">Click to upload CSV file</p>
                            <p className="text-xs text-muted-foreground">or paste data below</p>
                          </label>
                        </div>

                        <Textarea 
                          placeholder="Or paste CSV data here...&#10;rollNumber,candidateName,fatherName,category,obtainedMarks,totalMarks,percentage,rank,status&#10;CGL-2024-001234,John Doe,Ram Doe,GEN,150,200,75%,1,QUALIFIED"
                          rows={8}
                          value={bulkCsv}
                          onChange={(e) => setBulkCsv(e.target.value)}
                          className="font-mono text-sm"
                          data-testid="input-bulk-csv"
                        />
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsBulkDialogOpen(false)}>Cancel</Button>
                          <Button 
                            onClick={handleBulkUpload}
                            disabled={!bulkCsv.trim() || bulkUploadMutation.isPending}
                            data-testid="button-upload-csv"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            {bulkUploadMutation.isPending ? "Uploading..." : "Upload Results"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => resetForm()} data-testid="button-add-result">
                        <Plus className="w-4 h-4 mr-2" /> Add Result
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Result</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Roll Number *</Label>
                            <Input 
                              value={formData.rollNumber}
                              onChange={(e) => setFormData({...formData, rollNumber: e.target.value})}
                              data-testid="input-roll"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Candidate Name</Label>
                            <Input 
                              value={formData.candidateName}
                              onChange={(e) => setFormData({...formData, candidateName: e.target.value})}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Father's Name</Label>
                            <Input 
                              value={formData.fatherName}
                              onChange={(e) => setFormData({...formData, fatherName: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Category</Label>
                            <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="GEN">General</SelectItem>
                                <SelectItem value="OBC">OBC</SelectItem>
                                <SelectItem value="SC">SC</SelectItem>
                                <SelectItem value="ST">ST</SelectItem>
                                <SelectItem value="EWS">EWS</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Obtained Marks</Label>
                            <Input 
                              type="number"
                              value={formData.obtainedMarks}
                              onChange={(e) => setFormData({...formData, obtainedMarks: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Total Marks</Label>
                            <Input 
                              type="number"
                              value={formData.totalMarks}
                              onChange={(e) => setFormData({...formData, totalMarks: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Rank</Label>
                            <Input 
                              type="number"
                              value={formData.rank}
                              onChange={(e) => setFormData({...formData, rank: e.target.value})}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Status</Label>
                          <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PENDING">Pending</SelectItem>
                              <SelectItem value="QUALIFIED">Qualified</SelectItem>
                              <SelectItem value="NOT_QUALIFIED">Not Qualified</SelectItem>
                              <SelectItem value="ABSENT">Absent</SelectItem>
                              <SelectItem value="DISQUALIFIED">Disqualified</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                          <Button variant="outline" onClick={resetForm}>Cancel</Button>
                          <Button 
                            onClick={handleSubmit}
                            disabled={!formData.rollNumber || createMutation.isPending}
                          >
                            Add Result
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {totalCount > 0 && !selectedExam?.resultDeclared && (
                    <Button 
                      onClick={() => publishMutation.mutate()}
                      disabled={publishMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                      data-testid="button-publish-results"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {publishMutation.isPending ? "Publishing..." : "Publish Results"}
                    </Button>
                  )}
                </div>
              </div>

              {isLoading ? (
                <div className="text-center py-12">Loading results...</div>
              ) : results && results.length > 0 ? (
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Roll Number</TableHead>
                        <TableHead>Candidate Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Marks</TableHead>
                        <TableHead>Rank</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Published</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.map(result => (
                        <TableRow key={result.id} data-testid={`result-${result.id}`}>
                          <TableCell className="font-mono">{result.rollNumber}</TableCell>
                          <TableCell>{result.candidateName || "-"}</TableCell>
                          <TableCell>{result.category || "-"}</TableCell>
                          <TableCell>{result.obtainedMarks ?? "-"}/{result.totalMarks ?? "-"}</TableCell>
                          <TableCell>{result.rank || "-"}</TableCell>
                          <TableCell>{getStatusBadge(result.status || "PENDING")}</TableCell>
                          <TableCell>
                            {result.isPublished ? (
                              <Badge className="bg-green-600">Yes</Badge>
                            ) : (
                              <Badge variant="outline">No</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => deleteMutation.mutate(result.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              ) : (
                <Card className="py-12">
                  <CardContent className="text-center">
                    <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Results Uploaded</h3>
                    <p className="text-muted-foreground mb-4">Upload results manually or use bulk CSV upload</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
