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
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle, Eye, Edit } from "lucide-react";
import { format } from "date-fns";

export default function ManageRevaluations() {
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [revisedMarks, setRevisedMarks] = useState("");
  const [remarks, setRemarks] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: requests, isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/revaluation-requests"],
  });

  const processMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PUT", `/api/admin/revaluation-requests/${selectedRequest.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/revaluation-requests"] });
      toast({ title: "Revaluation processed successfully" });
      setDialogOpen(false);
      setSelectedRequest(null);
      setRevisedMarks("");
      setRemarks("");
    },
    onError: () => {
      toast({ title: "Failed to process revaluation", variant: "destructive" });
    }
  });

  const handleProcess = (status: string) => {
    processMutation.mutate({
      status,
      revisedMarks: revisedMarks ? Number(revisedMarks) : null,
      remarks,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case "PROCESSING":
        return <Badge className="bg-blue-500"><AlertCircle className="w-3 h-3 mr-1" /> Processing</Badge>;
      case "COMPLETED":
        return <Badge className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" /> Completed</Badge>;
      case "REJECTED":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredRequests = requests?.filter(r => 
    filterStatus === "all" || r.status === filterStatus
  ) || [];

  const pendingCount = requests?.filter(r => r.status === "PENDING").length || 0;
  const processingCount = requests?.filter(r => r.status === "PROCESSING").length || 0;

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
                <h1 className="text-2xl font-bold text-primary" data-testid="text-revaluations-title">
                  Manage Revaluation Requests
                </h1>
                <p className="text-muted-foreground">Process candidate revaluation applications</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary" className="text-lg px-3 py-1">
                Pending: {pendingCount}
              </Badge>
              <Badge className="bg-blue-500 text-lg px-3 py-1">
                Processing: {processingCount}
              </Badge>
            </div>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle>Revaluation Requests</CardTitle>
                <CardDescription>Review and process revaluation applications</CardDescription>
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PROCESSING">Processing</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-8 text-center">Loading...</div>
              ) : filteredRequests.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Request No.</TableHead>
                      <TableHead>Candidate</TableHead>
                      <TableHead>Exam</TableHead>
                      <TableHead>Roll No.</TableHead>
                      <TableHead>Original Marks</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Applied On</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((req: any) => (
                      <TableRow key={req.id}>
                        <TableCell className="font-medium">{req.requestNumber}</TableCell>
                        <TableCell>{req.candidateName || "-"}</TableCell>
                        <TableCell>{req.exam?.title || `Exam #${req.examId}`}</TableCell>
                        <TableCell>{req.rollNumber || "-"}</TableCell>
                        <TableCell>{req.previousMarks || "-"}</TableCell>
                        <TableCell>{getStatusBadge(req.status)}</TableCell>
                        <TableCell>{format(new Date(req.createdAt), "dd MMM yyyy")}</TableCell>
                        <TableCell>
                          <Dialog open={dialogOpen && selectedRequest?.id === req.id} onOpenChange={(open) => {
                            setDialogOpen(open);
                            if (!open) setSelectedRequest(null);
                          }}>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setSelectedRequest(req);
                                  setRevisedMarks(req.revisedMarks?.toString() || "");
                                  setRemarks(req.remarks || "");
                                  setDialogOpen(true);
                                }}
                              >
                                <Edit className="w-4 h-4 mr-1" /> Process
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Process Revaluation Request</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 mt-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div><strong>Request No:</strong> {req.requestNumber}</div>
                                  <div><strong>Candidate:</strong> {req.candidateName}</div>
                                  <div><strong>Roll Number:</strong> {req.rollNumber}</div>
                                  <div><strong>Previous Marks:</strong> {req.previousMarks}</div>
                                </div>
                                
                                <div className="space-y-2">
                                  <Label>Reason Given by Candidate</Label>
                                  <p className="text-sm bg-muted p-2 rounded">{req.reason || "No reason provided"}</p>
                                </div>

                                <div className="space-y-2">
                                  <Label>Revised Marks</Label>
                                  <Input 
                                    type="number"
                                    value={revisedMarks}
                                    onChange={(e) => setRevisedMarks(e.target.value)}
                                    placeholder="Enter revised marks after rechecking"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Admin Remarks</Label>
                                  <Textarea 
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    placeholder="Add remarks for this revaluation"
                                    rows={2}
                                  />
                                </div>

                                <div className="flex gap-2">
                                  <Button 
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                    onClick={() => handleProcess("COMPLETED")}
                                    disabled={processMutation.isPending}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" /> Complete
                                  </Button>
                                  <Button 
                                    variant="destructive"
                                    className="flex-1"
                                    onClick={() => handleProcess("REJECTED")}
                                    disabled={processMutation.isPending}
                                  >
                                    <XCircle className="w-4 h-4 mr-1" /> Reject
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  No revaluation requests found
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
