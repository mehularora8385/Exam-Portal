import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Shield, Monitor, Users, FileText, Upload, Download, Key, 
  Plus, RefreshCw, LogOut, Building2, Clock, CheckCircle2, 
  AlertCircle, Lock, Eye, Trash2, Edit, Settings, Image, Camera,
  Search, Filter, FileSpreadsheet, BarChart3, Calendar, MapPin
} from "lucide-react";
import readXlsxFile from "read-excel-file";

export default function SEBAdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("exams");
  const [showCreateExam, setShowCreateExam] = useState(false);
  const [showUploadCenter, setShowUploadCenter] = useState(false);
  const [showUploadStudents, setShowUploadStudents] = useState(false);
  const [showCreateQP, setShowCreateQP] = useState(false);
  
  // Filter states
  const [examSearch, setExamSearch] = useState("");
  const [examStatusFilter, setExamStatusFilter] = useState("all");
  const [centerSearch, setCenterSearch] = useState("");
  const [centerCityFilter, setCenterCityFilter] = useState("all");
  const [studentSearch, setStudentSearch] = useState("");
  const [studentExamFilter, setStudentExamFilter] = useState("all");
  const [studentCenterFilter, setStudentCenterFilter] = useState("all");
  
  // Selection states for bulk operations
  const [selectedExams, setSelectedExams] = useState<number[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);

  // Check SEB admin session
  const { data: sessionData, isLoading: sessionLoading } = useQuery({
    queryKey: ["/api/seb-admin/session"],
    queryFn: async () => {
      const res = await fetch("/api/seb-admin/session");
      if (!res.ok) throw new Error("Not authenticated");
      return res.json();
    },
  });

  // Fetch SEB exams
  const { data: examsData, isLoading: examsLoading } = useQuery({
    queryKey: ["/api/seb-admin/exams"],
    queryFn: async () => {
      const res = await fetch("/api/seb-admin/exams");
      return res.json();
    },
    enabled: !!sessionData?.authenticated,
  });

  // Fetch centers
  const { data: centersData } = useQuery({
    queryKey: ["/api/seb-admin/centers"],
    queryFn: async () => {
      const res = await fetch("/api/seb-admin/centers");
      return res.json();
    },
    enabled: !!sessionData?.authenticated,
  });

  // Fetch students
  const { data: studentsData } = useQuery({
    queryKey: ["/api/seb-admin/students"],
    queryFn: async () => {
      const res = await fetch("/api/seb-admin/students");
      return res.json();
    },
    enabled: !!sessionData?.authenticated,
  });

  // Fetch question papers
  const { data: qpData } = useQuery({
    queryKey: ["/api/seb-admin/question-papers"],
    queryFn: async () => {
      const res = await fetch("/api/seb-admin/question-papers");
      return res.json();
    },
    enabled: !!sessionData?.authenticated,
  });

  const handleLogout = async () => {
    await apiRequest("POST", "/api/seb-admin/logout", {});
    setLocation("/seb-admin/login");
  };

  // Bulk operations mutations
  const bulkExamMutation = useMutation({
    mutationFn: async ({ action, ids }: { action: "activate" | "deactivate" | "delete"; ids: number[] }) => {
      const res = await apiRequest("POST", "/api/seb-admin/exams/bulk", { action, ids });
      return res.json();
    },
    onSuccess: (data, variables) => {
      toast({ title: "Success", description: `${variables.ids.length} exam(s) ${variables.action}d successfully` });
      queryClient.invalidateQueries({ queryKey: ["/api/seb-admin/exams"] });
      setSelectedExams([]);
    },
    onError: () => {
      toast({ title: "Error", description: "Bulk operation failed", variant: "destructive" });
    },
  });

  const bulkStudentMutation = useMutation({
    mutationFn: async ({ action, ids }: { action: "activate" | "deactivate" | "delete"; ids: number[] }) => {
      const res = await apiRequest("POST", "/api/seb-admin/students/bulk", { action, ids });
      return res.json();
    },
    onSuccess: (data, variables) => {
      toast({ title: "Success", description: `${variables.ids.length} student(s) ${variables.action}d successfully` });
      queryClient.invalidateQueries({ queryKey: ["/api/seb-admin/students"] });
      setSelectedStudents([]);
    },
    onError: () => {
      toast({ title: "Error", description: "Bulk operation failed", variant: "destructive" });
    },
  });

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!sessionData?.authenticated) {
    setLocation("/seb-admin/login");
    return null;
  }

  const stats = {
    totalExams: examsData?.exams?.length || 0,
    totalCenters: centersData?.centers?.length || 0,
    totalStudents: studentsData?.students?.length || 0,
    totalQPs: qpData?.papers?.length || 0,
  };

  // Filtered data
  const filteredExams = (examsData?.exams || []).filter((exam: any) => {
    const matchesSearch = examSearch === "" || 
      exam.examCode?.toLowerCase().includes(examSearch.toLowerCase()) ||
      exam.title?.toLowerCase().includes(examSearch.toLowerCase());
    const matchesStatus = examStatusFilter === "all" || 
      (examStatusFilter === "active" && exam.isActive) ||
      (examStatusFilter === "inactive" && !exam.isActive) ||
      (examStatusFilter === "draft" && exam.status === "DRAFT") ||
      (examStatusFilter === "published" && exam.status === "PUBLISHED");
    return matchesSearch && matchesStatus;
  });

  const filteredCenters = (centersData?.centers || []).filter((center: any) => {
    const matchesSearch = centerSearch === "" ||
      center.centerCode?.toLowerCase().includes(centerSearch.toLowerCase()) ||
      center.centerName?.toLowerCase().includes(centerSearch.toLowerCase());
    const matchesCity = centerCityFilter === "all" || center.city === centerCityFilter;
    return matchesSearch && matchesCity;
  });

  const filteredStudents = (studentsData?.students || []).filter((student: any) => {
    const matchesSearch = studentSearch === "" ||
      student.rollNumber?.toLowerCase().includes(studentSearch.toLowerCase()) ||
      student.name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
      student.email?.toLowerCase().includes(studentSearch.toLowerCase());
    const matchesExam = studentExamFilter === "all" || student.examCode === studentExamFilter;
    const matchesCenter = studentCenterFilter === "all" || student.centerCode === studentCenterFilter;
    return matchesSearch && matchesExam && matchesCenter;
  });

  // Get unique values for filters
  const uniqueCities = Array.from(new Set((centersData?.centers || []).map((c: any) => c.city).filter(Boolean))) as string[];
  const uniqueExamCodes = Array.from(new Set((examsData?.exams || []).map((e: any) => e.examCode).filter(Boolean))) as string[];
  const uniqueCenterCodes = Array.from(new Set((centersData?.centers || []).map((c: any) => c.centerCode).filter(Boolean))) as string[];

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-500" />
            <div>
              <h1 className="text-xl font-bold text-white">SEB Admin Console</h1>
              <p className="text-sm text-slate-400">Secure Exam Browser Administration</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout} data-testid="button-seb-logout">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.totalExams}</p>
                <p className="text-sm text-slate-400">SEB Exams</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.totalCenters}</p>
                <p className="text-sm text-slate-400">Exam Centers</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.totalStudents}</p>
                <p className="text-sm text-slate-400">Students</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-600/20 rounded-lg flex items-center justify-center">
                <Lock className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.totalQPs}</p>
                <p className="text-sm text-slate-400">Question Papers</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="exams" className="data-[state=active]:bg-blue-600">
              <FileText className="w-4 h-4 mr-2" />
              Exams
            </TabsTrigger>
            <TabsTrigger value="centers" className="data-[state=active]:bg-blue-600">
              <Building2 className="w-4 h-4 mr-2" />
              Centers
            </TabsTrigger>
            <TabsTrigger value="students" className="data-[state=active]:bg-blue-600">
              <Users className="w-4 h-4 mr-2" />
              Students
            </TabsTrigger>
            <TabsTrigger value="qp" className="data-[state=active]:bg-blue-600">
              <Lock className="w-4 h-4 mr-2" />
              Question Papers
            </TabsTrigger>
            <TabsTrigger value="monitor" className="data-[state=active]:bg-blue-600">
              <Monitor className="w-4 h-4 mr-2" />
              Live Monitor
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-blue-600">
              <Settings className="w-4 h-4 mr-2" />
              Branding
            </TabsTrigger>
          </TabsList>

          {/* Exams Tab */}
          <TabsContent value="exams">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-white">SEB Exams</CardTitle>
                    <CardDescription className="text-slate-400">Create and manage secure exams with branding</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="border-slate-600" data-testid="button-download-exam-template">
                      <Download className="w-4 h-4 mr-2" />
                      Template
                    </Button>
                    <Dialog open={showCreateExam} onOpenChange={setShowCreateExam}>
                      <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-create-seb-exam">
                          <Plus className="w-4 h-4 mr-2" />
                          Create Exam
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-slate-800 border-slate-700 max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="text-white">Create SEB Exam</DialogTitle>
                        </DialogHeader>
                        <CreateExamForm onSuccess={() => {
                          setShowCreateExam(false);
                          queryClient.invalidateQueries({ queryKey: ["/api/seb-admin/exams"] });
                        }} />
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                
                {/* Filter Bar */}
                <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-slate-700">
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        placeholder="Search by exam code or title..."
                        value={examSearch}
                        onChange={(e) => setExamSearch(e.target.value)}
                        className="pl-9 bg-slate-700 border-slate-600 text-white"
                        data-testid="input-exam-search"
                      />
                    </div>
                  </div>
                  <Select value={examStatusFilter} onValueChange={setExamStatusFilter}>
                    <SelectTrigger className="w-[150px] bg-slate-700 border-slate-600 text-white" data-testid="select-exam-status">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                  <Badge variant="outline" className="px-3 py-2 text-slate-300 border-slate-600">
                    Showing {filteredExams.length} of {stats.totalExams}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700">
                        <TableHead className="text-slate-300 w-10">
                          <Checkbox 
                            checked={selectedExams.length === filteredExams.length && filteredExams.length > 0}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedExams(filteredExams.map((e: any) => e.id));
                              } else {
                                setSelectedExams([]);
                              }
                            }}
                          />
                        </TableHead>
                        <TableHead className="text-slate-300">Logo</TableHead>
                        <TableHead className="text-slate-300">Exam Code</TableHead>
                        <TableHead className="text-slate-300">Title</TableHead>
                        <TableHead className="text-slate-300">Date</TableHead>
                        <TableHead className="text-slate-300">Shift</TableHead>
                        <TableHead className="text-slate-300">Duration</TableHead>
                        <TableHead className="text-slate-300">Status</TableHead>
                        <TableHead className="text-slate-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExams.map((exam: any) => (
                        <TableRow key={exam.id} className="border-slate-700">
                          <TableCell>
                            <Checkbox 
                              checked={selectedExams.includes(exam.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedExams([...selectedExams, exam.id]);
                                } else {
                                  setSelectedExams(selectedExams.filter(id => id !== exam.id));
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            {exam.clientLogo ? (
                              <img src={exam.clientLogo} alt="" className="w-10 h-10 object-contain rounded border border-slate-600" />
                            ) : (
                              <div className="w-10 h-10 bg-slate-700 rounded border border-slate-600 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-slate-500" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-white font-mono">{exam.examCode}</TableCell>
                          <TableCell className="text-white">{exam.title}</TableCell>
                          <TableCell className="text-slate-300">{new Date(exam.examDate).toLocaleDateString()}</TableCell>
                          <TableCell className="text-slate-300">{exam.shift || "SHIFT-1"}</TableCell>
                          <TableCell className="text-slate-300">{exam.duration} mins</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Badge variant={exam.isActive ? "default" : "secondary"} className="text-xs">
                                {exam.isActive ? "Active" : "Inactive"}
                              </Badge>
                              {exam.status && (
                                <Badge variant="outline" className={`text-xs ${exam.status === 'PUBLISHED' ? 'border-green-500 text-green-400' : 'border-amber-500 text-amber-400'}`}>
                                  {exam.status}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" className="h-8 w-8" data-testid={`button-view-exam-${exam.id}`}>
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8" data-testid={`button-edit-exam-${exam.id}`}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400" data-testid={`button-delete-exam-${exam.id}`}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredExams.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center text-slate-400 py-8">
                            {examSearch || examStatusFilter !== "all" 
                              ? "No exams match your filters." 
                              : "No exams created yet. Click \"Create Exam\" to add one."}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Bulk Actions */}
                {selectedExams.length > 0 && (
                  <div className="mt-4 p-3 bg-slate-700 rounded-lg flex items-center justify-between">
                    <span className="text-white">{selectedExams.length} exam(s) selected</span>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-green-500 text-green-400"
                        onClick={() => bulkExamMutation.mutate({ action: "activate", ids: selectedExams })}
                        disabled={bulkExamMutation.isPending}
                        data-testid="button-bulk-activate-exams"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" /> Activate
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-amber-500 text-amber-400"
                        onClick={() => bulkExamMutation.mutate({ action: "deactivate", ids: selectedExams })}
                        disabled={bulkExamMutation.isPending}
                        data-testid="button-bulk-deactivate-exams"
                      >
                        <AlertCircle className="w-4 h-4 mr-1" /> Deactivate
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-red-500 text-red-400"
                        onClick={() => bulkExamMutation.mutate({ action: "delete", ids: selectedExams })}
                        disabled={bulkExamMutation.isPending}
                        data-testid="button-bulk-delete-exams"
                      >
                        <Trash2 className="w-4 h-4 mr-1" /> Delete
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Centers Tab */}
          <TabsContent value="centers">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-white">Exam Centers</CardTitle>
                    <CardDescription className="text-slate-400">Upload and manage center data via Excel/CSV</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="border-slate-600" data-testid="button-download-center-template">
                      <Download className="w-4 h-4 mr-2" />
                      Template
                    </Button>
                    <Dialog open={showUploadCenter} onOpenChange={setShowUploadCenter}>
                      <DialogTrigger asChild>
                        <Button className="bg-green-600 hover:bg-green-700" data-testid="button-upload-centers">
                          <FileSpreadsheet className="w-4 h-4 mr-2" />
                          Upload Excel/CSV
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-slate-800 border-slate-700 max-w-lg">
                        <DialogHeader>
                          <DialogTitle className="text-white">Upload Center Data</DialogTitle>
                        </DialogHeader>
                        <UploadCenterForm onSuccess={() => {
                          setShowUploadCenter(false);
                          queryClient.invalidateQueries({ queryKey: ["/api/seb-admin/centers"] });
                        }} />
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                
                {/* Filter Bar */}
                <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-slate-700">
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        placeholder="Search by center code or name..."
                        value={centerSearch}
                        onChange={(e) => setCenterSearch(e.target.value)}
                        className="pl-9 bg-slate-700 border-slate-600 text-white"
                        data-testid="input-center-search"
                      />
                    </div>
                  </div>
                  <Select value={centerCityFilter} onValueChange={setCenterCityFilter}>
                    <SelectTrigger className="w-[150px] bg-slate-700 border-slate-600 text-white" data-testid="select-center-city">
                      <MapPin className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="City" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="all">All Cities</SelectItem>
                      {uniqueCities.map((city: any) => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Badge variant="outline" className="px-3 py-2 text-slate-300 border-slate-600">
                    Showing {filteredCenters.length} of {stats.totalCenters}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700">
                        <TableHead className="text-slate-300">Center Code</TableHead>
                        <TableHead className="text-slate-300">Name</TableHead>
                        <TableHead className="text-slate-300">City</TableHead>
                        <TableHead className="text-slate-300">State</TableHead>
                        <TableHead className="text-slate-300">Capacity</TableHead>
                        <TableHead className="text-slate-300">Admin</TableHead>
                        <TableHead className="text-slate-300">Status</TableHead>
                        <TableHead className="text-slate-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCenters.map((center: any) => (
                        <TableRow key={center.id} className="border-slate-700">
                          <TableCell className="text-white font-mono">{center.centerCode}</TableCell>
                          <TableCell className="text-white">{center.centerName}</TableCell>
                          <TableCell className="text-slate-300">{center.city}</TableCell>
                          <TableCell className="text-slate-300">{center.state || "-"}</TableCell>
                          <TableCell className="text-slate-300">{center.capacity}</TableCell>
                          <TableCell className="text-slate-300">{center.adminUsername}</TableCell>
                          <TableCell>
                            <Badge variant={center.isActive ? "default" : "secondary"}>
                              {center.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" className="h-8 w-8" data-testid={`button-edit-center-${center.id}`}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400" data-testid={`button-delete-center-${center.id}`}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredCenters.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-slate-400 py-8">
                            {centerSearch || centerCityFilter !== "all"
                              ? "No centers match your filters."
                              : "No centers added yet. Upload Excel/CSV to add centers."}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-white">Students</CardTitle>
                    <CardDescription className="text-slate-400">Upload and manage student data via Excel/CSV</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="border-slate-600" data-testid="button-download-student-template">
                      <Download className="w-4 h-4 mr-2" />
                      Template
                    </Button>
                    <Button variant="outline" className="border-slate-600" data-testid="button-export-students">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                    <Dialog open={showUploadStudents} onOpenChange={setShowUploadStudents}>
                      <DialogTrigger asChild>
                        <Button className="bg-purple-600 hover:bg-purple-700" data-testid="button-upload-students">
                          <FileSpreadsheet className="w-4 h-4 mr-2" />
                          Upload Excel/CSV
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-slate-800 border-slate-700 max-w-lg">
                        <DialogHeader>
                          <DialogTitle className="text-white">Upload Student Data</DialogTitle>
                        </DialogHeader>
                        <UploadStudentForm onSuccess={() => {
                          setShowUploadStudents(false);
                          queryClient.invalidateQueries({ queryKey: ["/api/seb-admin/students"] });
                        }} />
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                
                {/* Filter Bar */}
                <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-slate-700">
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        placeholder="Search by roll number, name, or email..."
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        className="pl-9 bg-slate-700 border-slate-600 text-white"
                        data-testid="input-student-search"
                      />
                    </div>
                  </div>
                  <Select value={studentExamFilter} onValueChange={setStudentExamFilter}>
                    <SelectTrigger className="w-[150px] bg-slate-700 border-slate-600 text-white" data-testid="select-student-exam">
                      <SelectValue placeholder="Exam" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="all">All Exams</SelectItem>
                      {uniqueExamCodes.map((code: any) => (
                        <SelectItem key={code} value={code}>{code}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={studentCenterFilter} onValueChange={setStudentCenterFilter}>
                    <SelectTrigger className="w-[150px] bg-slate-700 border-slate-600 text-white" data-testid="select-student-center">
                      <SelectValue placeholder="Center" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="all">All Centers</SelectItem>
                      {uniqueCenterCodes.map((code: any) => (
                        <SelectItem key={code} value={code}>{code}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Badge variant="outline" className="px-3 py-2 text-slate-300 border-slate-600">
                    Showing {filteredStudents.length} of {stats.totalStudents}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700">
                        <TableHead className="text-slate-300 w-10">
                          <Checkbox 
                            checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedStudents(filteredStudents.map((s: any) => s.id));
                              } else {
                                setSelectedStudents([]);
                              }
                            }}
                          />
                        </TableHead>
                        <TableHead className="text-slate-300">Photo</TableHead>
                        <TableHead className="text-slate-300">Roll No</TableHead>
                        <TableHead className="text-slate-300">Name</TableHead>
                        <TableHead className="text-slate-300">Email</TableHead>
                        <TableHead className="text-slate-300">Center</TableHead>
                        <TableHead className="text-slate-300">Exam</TableHead>
                        <TableHead className="text-slate-300">Shift</TableHead>
                        <TableHead className="text-slate-300">Signature</TableHead>
                        <TableHead className="text-slate-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student: any) => (
                        <TableRow key={student.id} className="border-slate-700">
                          <TableCell>
                            <Checkbox 
                              checked={selectedStudents.includes(student.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedStudents([...selectedStudents, student.id]);
                                } else {
                                  setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            {student.photoUrl ? (
                              <img src={student.photoUrl} alt="Photo" className="w-10 h-10 rounded-full object-cover border-2 border-slate-600" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                                <Camera className="w-4 h-4 text-slate-400" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-white font-mono">{student.rollNumber}</TableCell>
                          <TableCell className="text-white">{student.name}</TableCell>
                          <TableCell className="text-slate-300 text-sm">{student.email || "-"}</TableCell>
                          <TableCell className="text-slate-300">{student.centerCode}</TableCell>
                          <TableCell className="text-slate-300">{student.examCode}</TableCell>
                          <TableCell className="text-slate-300">{student.shift || "SHIFT-1"}</TableCell>
                          <TableCell>
                            {student.signatureUrl ? (
                              <img src={student.signatureUrl} alt="Signature" className="h-6 max-w-20 object-contain bg-white rounded px-1" />
                            ) : (
                              <Badge variant="secondary" className="text-xs">No Signature</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <StudentMediaUpload student={student} />
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400" data-testid={`button-delete-student-${student.id}`}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredStudents.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={10} className="text-center text-slate-400 py-8">
                            {studentSearch || studentExamFilter !== "all" || studentCenterFilter !== "all"
                              ? "No students match your filters."
                              : "No students added yet. Upload Excel/CSV to add students."}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Bulk Actions */}
                {selectedStudents.length > 0 && (
                  <div className="mt-4 p-3 bg-slate-700 rounded-lg flex items-center justify-between">
                    <span className="text-white">{selectedStudents.length} student(s) selected</span>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-green-500 text-green-400"
                        onClick={() => bulkStudentMutation.mutate({ action: "activate", ids: selectedStudents })}
                        disabled={bulkStudentMutation.isPending}
                        data-testid="button-bulk-activate-students"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" /> Activate
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-amber-500 text-amber-400"
                        onClick={() => bulkStudentMutation.mutate({ action: "deactivate", ids: selectedStudents })}
                        disabled={bulkStudentMutation.isPending}
                        data-testid="button-bulk-deactivate-students"
                      >
                        <AlertCircle className="w-4 h-4 mr-1" /> Deactivate
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-red-500 text-red-400"
                        onClick={() => bulkStudentMutation.mutate({ action: "delete", ids: selectedStudents })}
                        disabled={bulkStudentMutation.isPending}
                        data-testid="button-bulk-delete-students"
                      >
                        <Trash2 className="w-4 h-4 mr-1" /> Delete
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Question Papers Tab */}
          <TabsContent value="qp">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-white">Question Papers</CardTitle>
                  <CardDescription className="text-slate-400">Create encrypted question papers</CardDescription>
                </div>
                <Dialog open={showCreateQP} onOpenChange={setShowCreateQP}>
                  <DialogTrigger asChild>
                    <Button className="bg-amber-600 hover:bg-amber-700" data-testid="button-create-qp">
                      <Key className="w-4 h-4 mr-2" />
                      Create Encrypted QP
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-800 border-slate-700 max-w-3xl">
                    <DialogHeader>
                      <DialogTitle className="text-white">Create Encrypted Question Paper</DialogTitle>
                    </DialogHeader>
                    <CreateQPForm onSuccess={() => {
                      setShowCreateQP(false);
                      queryClient.invalidateQueries({ queryKey: ["/api/seb-admin/question-papers"] });
                    }} />
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-300">Paper Code</TableHead>
                      <TableHead className="text-slate-300">Exam</TableHead>
                      <TableHead className="text-slate-300">Subject</TableHead>
                      <TableHead className="text-slate-300">Questions</TableHead>
                      <TableHead className="text-slate-300">Encrypted</TableHead>
                      <TableHead className="text-slate-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {qpData?.papers?.map((paper: any) => (
                      <TableRow key={paper.id} className="border-slate-700">
                        <TableCell className="text-white font-mono">{paper.paperCode}</TableCell>
                        <TableCell className="text-white">{paper.examCode}</TableCell>
                        <TableCell className="text-slate-300">{paper.subject}</TableCell>
                        <TableCell className="text-slate-300">{paper.questionCount}</TableCell>
                        <TableCell>
                          <Badge variant="default" className="bg-green-600">
                            <Lock className="w-3 h-3 mr-1" />
                            Encrypted
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" data-testid={`button-download-qp-${paper.id}`}>
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" data-testid={`button-view-key-${paper.id}`}>
                              <Key className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!qpData?.papers || qpData.papers.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-slate-400 py-8">
                          No question papers created yet. Click "Create Encrypted QP" to add one.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Live Monitor Tab */}
          <TabsContent value="monitor">
            <LiveMonitorPanel />
          </TabsContent>

          {/* Branding Settings Tab */}
          <TabsContent value="settings">
            <BrandingSettingsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Create Exam Form Component
function CreateExamForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<"basic" | "branding" | "settings">("basic");
  const [formData, setFormData] = useState({
    examCode: "",
    title: "",
    description: "",
    clientLogo: "",
    examLogo: "",
    headerText: "",
    footerText: "",
    watermarkText: "",
    examDate: "",
    startTime: "",
    endTime: "",
    shift: "SHIFT-1",
    duration: 60,
    totalMarks: 100,
    passingMarks: 35,
    negativeMarking: 0.25,
    totalQuestions: 100,
    category: "",
    language: "English",
    instructions: "",
    status: "DRAFT",
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/seb-admin/exams", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Exam created successfully" });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create exam", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Section Tabs */}
      <div className="flex gap-2 border-b border-slate-700 pb-2">
        <Button 
          type="button"
          variant={activeSection === "basic" ? "default" : "ghost"} 
          size="sm"
          onClick={() => setActiveSection("basic")}
          className={activeSection === "basic" ? "bg-blue-600" : ""}
        >
          Basic Info
        </Button>
        <Button 
          type="button"
          variant={activeSection === "branding" ? "default" : "ghost"} 
          size="sm"
          onClick={() => setActiveSection("branding")}
          className={activeSection === "branding" ? "bg-blue-600" : ""}
        >
          Branding
        </Button>
        <Button 
          type="button"
          variant={activeSection === "settings" ? "default" : "ghost"} 
          size="sm"
          onClick={() => setActiveSection("settings")}
          className={activeSection === "settings" ? "bg-blue-600" : ""}
        >
          Settings
        </Button>
      </div>

      {/* Basic Info Section */}
      {activeSection === "basic" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-200">Exam Code *</Label>
              <Input
                data-testid="input-exam-code"
                placeholder="e.g., SSC-CGL-2024"
                value={formData.examCode}
                onChange={(e) => setFormData({ ...formData, examCode: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200">Title *</Label>
              <Input
                data-testid="input-exam-title"
                placeholder="Exam Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
                required
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label className="text-slate-200">Description</Label>
              <Textarea
                placeholder="Brief description of the exam..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200">Category</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="government">Government Exam</SelectItem>
                  <SelectItem value="banking">Banking Exam</SelectItem>
                  <SelectItem value="railway">Railway Exam</SelectItem>
                  <SelectItem value="defence">Defence Exam</SelectItem>
                  <SelectItem value="ssc">SSC Exam</SelectItem>
                  <SelectItem value="upsc">UPSC Exam</SelectItem>
                  <SelectItem value="state">State Level Exam</SelectItem>
                  <SelectItem value="entrance">Entrance Exam</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200">Language</Label>
              <Select value={formData.language} onValueChange={(v) => setFormData({ ...formData, language: v })}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Hindi">Hindi</SelectItem>
                  <SelectItem value="Both">Bilingual (English + Hindi)</SelectItem>
                  <SelectItem value="Regional">Regional Language</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200">Exam Date *</Label>
              <Input
                data-testid="input-exam-date"
                type="date"
                value={formData.examDate}
                onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200">Shift</Label>
              <Select value={formData.shift} onValueChange={(v) => setFormData({ ...formData, shift: v })}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Select shift" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="SHIFT-1">Shift 1 (Morning)</SelectItem>
                  <SelectItem value="SHIFT-2">Shift 2 (Afternoon)</SelectItem>
                  <SelectItem value="SHIFT-3">Shift 3 (Evening)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200">Start Time *</Label>
              <Input
                data-testid="input-start-time"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200">End Time</Label>
              <Input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* Branding Section */}
      {activeSection === "branding" && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 rounded-lg border border-slate-700">
            <h4 className="text-white font-medium mb-3 flex items-center gap-2">
              <Image className="w-4 h-4" /> Exam Branding
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-200">Client Logo URL</Label>
                <Input
                  data-testid="input-client-logo"
                  placeholder="https://example.com/client-logo.png"
                  value={formData.clientLogo}
                  onChange={(e) => setFormData({ ...formData, clientLogo: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
                {formData.clientLogo && (
                  <div className="w-16 h-16 bg-slate-700 rounded border border-slate-600 flex items-center justify-center overflow-hidden mt-2">
                    <img src={formData.clientLogo} alt="Client Logo" className="max-w-full max-h-full object-contain" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-slate-200">Exam Logo URL</Label>
                <Input
                  placeholder="https://example.com/exam-logo.png"
                  value={formData.examLogo}
                  onChange={(e) => setFormData({ ...formData, examLogo: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
                {formData.examLogo && (
                  <div className="w-16 h-16 bg-slate-700 rounded border border-slate-600 flex items-center justify-center overflow-hidden mt-2">
                    <img src={formData.examLogo} alt="Exam Logo" className="max-w-full max-h-full object-contain" />
                  </div>
                )}
              </div>
              <div className="col-span-2 space-y-2">
                <Label className="text-slate-200">Header Text</Label>
                <Input
                  placeholder="Text to display in exam header..."
                  value={formData.headerText}
                  onChange={(e) => setFormData({ ...formData, headerText: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label className="text-slate-200">Footer Text</Label>
                <Input
                  placeholder="Text to display in exam footer..."
                  value={formData.footerText}
                  onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label className="text-slate-200">Watermark Text</Label>
                <Input
                  placeholder="Watermark text for exam screen..."
                  value={formData.watermarkText}
                  onChange={(e) => setFormData({ ...formData, watermarkText: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>
          </div>
          
          {/* Branding Preview */}
          <div className="p-4 bg-slate-900 rounded-lg border border-slate-700">
            <h4 className="text-white font-medium mb-3">Preview</h4>
            <div className="bg-blue-900 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {formData.clientLogo && (
                    <img src={formData.clientLogo} alt="" className="h-10 object-contain" />
                  )}
                  <div className="text-white">
                    <p className="font-bold">{formData.headerText || formData.title || "Exam Title"}</p>
                    <p className="text-sm text-slate-300">{formData.examCode || "EXAM-CODE"}</p>
                  </div>
                </div>
                {formData.examLogo && (
                  <img src={formData.examLogo} alt="" className="h-10 object-contain" />
                )}
              </div>
              {formData.footerText && (
                <div className="text-center text-xs text-slate-400 border-t border-slate-700 pt-2 mt-4">
                  {formData.footerText}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings Section */}
      {activeSection === "settings" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-200">Duration (minutes) *</Label>
              <Input
                data-testid="input-duration"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                className="bg-slate-700 border-slate-600 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200">Total Questions</Label>
              <Input
                type="number"
                value={formData.totalQuestions}
                onChange={(e) => setFormData({ ...formData, totalQuestions: parseInt(e.target.value) })}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200">Total Marks</Label>
              <Input
                data-testid="input-total-marks"
                type="number"
                value={formData.totalMarks}
                onChange={(e) => setFormData({ ...formData, totalMarks: parseInt(e.target.value) })}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200">Passing Marks</Label>
              <Input
                data-testid="input-passing-marks"
                type="number"
                value={formData.passingMarks}
                onChange={(e) => setFormData({ ...formData, passingMarks: parseInt(e.target.value) })}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200">Negative Marking (per wrong answer)</Label>
              <Input
                data-testid="input-negative-marking"
                type="number"
                step="0.25"
                value={formData.negativeMarking}
                onChange={(e) => setFormData({ ...formData, negativeMarking: parseFloat(e.target.value) })}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200">Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-slate-200">Instructions for Candidates</Label>
            <Textarea
              data-testid="input-instructions"
              placeholder="Exam instructions for students..."
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              className="bg-slate-700 border-slate-600 text-white min-h-[120px]"
            />
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-4 border-t border-slate-700">
        <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={createMutation.isPending}>
          {createMutation.isPending ? "Creating..." : "Create Exam"}
        </Button>
      </div>
    </form>
  );
}

// Upload Center Form Component
function UploadCenterForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const [csvData, setCsvData] = useState("");
  const [uploadMode, setUploadMode] = useState<"file" | "paste">("file");
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: async (data: string) => {
      const res = await apiRequest("POST", "/api/seb-admin/centers/upload", { csvData: data });
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Success", description: `${data.imported} centers imported successfully` });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to import centers", variant: "destructive" });
    },
  });

  const parseExcelToCSV = async (file: File): Promise<string> => {
    const rows = await readXlsxFile(file);
    return rows.map(row =>
      row.map(cell => {
        if (cell === null || cell === undefined) return '';
        const str = String(cell);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',')
    ).join('\n');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setFileName(file.name);
    
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      try {
        const csvContent = await parseExcelToCSV(file);
        setCsvData(csvContent);
        toast({ title: "Success", description: "Excel file parsed successfully" });
      } catch (err) {
        toast({ title: "Error", description: "Failed to parse Excel file", variant: "destructive" });
      }
    } else {
      const text = await file.text();
      setCsvData(text);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    uploadMutation.mutate(csvData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 bg-slate-700/50 rounded-lg">
        <p className="text-sm text-slate-300 mb-2">Required Columns:</p>
        <code className="text-xs text-blue-400 block">centerCode, centerName, city, state, address, capacity, adminUsername, adminPassword</code>
      </div>
      
      <div className="flex gap-2 mb-4">
        <Button 
          type="button" 
          variant={uploadMode === "file" ? "default" : "outline"}
          size="sm"
          onClick={() => setUploadMode("file")}
          className={uploadMode === "file" ? "bg-green-600" : ""}
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload File
        </Button>
        <Button 
          type="button" 
          variant={uploadMode === "paste" ? "default" : "outline"}
          size="sm"
          onClick={() => setUploadMode("paste")}
          className={uploadMode === "paste" ? "bg-green-600" : ""}
        >
          <FileText className="w-4 h-4 mr-2" />
          Paste Data
        </Button>
      </div>

      {uploadMode === "file" ? (
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-green-500 transition-colors"
          >
            <FileSpreadsheet className="w-12 h-12 mx-auto text-slate-400 mb-3" />
            {fileName ? (
              <p className="text-white">{fileName}</p>
            ) : (
              <>
                <p className="text-slate-300">Click to select file or drag and drop</p>
                <p className="text-xs text-slate-500 mt-1">Supports CSV, Excel (.xlsx, .xls)</p>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Label className="text-slate-200">CSV Data</Label>
          <Textarea
            data-testid="input-center-csv"
            placeholder="Paste CSV data here..."
            value={csvData}
            onChange={(e) => setCsvData(e.target.value)}
            className="bg-slate-700 border-slate-600 text-white min-h-[200px] font-mono text-sm"
          />
        </div>
      )}
      
      <Button 
        type="submit" 
        className="w-full bg-green-600 hover:bg-green-700" 
        disabled={uploadMutation.isPending || !csvData}
      >
        {uploadMutation.isPending ? "Importing..." : "Import Centers"}
      </Button>
    </form>
  );
}

// Upload Student Form Component
function UploadStudentForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const [csvData, setCsvData] = useState("");
  const [uploadMode, setUploadMode] = useState<"file" | "paste">("file");
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: async (data: string) => {
      const res = await apiRequest("POST", "/api/seb-admin/students/upload", { csvData: data });
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Success", description: `${data.imported} students imported successfully` });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to import students", variant: "destructive" });
    },
  });

  const parseExcelToCSV = async (file: File): Promise<string> => {
    const rows = await readXlsxFile(file);
    return rows.map(row =>
      row.map(cell => {
        if (cell === null || cell === undefined) return '';
        const str = String(cell);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',')
    ).join('\n');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setFileName(file.name);
    
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      try {
        const csvContent = await parseExcelToCSV(file);
        setCsvData(csvContent);
        toast({ title: "Success", description: "Excel file parsed successfully" });
      } catch (err) {
        toast({ title: "Error", description: "Failed to parse Excel file", variant: "destructive" });
      }
    } else {
      const text = await file.text();
      setCsvData(text);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    uploadMutation.mutate(csvData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 bg-slate-700/50 rounded-lg">
        <p className="text-sm text-slate-300 mb-2">Required Columns:</p>
        <code className="text-xs text-blue-400 block">rollNumber, name, email, phone, centerCode, examCode, shift</code>
        <p className="text-xs text-slate-400 mt-2">Optional: photoUrl, signatureUrl, fatherName, dob, category</p>
      </div>
      
      <div className="flex gap-2 mb-4">
        <Button 
          type="button" 
          variant={uploadMode === "file" ? "default" : "outline"}
          size="sm"
          onClick={() => setUploadMode("file")}
          className={uploadMode === "file" ? "bg-purple-600" : ""}
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload File
        </Button>
        <Button 
          type="button" 
          variant={uploadMode === "paste" ? "default" : "outline"}
          size="sm"
          onClick={() => setUploadMode("paste")}
          className={uploadMode === "paste" ? "bg-purple-600" : ""}
        >
          <FileText className="w-4 h-4 mr-2" />
          Paste Data
        </Button>
      </div>

      {uploadMode === "file" ? (
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-purple-500 transition-colors"
          >
            <FileSpreadsheet className="w-12 h-12 mx-auto text-slate-400 mb-3" />
            {fileName ? (
              <p className="text-white">{fileName}</p>
            ) : (
              <>
                <p className="text-slate-300">Click to select file or drag and drop</p>
                <p className="text-xs text-slate-500 mt-1">Supports CSV, Excel (.xlsx, .xls)</p>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Label className="text-slate-200">CSV Data</Label>
          <Textarea
            data-testid="input-student-csv"
            placeholder="Paste CSV data here..."
            value={csvData}
            onChange={(e) => setCsvData(e.target.value)}
            className="bg-slate-700 border-slate-600 text-white min-h-[200px] font-mono text-sm"
          />
        </div>
      )}
      
      <Button 
        type="submit" 
        className="w-full bg-purple-600 hover:bg-purple-700" 
        disabled={uploadMutation.isPending || !csvData}
      >
        {uploadMutation.isPending ? "Importing..." : "Import Students"}
      </Button>
    </form>
  );
}

// Create Question Paper Form Component
function CreateQPForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    paperCode: "",
    examCode: "",
    subject: "",
    questionsJson: "",
    encryptionPassword: "",
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/seb-admin/question-papers", data);
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Success", description: "Question paper encrypted and saved" });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create question paper", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
    let password = "";
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, encryptionPassword: password });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-slate-200">Paper Code</Label>
          <Input
            data-testid="input-paper-code"
            placeholder="e.g., QP-001"
            value={formData.paperCode}
            onChange={(e) => setFormData({ ...formData, paperCode: e.target.value })}
            className="bg-slate-700 border-slate-600 text-white"
            required
          />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-200">Exam Code</Label>
          <Input
            data-testid="input-qp-exam-code"
            placeholder="e.g., SSC-CGL-2024"
            value={formData.examCode}
            onChange={(e) => setFormData({ ...formData, examCode: e.target.value })}
            className="bg-slate-700 border-slate-600 text-white"
            required
          />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-200">Subject</Label>
          <Input
            data-testid="input-subject"
            placeholder="e.g., General Awareness"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            className="bg-slate-700 border-slate-600 text-white"
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-slate-200">Encryption Password</Label>
        <div className="flex gap-2">
          <Input
            data-testid="input-encryption-password"
            type="text"
            placeholder="Strong password for encryption"
            value={formData.encryptionPassword}
            onChange={(e) => setFormData({ ...formData, encryptionPassword: e.target.value })}
            className="bg-slate-700 border-slate-600 text-white font-mono"
            required
          />
          <Button type="button" variant="outline" onClick={generatePassword}>
            Generate
          </Button>
        </div>
        <p className="text-xs text-amber-400">Keep this password safe! It will be needed to decrypt the paper at exam time.</p>
      </div>
      <div className="space-y-2">
        <Label className="text-slate-200">Questions (JSON Format)</Label>
        <Textarea
          data-testid="input-questions-json"
          placeholder='[{"question": "What is 2+2?", "optionA": "3", "optionB": "4", "optionC": "5", "optionD": "6", "correctAnswer": "B"}]'
          value={formData.questionsJson}
          onChange={(e) => setFormData({ ...formData, questionsJson: e.target.value })}
          className="bg-slate-700 border-slate-600 text-white min-h-[150px] font-mono text-sm"
          required
        />
      </div>
      <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700" disabled={createMutation.isPending}>
        {createMutation.isPending ? "Encrypting..." : "Create Encrypted Paper"}
      </Button>
    </form>
  );
}

// Live Monitor Panel Component
function LiveMonitorPanel() {
  const { data: monitorData, isLoading } = useQuery({
    queryKey: ["/api/seb-admin/monitor"],
    queryFn: async () => {
      const res = await fetch("/api/seb-admin/monitor");
      return res.json();
    },
    refetchInterval: 5000,
  });

  if (isLoading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-8 text-center text-slate-400">
          Loading monitor data...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Center Status */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-green-500" />
            Center Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {monitorData?.centers?.map((center: any) => (
              <div key={center.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <div>
                  <p className="text-white font-medium">{center.centerName}</p>
                  <p className="text-sm text-slate-400">{center.centerCode}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={center.isOnline ? "default" : "secondary"} className={center.isOnline ? "bg-green-600" : ""}>
                    {center.isOnline ? "Online" : "Offline"}
                  </Badge>
                  {center.lastSync && (
                    <span className="text-xs text-slate-400">
                      Last sync: {new Date(center.lastSync).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {(!monitorData?.centers || monitorData.centers.length === 0) && (
              <p className="text-center text-slate-400 py-4">No centers registered</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Live Exam Sessions */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Monitor className="w-5 h-5 text-blue-500" />
            Live Exam Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {monitorData?.liveSessions?.map((session: any) => (
              <div key={session.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <div>
                  <p className="text-white font-medium">{session.studentName}</p>
                  <p className="text-sm text-slate-400">{session.rollNumber} - {session.centerCode}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-blue-600">
                    <Clock className="w-3 h-3 mr-1" />
                    In Progress
                  </Badge>
                  <span className="text-sm text-slate-300">{session.progress}%</span>
                </div>
              </div>
            ))}
            {(!monitorData?.liveSessions || monitorData.liveSessions.length === 0) && (
              <p className="text-center text-slate-400 py-4">No active exam sessions</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Sync Logs */}
      <Card className="bg-slate-800 border-slate-700 lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-purple-500" />
            Recent Sync Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead className="text-slate-300">Time</TableHead>
                <TableHead className="text-slate-300">Center</TableHead>
                <TableHead className="text-slate-300">Type</TableHead>
                <TableHead className="text-slate-300">Records</TableHead>
                <TableHead className="text-slate-300">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monitorData?.syncLogs?.map((log: any) => (
                <TableRow key={log.id} className="border-slate-700">
                  <TableCell className="text-slate-300">{new Date(log.syncTime).toLocaleString()}</TableCell>
                  <TableCell className="text-white">{log.centerCode}</TableCell>
                  <TableCell className="text-slate-300">{log.syncType}</TableCell>
                  <TableCell className="text-slate-300">{log.recordCount}</TableCell>
                  <TableCell>
                    <Badge variant={log.status === "SUCCESS" ? "default" : "destructive"} className={log.status === "SUCCESS" ? "bg-green-600" : ""}>
                      {log.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {(!monitorData?.syncLogs || monitorData.syncLogs.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-400 py-4">
                    No sync activity yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// Branding Settings Panel Component
function BrandingSettingsPanel() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    portalLogo: "",
    examLogo: "",
    portalName: "SEB Admin Portal",
    examName: "Government Examination",
  });

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ["/api/seb-admin/settings"],
    queryFn: async () => {
      const res = await fetch("/api/seb-admin/settings");
      return res.json();
    },
  });

  useState(() => {
    if (settingsData) {
      setSettings({
        portalLogo: settingsData.portalLogo || "",
        examLogo: settingsData.examLogo || "",
        portalName: settingsData.portalName || "SEB Admin Portal",
        examName: settingsData.examName || "Government Examination",
      });
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof settings) => {
      const res = await apiRequest("PUT", "/api/seb-admin/settings", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Branding settings saved" });
      queryClient.invalidateQueries({ queryKey: ["/api/seb-admin/settings"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
    },
  });

  const handleSave = () => {
    saveMutation.mutate(settings);
  };

  if (isLoading) {
    return <div className="text-white">Loading...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Image className="w-5 h-5 text-blue-500" />
            Portal Branding
          </CardTitle>
          <CardDescription className="text-slate-400">
            Configure logos and names for the SEB portal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="portalName" className="text-slate-200">Portal Name</Label>
            <Input
              id="portalName"
              data-testid="input-portal-name"
              value={settings.portalName}
              onChange={(e) => setSettings({ ...settings, portalName: e.target.value })}
              placeholder="SEB Admin Portal"
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="portalLogo" className="text-slate-200">Portal Logo URL</Label>
            <Input
              id="portalLogo"
              data-testid="input-portal-logo"
              value={settings.portalLogo}
              onChange={(e) => setSettings({ ...settings, portalLogo: e.target.value })}
              placeholder="https://example.com/logo.png"
              className="bg-slate-700 border-slate-600 text-white"
            />
            {settings.portalLogo && (
              <div className="mt-2 p-4 bg-slate-900 rounded-lg flex items-center justify-center">
                <img src={settings.portalLogo} alt="Portal Logo" className="max-h-20 object-contain" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-500" />
            Exam Branding
          </CardTitle>
          <CardDescription className="text-slate-400">
            Configure exam-specific branding
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="examName" className="text-slate-200">Exam Name</Label>
            <Input
              id="examName"
              data-testid="input-exam-name"
              value={settings.examName}
              onChange={(e) => setSettings({ ...settings, examName: e.target.value })}
              placeholder="Government Examination"
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="examLogo" className="text-slate-200">Exam Logo URL</Label>
            <Input
              id="examLogo"
              data-testid="input-exam-logo"
              value={settings.examLogo}
              onChange={(e) => setSettings({ ...settings, examLogo: e.target.value })}
              placeholder="https://example.com/exam-logo.png"
              className="bg-slate-700 border-slate-600 text-white"
            />
            {settings.examLogo && (
              <div className="mt-2 p-4 bg-slate-900 rounded-lg flex items-center justify-center">
                <img src={settings.examLogo} alt="Exam Logo" className="max-h-20 object-contain" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700 lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-white">Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-slate-900 p-6 rounded-lg">
            <div className="flex items-center justify-between border-b border-slate-700 pb-4 mb-4">
              <div className="flex items-center gap-4">
                {settings.portalLogo ? (
                  <img src={settings.portalLogo} alt="Portal" className="h-12 object-contain" />
                ) : (
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-white">{settings.portalName}</h3>
                  <p className="text-sm text-slate-400">Secure Exam Browser</p>
                </div>
              </div>
              {settings.examLogo && (
                <img src={settings.examLogo} alt="Exam" className="h-12 object-contain" />
              )}
            </div>
            <div className="text-center py-8">
              <h2 className="text-2xl font-bold text-white">{settings.examName}</h2>
              <p className="text-slate-400 mt-2">Online Examination Portal</p>
            </div>
          </div>
        </CardContent>
        <div className="p-6 pt-0">
          <Button 
            onClick={handleSave} 
            className="w-full bg-blue-600 hover:bg-blue-700"
            data-testid="button-save-branding"
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? "Saving..." : "Save Branding Settings"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

// Student Media Upload Component
function StudentMediaUpload({ student }: { student: any }) {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(student.photoUrl || "");
  const [signatureUrl, setSignatureUrl] = useState(student.signatureUrl || "");

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/seb-admin/students/${student.id}/upload`, {
        photoUrl,
        signatureUrl,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Student media uploaded" });
      queryClient.invalidateQueries({ queryKey: ["/api/seb-admin/students"] });
      setShowDialog(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to upload media", variant: "destructive" });
    },
  });

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" data-testid={`button-upload-media-${student.id}`}>
          <Upload className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">Upload Photo & Signature</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 rounded-lg">
            <p className="text-sm text-slate-300 mb-2">Student: <span className="text-white font-medium">{student.name}</span></p>
            <p className="text-sm text-slate-400">Roll No: {student.rollNumber}</p>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-200">Photo URL</Label>
            <Input
              data-testid="input-student-photo-url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://example.com/photo.jpg"
              className="bg-slate-700 border-slate-600 text-white"
            />
            {photoUrl && (
              <div className="flex justify-center mt-2">
                <img src={photoUrl} alt="Preview" className="w-24 h-24 rounded-full object-cover border-2 border-slate-600" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-slate-200">Signature URL</Label>
            <Input
              data-testid="input-student-signature-url"
              value={signatureUrl}
              onChange={(e) => setSignatureUrl(e.target.value)}
              placeholder="https://example.com/signature.png"
              className="bg-slate-700 border-slate-600 text-white"
            />
            {signatureUrl && (
              <div className="flex justify-center mt-2 bg-white rounded p-2">
                <img src={signatureUrl} alt="Signature Preview" className="h-12 object-contain" />
              </div>
            )}
          </div>

          <Button
            onClick={() => uploadMutation.mutate()}
            className="w-full bg-blue-600 hover:bg-blue-700"
            data-testid="button-save-student-media"
            disabled={uploadMutation.isPending}
          >
            {uploadMutation.isPending ? "Saving..." : "Save Photo & Signature"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
