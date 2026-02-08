import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Building2, Users, Monitor, Play, Upload, RefreshCw, LogOut, 
  CheckCircle, Clock, AlertCircle, Wifi, WifiOff, UserPlus
} from "lucide-react";

export default function CenterAdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedExam, setSelectedExam] = useState<number | null>(null);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [studentLoginData, setStudentLoginData] = useState({
    candidateId: 0,
    seatNumber: "",
    computerNumber: "",
    studentIpAddress: "",
  });

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ["/api/center-admin/session"],
  });

  const { data: exams = [], isLoading: examsLoading } = useQuery({
    queryKey: ["/api/center-admin/exams"],
    enabled: !!session,
  });

  const { data: candidates = [] } = useQuery({
    queryKey: ["/api/center-admin/exams", selectedExam, "candidates"],
    queryFn: async () => {
      if (!selectedExam) return [];
      const res = await fetch(`/api/center-admin/exams/${selectedExam}/candidates`);
      return res.json();
    },
    enabled: !!selectedExam,
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["/api/center-admin/sessions", selectedExam],
    queryFn: async () => {
      const url = selectedExam 
        ? `/api/center-admin/sessions?examId=${selectedExam}`
        : "/api/center-admin/sessions";
      const res = await fetch(url);
      return res.json();
    },
    enabled: !!session,
    refetchInterval: 5000,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/center-admin/logout");
    },
    onSuccess: () => {
      setLocation("/center-admin/login");
    },
  });

  const studentLoginMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/center-admin/student-login", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Student Logged In",
        description: `Session created for seat ${data.session.seatNumber}`,
      });
      setLoginDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/center-admin/sessions"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const startExamMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      const response = await apiRequest("POST", `/api/center-admin/sessions/${sessionId}/start`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Exam Started" });
      queryClient.invalidateQueries({ queryKey: ["/api/center-admin/sessions"] });
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/center-admin/sync-to-main", {
        examId: selectedExam,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Sync Complete",
        description: `${data.synced} responses synced to main server`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/center-admin/sessions"] });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!session) {
    setLocation("/center-admin/login");
    return null;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "WAITING":
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" /> Waiting</Badge>;
      case "IN_PROGRESS":
        return <Badge className="bg-blue-500"><Play className="w-3 h-3 mr-1" /> In Progress</Badge>;
      case "SUBMITTED":
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Submitted</Badge>;
      case "TERMINATED":
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" /> Terminated</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const waitingCount = sessions.filter((s: any) => s.status === "WAITING").length;
  const inProgressCount = sessions.filter((s: any) => s.status === "IN_PROGRESS").length;
  const submittedCount = sessions.filter((s: any) => s.status === "SUBMITTED").length;
  const unsyncedCount = sessions.filter((s: any) => !s.syncedToMain && s.status === "SUBMITTED").length;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold">{session.centerName}</h1>
              <p className="text-sm text-muted-foreground">Center Code: {session.centerCode}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="gap-1">
              <Wifi className="w-3 h-3 text-green-500" />
              Connected
            </Badge>
            <Button variant="outline" size="sm" onClick={() => logoutMutation.mutate()} data-testid="button-logout">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Waiting</p>
                  <p className="text-2xl font-bold">{waitingCount}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold">{inProgressCount}</p>
                </div>
                <Play className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Submitted</p>
                  <p className="text-2xl font-bold">{submittedCount}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Sync</p>
                  <p className="text-2xl font-bold">{unsyncedCount}</p>
                </div>
                <Upload className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="exams" className="space-y-4">
          <TabsList>
            <TabsTrigger value="exams">Assigned Exams</TabsTrigger>
            <TabsTrigger value="candidates">Candidates</TabsTrigger>
            <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
            <TabsTrigger value="sync">Sync Status</TabsTrigger>
          </TabsList>

          <TabsContent value="exams">
            <Card>
              <CardHeader>
                <CardTitle>Assigned Exams</CardTitle>
                <CardDescription>Select an exam to manage candidates and sessions</CardDescription>
              </CardHeader>
              <CardContent>
                {examsLoading ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  </div>
                ) : exams.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No exams assigned to this center yet
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {exams.map((assignment: any) => (
                      <Card 
                        key={assignment.id} 
                        className={`cursor-pointer transition-colors ${selectedExam === assignment.examId ? 'border-primary' : ''}`}
                        onClick={() => setSelectedExam(assignment.examId)}
                      >
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold">{assignment.exam?.title || "Exam"}</h3>
                              <p className="text-sm text-muted-foreground">
                                {assignment.assignedCandidates} candidates assigned
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Reporting: {assignment.reportingTime || "Not set"}
                              </p>
                            </div>
                            <Badge variant={selectedExam === assignment.examId ? "default" : "outline"}>
                              {selectedExam === assignment.examId ? "Selected" : "Select"}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="candidates">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Candidates</CardTitle>
                  <CardDescription>
                    {selectedExam ? `Candidates for selected exam` : "Select an exam first"}
                  </CardDescription>
                </div>
                {selectedExam && (
                  <Dialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
                    <DialogTrigger asChild>
                      <Button data-testid="button-add-student">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Login Student
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Login Student to Exam</DialogTitle>
                        <DialogDescription>
                          Enter student details to create exam session
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Select Candidate</Label>
                          <select
                            className="w-full p-2 border rounded"
                            value={studentLoginData.candidateId}
                            onChange={(e) => setStudentLoginData({ ...studentLoginData, candidateId: parseInt(e.target.value) })}
                          >
                            <option value={0}>Select candidate...</option>
                            {candidates.map((c: any) => (
                              <option key={c.id} value={c.id}>
                                {c.name} - {c.rollNumber}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Seat Number</Label>
                            <Input
                              placeholder="e.g., A-15"
                              value={studentLoginData.seatNumber}
                              onChange={(e) => setStudentLoginData({ ...studentLoginData, seatNumber: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Computer Number</Label>
                            <Input
                              placeholder="e.g., PC-15"
                              value={studentLoginData.computerNumber}
                              onChange={(e) => setStudentLoginData({ ...studentLoginData, computerNumber: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Student IP Address (LAN)</Label>
                          <Input
                            placeholder="e.g., 192.168.1.101"
                            value={studentLoginData.studentIpAddress}
                            onChange={(e) => setStudentLoginData({ ...studentLoginData, studentIpAddress: e.target.value })}
                          />
                        </div>
                        <Button
                          className="w-full"
                          onClick={() => studentLoginMutation.mutate({
                            examId: selectedExam,
                            ...studentLoginData,
                          })}
                          disabled={studentLoginMutation.isPending || !studentLoginData.candidateId}
                        >
                          {studentLoginMutation.isPending ? "Creating Session..." : "Create Session"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </CardHeader>
              <CardContent>
                {!selectedExam ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Please select an exam from the Assigned Exams tab
                  </div>
                ) : candidates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No candidates found for this exam
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Roll Number</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Registration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {candidates.map((candidate: any) => {
                        const hasSession = sessions.find((s: any) => s.candidateId === candidate.id);
                        return (
                          <TableRow key={candidate.id}>
                            <TableCell className="font-mono">{candidate.rollNumber}</TableCell>
                            <TableCell>{candidate.name}</TableCell>
                            <TableCell>{candidate.registrationNumber}</TableCell>
                            <TableCell>
                              {hasSession ? getStatusBadge(hasSession.status) : <Badge variant="outline">Not Logged In</Badge>}
                            </TableCell>
                            <TableCell>
                              {!hasSession && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setStudentLoginData({ ...studentLoginData, candidateId: candidate.id });
                                    setLoginDialogOpen(true);
                                  }}
                                >
                                  Login
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Active Sessions</CardTitle>
                  <CardDescription>Monitor and control student exam sessions</CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/center-admin/sessions"] })}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </CardHeader>
              <CardContent>
                {sessions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No active sessions
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Seat</TableHead>
                        <TableHead>Computer</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Started</TableHead>
                        <TableHead>Synced</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessions.map((session: any) => (
                        <TableRow key={session.id}>
                          <TableCell>{session.seatNumber || "-"}</TableCell>
                          <TableCell>{session.computerNumber || "-"}</TableCell>
                          <TableCell className="font-mono text-sm">{session.studentIpAddress || "-"}</TableCell>
                          <TableCell>{getStatusBadge(session.status)}</TableCell>
                          <TableCell>
                            {session.examStartTime 
                              ? new Date(session.examStartTime).toLocaleTimeString() 
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {session.syncedToMain 
                              ? <CheckCircle className="w-4 h-4 text-green-500" />
                              : <WifiOff className="w-4 h-4 text-orange-500" />}
                          </TableCell>
                          <TableCell>
                            {session.status === "WAITING" && (
                              <Button
                                size="sm"
                                onClick={() => startExamMutation.mutate(session.id)}
                                disabled={startExamMutation.isPending}
                              >
                                <Play className="w-4 h-4 mr-1" />
                                Start
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sync">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Sync to Main Server</CardTitle>
                  <CardDescription>
                    Upload completed exam responses to the main admin server
                  </CardDescription>
                </div>
                <Button
                  onClick={() => syncMutation.mutate()}
                  disabled={syncMutation.isPending || unsyncedCount === 0}
                  data-testid="button-sync"
                >
                  {syncMutation.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Sync Now ({unsyncedCount})
                    </>
                  )}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-medium">Sync Status</span>
                      <Badge variant={unsyncedCount > 0 ? "destructive" : "default"}>
                        {unsyncedCount > 0 ? `${unsyncedCount} Pending` : "All Synced"}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-green-600">
                          {sessions.filter((s: any) => s.syncedToMain).length}
                        </p>
                        <p className="text-sm text-muted-foreground">Synced</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-orange-600">{unsyncedCount}</p>
                        <p className="text-sm text-muted-foreground">Pending</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{sessions.length}</p>
                        <p className="text-sm text-muted-foreground">Total</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">LAN Server Info</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Server IP: {session.lanServerIp || "Not configured"}</p>
                      <p>Port: {session.lanServerPort || 3000}</p>
                      <p className="text-xs mt-2">
                        Students connect to this IP via LAN cable. All responses are saved locally 
                        and synced to the main server when you click "Sync Now".
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
