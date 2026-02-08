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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, FileText, Clock, CheckCircle, XCircle, AlertCircle, IndianRupee } from "lucide-react";
import { format } from "date-fns";

export default function Revaluation() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [selectedResult, setSelectedResult] = useState("");
  const [reason, setReason] = useState("");
  
  const { data: myResults } = useQuery<any[]>({
    queryKey: ["/api/my/results"],
    enabled: isAuthenticated,
  });

  const { data: revaluationRequests } = useQuery<any[]>({
    queryKey: ["/api/my/revaluation-requests"],
    enabled: isAuthenticated,
  });

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/revaluation/request", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my/revaluation-requests"] });
      toast({ title: "Revaluation request submitted successfully" });
      setSelectedResult("");
      setReason("");
    },
    onError: (error: any) => {
      toast({ title: error.message || "Failed to submit request", variant: "destructive" });
    }
  });

  const handleSubmit = () => {
    if (!selectedResult) {
      toast({ title: "Please select a result to apply for revaluation", variant: "destructive" });
      return;
    }
    submitMutation.mutate({
      resultId: Number(selectedResult),
      reason,
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

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="py-8 text-center">
              <h2 className="text-xl font-semibold mb-4">Login Required</h2>
              <p className="text-muted-foreground mb-4">Please login to apply for revaluation</p>
              <Button asChild>
                <Link href="/login">Login</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const eligibleResults = myResults?.filter(r => r.isPublished && r.status !== "ABSENT") || [];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard"><ArrowLeft className="w-5 h-5" /></Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-primary" data-testid="text-revaluation-title">
                Apply for Revaluation
              </h1>
              <p className="text-muted-foreground">Request rechecking of your answer sheets</p>
            </div>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>New Revaluation Request</CardTitle>
                <CardDescription>Select a result and provide reason for revaluation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Exam Result *</Label>
                  <Select value={selectedResult} onValueChange={setSelectedResult}>
                    <SelectTrigger data-testid="select-result">
                      <SelectValue placeholder="Select a published result" />
                    </SelectTrigger>
                    <SelectContent>
                      {eligibleResults.map((result: any) => (
                        <SelectItem key={result.id} value={String(result.id)}>
                          {result.exam?.title || `Exam #${result.examId}`} - Roll: {result.rollNumber} - Marks: {result.obtainedMarks}/{result.totalMarks}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Reason for Revaluation</Label>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Explain why you want revaluation (optional)"
                    rows={3}
                    data-testid="input-reason"
                  />
                </div>

                <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                    <IndianRupee className="w-5 h-5" />
                    <span className="font-medium">Revaluation Fee: ₹500 per subject</span>
                  </div>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    Payment will be collected after request approval
                  </p>
                </div>

                <Button 
                  onClick={handleSubmit} 
                  disabled={!selectedResult || submitMutation.isPending}
                  className="w-full"
                  data-testid="button-submit-revaluation"
                >
                  {submitMutation.isPending ? "Submitting..." : "Submit Revaluation Request"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>My Revaluation Requests</CardTitle>
                <CardDescription>Track the status of your revaluation applications</CardDescription>
              </CardHeader>
              <CardContent>
                {revaluationRequests && revaluationRequests.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Request No.</TableHead>
                        <TableHead>Exam</TableHead>
                        <TableHead>Previous Marks</TableHead>
                        <TableHead>Revised Marks</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Applied On</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {revaluationRequests.map((req: any) => (
                        <TableRow key={req.id}>
                          <TableCell className="font-medium">{req.requestNumber}</TableCell>
                          <TableCell>{req.exam?.title || `Exam #${req.examId}`}</TableCell>
                          <TableCell>{req.previousMarks || "-"}</TableCell>
                          <TableCell>
                            {req.status === "COMPLETED" ? (
                              <span className={req.marksChanged ? "text-green-600 font-medium" : ""}>
                                {req.revisedMarks || req.previousMarks}
                                {req.marksChanged && " ↑"}
                              </span>
                            ) : "-"}
                          </TableCell>
                          <TableCell>{getStatusBadge(req.status)}</TableCell>
                          <TableCell>{format(new Date(req.createdAt), "dd MMM yyyy")}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No revaluation requests yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
