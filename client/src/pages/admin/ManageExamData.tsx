import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { 
  Upload, 
  Users, 
  Clock, 
  FileText, 
  Download,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Lock,
  Package
} from "lucide-react";

export default function ManageExamData() {
  const { examId } = useParams<{ examId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("candidates");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showAddShift, setShowAddShift] = useState(false);
  const [showUploadQP, setShowUploadQP] = useState(false);

  const { data: exam } = useQuery<any>({
    queryKey: [`/api/exams/${examId}`],
    enabled: !!examId
  });

  const { data: candidates = [], isLoading: candidatesLoading } = useQuery<any[]>({
    queryKey: [`/api/admin/exam-candidates/${examId}`],
    enabled: !!examId
  });

  const { data: shifts = [], isLoading: shiftsLoading } = useQuery<any[]>({
    queryKey: [`/api/admin/exam-shifts/${examId}`],
    enabled: !!examId
  });

  const { data: questionPapers = [], isLoading: qpLoading } = useQuery<any[]>({
    queryKey: [`/api/admin/question-papers/${examId}`],
    enabled: !!examId
  });

  const { data: packages = [] } = useQuery<any[]>({
    queryKey: [`/api/admin/offline-packages/${examId}`],
    enabled: !!examId
  });

  const uploadCandidatesMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch(`/api/admin/exam-candidates/${examId}/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Success", description: `${data.imported} candidates imported successfully` });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/exam-candidates/${examId}`] });
      setUploadFile(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const addShiftMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/admin/exam-shifts`, { ...data, examId: Number(examId) });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Shift added successfully" });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/exam-shifts/${examId}`] });
      setShowAddShift(false);
    }
  });

  const uploadQuestionPaperMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/admin/question-papers`, { ...data, examId: Number(examId) });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Question paper uploaded and encrypted successfully" });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/question-papers/${examId}`] });
      setShowUploadQP(false);
    }
  });

  const generatePackageMutation = useMutation({
    mutationFn: async (shiftId: number) => {
      const res = await apiRequest("POST", `/api/admin/offline-packages/generate`, { 
        examId: Number(examId), 
        shiftId 
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Offline package generated successfully" });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/offline-packages/${examId}`] });
    }
  });

  const handleFileUpload = () => {
    if (!uploadFile) return;
    const formData = new FormData();
    formData.append('file', uploadFile);
    uploadCandidatesMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto py-6 px-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Exam Data Management</h1>
            <p className="text-muted-foreground">{exam?.title || "Loading..."}</p>
          </div>
          <Button variant="outline" onClick={() => setLocation("/admin/exams")} data-testid="button-back">
            Back to Exams
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="candidates" data-testid="tab-candidates">
              <Users className="w-4 h-4 mr-2" />
              Candidates
            </TabsTrigger>
            <TabsTrigger value="shifts" data-testid="tab-shifts">
              <Clock className="w-4 h-4 mr-2" />
              Shifts
            </TabsTrigger>
            <TabsTrigger value="questions" data-testid="tab-questions">
              <FileText className="w-4 h-4 mr-2" />
              Question Papers
            </TabsTrigger>
            <TabsTrigger value="packages" data-testid="tab-packages">
              <Package className="w-4 h-4 mr-2" />
              Offline Packages
            </TabsTrigger>
          </TabsList>

          <TabsContent value="candidates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Upload Candidate Data
                </CardTitle>
                <CardDescription>
                  Upload CSV/Excel file with candidate details (Registration No, Roll No, Name, Father Name, DOB, Category, Mobile, Email)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <Input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="max-w-sm mx-auto"
                    data-testid="input-candidate-file"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Supported formats: CSV, Excel (.xlsx, .xls)
                  </p>
                </div>
                
                {uploadFile && (
                  <div className="flex items-center justify-between bg-muted p-3 rounded-lg">
                    <span>{uploadFile.name}</span>
                    <Button 
                      onClick={handleFileUpload}
                      disabled={uploadCandidatesMutation.isPending}
                      data-testid="button-upload-candidates"
                    >
                      {uploadCandidatesMutation.isPending ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload
                        </>
                      )}
                    </Button>
                  </div>
                )}

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>CSV Format</AlertTitle>
                  <AlertDescription>
                    Required columns: registration_number, roll_number, candidate_name, father_name, dob, gender, category, mobile, email
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Uploaded Candidates ({candidates.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {candidatesLoading ? (
                  <div className="text-center py-4">Loading...</div>
                ) : candidates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No candidates uploaded yet. Upload a CSV file to add candidates.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Roll No</TableHead>
                        <TableHead>Reg. No</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Father Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Shift</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {candidates.slice(0, 50).map((candidate: any) => (
                        <TableRow key={candidate.id}>
                          <TableCell className="font-mono">{candidate.rollNumber}</TableCell>
                          <TableCell>{candidate.registrationNumber}</TableCell>
                          <TableCell>{candidate.candidateName}</TableCell>
                          <TableCell>{candidate.fatherName}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{candidate.category}</Badge>
                          </TableCell>
                          <TableCell>{candidate.shiftId ? `Shift ${candidate.shiftId}` : "-"}</TableCell>
                          <TableCell>
                            {candidate.isPresent ? (
                              <Badge className="bg-green-100 text-green-700">Present</Badge>
                            ) : (
                              <Badge variant="outline">Not Marked</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                {candidates.length > 50 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Showing 50 of {candidates.length} candidates
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shifts" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Exam Shifts</CardTitle>
                  <CardDescription>Configure shifts with timings for the exam</CardDescription>
                </div>
                <Dialog open={showAddShift} onOpenChange={setShowAddShift}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-shift">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Shift
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Shift</DialogTitle>
                    </DialogHeader>
                    <ShiftForm onSubmit={(data) => addShiftMutation.mutate(data)} isPending={addShiftMutation.isPending} />
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {shiftsLoading ? (
                  <div className="text-center py-4">Loading...</div>
                ) : shifts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No shifts configured. Add shifts for the exam.
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {shifts.map((shift: any) => (
                      <Card key={shift.id} className="relative">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{shift.shiftName}</CardTitle>
                            <Badge variant={shift.status === 'COMPLETED' ? 'default' : 'outline'}>
                              {shift.status}
                            </Badge>
                          </div>
                          <CardDescription>
                            <Calendar className="w-4 h-4 inline mr-1" />
                            {new Date(shift.shiftDate).toLocaleDateString()}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-muted-foreground">Reporting:</span>
                              <p className="font-medium">{shift.reportingTime}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Gate Closing:</span>
                              <p className="font-medium">{shift.gateClosingTime || "-"}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Exam Start:</span>
                              <p className="font-medium">{shift.examStartTime}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Exam End:</span>
                              <p className="font-medium">{shift.examEndTime}</p>
                            </div>
                          </div>
                          <div className="pt-2 border-t flex items-center justify-between">
                            <span className="text-muted-foreground">
                              Duration: {shift.examDurationMinutes || 120} mins
                            </span>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => generatePackageMutation.mutate(shift.id)}
                              disabled={generatePackageMutation.isPending}
                              data-testid={`button-generate-package-${shift.id}`}
                            >
                              <Package className="w-4 h-4 mr-1" />
                              Generate Package
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="questions" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    Question Papers (Encrypted)
                  </CardTitle>
                  <CardDescription>
                    Upload question papers - they will be AES-256 encrypted for secure delivery
                  </CardDescription>
                </div>
                <Dialog open={showUploadQP} onOpenChange={setShowUploadQP}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-upload-qp">
                      <Plus className="w-4 h-4 mr-2" />
                      Upload Question Paper
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Upload Question Paper</DialogTitle>
                    </DialogHeader>
                    <QuestionPaperForm 
                      onSubmit={(data) => uploadQuestionPaperMutation.mutate(data)} 
                      isPending={uploadQuestionPaperMutation.isPending} 
                    />
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {qpLoading ? (
                  <div className="text-center py-4">Loading...</div>
                ) : questionPapers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No question papers uploaded. Upload encrypted question papers.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Paper Code</TableHead>
                        <TableHead>Paper Name</TableHead>
                        <TableHead>Language</TableHead>
                        <TableHead>Version</TableHead>
                        <TableHead>Questions</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {questionPapers.map((paper: any) => (
                        <TableRow key={paper.id}>
                          <TableCell className="font-mono">{paper.paperCode}</TableCell>
                          <TableCell>{paper.paperName}</TableCell>
                          <TableCell>{paper.language}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{paper.version}</Badge>
                          </TableCell>
                          <TableCell>{paper.totalQuestions || "-"}</TableCell>
                          <TableCell>
                            {paper.isActive ? (
                              <Badge className="bg-green-100 text-green-700">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="outline">
                                <Lock className="w-3 h-3 mr-1" />
                                Encrypted
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="ghost">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="packages" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Offline Exam Packages
                </CardTitle>
                <CardDescription>
                  Downloadable packages for exam centers (includes candidates, questions, and exam app)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {packages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No packages generated. Generate packages from the Shifts tab.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Package Code</TableHead>
                        <TableHead>Package Name</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Downloads</TableHead>
                        <TableHead>Sync Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {packages.map((pkg: any) => (
                        <TableRow key={pkg.id}>
                          <TableCell className="font-mono">{pkg.packageCode}</TableCell>
                          <TableCell>{pkg.packageName}</TableCell>
                          <TableCell>{pkg.packageSize ? `${(pkg.packageSize / 1024 / 1024).toFixed(2)} MB` : "-"}</TableCell>
                          <TableCell>
                            <Badge variant={pkg.status === 'READY' ? 'default' : 'outline'}>
                              {pkg.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{pkg.downloadCount}</TableCell>
                          <TableCell>
                            <Badge variant={pkg.syncStatus === 'SYNCED' ? 'default' : 'outline'}>
                              {pkg.syncStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" data-testid={`button-download-${pkg.id}`}>
                              <Download className="w-4 h-4 mr-1" />
                              Download
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Offline Exam Mode</AlertTitle>
              <AlertDescription>
                <p className="mb-2">When internet is not available at exam centers:</p>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Download the offline package before exam day (requires internet once)</li>
                  <li>Install the package on exam center computers</li>
                  <li>Decryption key is sent separately via SMS/email at exam time</li>
                  <li>Candidates take exam offline - responses saved locally</li>
                  <li>After exam, sync results when internet is available</li>
                </ol>
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function ShiftForm({ onSubmit, isPending }: { onSubmit: (data: any) => void; isPending: boolean }) {
  const [formData, setFormData] = useState({
    shiftNumber: 1,
    shiftName: "Morning Shift",
    shiftDate: new Date().toISOString().split('T')[0],
    reportingTime: "08:00 AM",
    gateClosingTime: "09:00 AM",
    examStartTime: "10:00 AM",
    examEndTime: "12:00 PM",
    examDurationMinutes: 120,
    totalSeats: 100
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Shift Number</Label>
          <Input
            type="number"
            value={formData.shiftNumber}
            onChange={(e) => setFormData({ ...formData, shiftNumber: Number(e.target.value) })}
            data-testid="input-shift-number"
          />
        </div>
        <div className="space-y-2">
          <Label>Shift Name</Label>
          <Input
            value={formData.shiftName}
            onChange={(e) => setFormData({ ...formData, shiftName: e.target.value })}
            data-testid="input-shift-name"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>Shift Date</Label>
        <Input
          type="date"
          value={formData.shiftDate}
          onChange={(e) => setFormData({ ...formData, shiftDate: e.target.value })}
          data-testid="input-shift-date"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Reporting Time</Label>
          <Input
            value={formData.reportingTime}
            onChange={(e) => setFormData({ ...formData, reportingTime: e.target.value })}
            placeholder="08:00 AM"
            data-testid="input-reporting-time"
          />
        </div>
        <div className="space-y-2">
          <Label>Gate Closing Time</Label>
          <Input
            value={formData.gateClosingTime}
            onChange={(e) => setFormData({ ...formData, gateClosingTime: e.target.value })}
            placeholder="09:00 AM"
            data-testid="input-gate-closing"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Exam Start Time</Label>
          <Input
            value={formData.examStartTime}
            onChange={(e) => setFormData({ ...formData, examStartTime: e.target.value })}
            placeholder="10:00 AM"
            data-testid="input-exam-start"
          />
        </div>
        <div className="space-y-2">
          <Label>Exam End Time</Label>
          <Input
            value={formData.examEndTime}
            onChange={(e) => setFormData({ ...formData, examEndTime: e.target.value })}
            placeholder="12:00 PM"
            data-testid="input-exam-end"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Duration (minutes)</Label>
          <Input
            type="number"
            value={formData.examDurationMinutes}
            onChange={(e) => setFormData({ ...formData, examDurationMinutes: Number(e.target.value) })}
            data-testid="input-duration"
          />
        </div>
        <div className="space-y-2">
          <Label>Total Seats</Label>
          <Input
            type="number"
            value={formData.totalSeats}
            onChange={(e) => setFormData({ ...formData, totalSeats: Number(e.target.value) })}
            data-testid="input-total-seats"
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isPending} data-testid="button-save-shift">
        {isPending ? "Saving..." : "Save Shift"}
      </Button>
    </form>
  );
}

function QuestionPaperForm({ onSubmit, isPending }: { onSubmit: (data: any) => void; isPending: boolean }) {
  const [formData, setFormData] = useState({
    paperCode: "",
    paperName: "",
    language: "English",
    version: "A",
    totalQuestions: 100,
    totalMarks: 200,
    negativeMarking: true,
    negativeMarkValue: "0.25",
    questionsJson: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Paper Code</Label>
          <Input
            value={formData.paperCode}
            onChange={(e) => setFormData({ ...formData, paperCode: e.target.value })}
            placeholder="SSC-CGL-2026-T1"
            data-testid="input-paper-code"
          />
        </div>
        <div className="space-y-2">
          <Label>Paper Name</Label>
          <Input
            value={formData.paperName}
            onChange={(e) => setFormData({ ...formData, paperName: e.target.value })}
            placeholder="Tier-1 General Awareness"
            data-testid="input-paper-name"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Language</Label>
          <Select value={formData.language} onValueChange={(v) => setFormData({ ...formData, language: v })}>
            <SelectTrigger data-testid="select-language">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="English">English</SelectItem>
              <SelectItem value="Hindi">Hindi</SelectItem>
              <SelectItem value="Bilingual">Bilingual</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Version/Set</Label>
          <Select value={formData.version} onValueChange={(v) => setFormData({ ...formData, version: v })}>
            <SelectTrigger data-testid="select-version">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="A">Set A</SelectItem>
              <SelectItem value="B">Set B</SelectItem>
              <SelectItem value="C">Set C</SelectItem>
              <SelectItem value="D">Set D</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Total Questions</Label>
          <Input
            type="number"
            value={formData.totalQuestions}
            onChange={(e) => setFormData({ ...formData, totalQuestions: Number(e.target.value) })}
            data-testid="input-total-questions"
          />
        </div>
        <div className="space-y-2">
          <Label>Total Marks</Label>
          <Input
            type="number"
            value={formData.totalMarks}
            onChange={(e) => setFormData({ ...formData, totalMarks: Number(e.target.value) })}
            data-testid="input-total-marks"
          />
        </div>
        <div className="space-y-2">
          <Label>Negative Marking</Label>
          <Input
            value={formData.negativeMarkValue}
            onChange={(e) => setFormData({ ...formData, negativeMarkValue: e.target.value })}
            placeholder="0.25"
            data-testid="input-negative-mark"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Questions JSON</Label>
        <Textarea
          rows={8}
          value={formData.questionsJson}
          onChange={(e) => setFormData({ ...formData, questionsJson: e.target.value })}
          placeholder='[{"id": "q1", "question": "...", "options": ["A", "B", "C", "D"], "answer": "A", "marks": 2}]'
          className="font-mono text-sm"
          data-testid="input-questions-json"
        />
        <p className="text-xs text-muted-foreground">
          JSON array of questions. Will be encrypted with AES-256 before storage.
        </p>
      </div>

      <Alert>
        <Lock className="h-4 w-4" />
        <AlertTitle>Encryption Notice</AlertTitle>
        <AlertDescription>
          Questions will be encrypted using AES-256. The decryption key will be sent separately at exam time.
        </AlertDescription>
      </Alert>

      <Button type="submit" className="w-full" disabled={isPending} data-testid="button-upload-paper">
        {isPending ? "Encrypting & Uploading..." : "Encrypt & Upload Paper"}
      </Button>
    </form>
  );
}
