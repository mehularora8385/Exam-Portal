import { useEffect } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Award, Download, CheckCircle2, XCircle, User, FileText, Printer } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

interface ResultData {
  result: {
    id: number;
    rollNumber: string;
    candidateName: string;
    fatherName: string;
    category: string;
    marks: any;
    totalMarks: number;
    obtainedMarks: number;
    percentage: string;
    rank: number;
    status: string;
    stage: string;
    remarks: string;
  };
  exam: {
    id: number;
    title: string;
    code: string;
    cutoffs: any;
  };
  candidate: {
    fullName: string;
    fatherName: string;
    dob: string;
    photoUrl: string;
  };
  application: {
    applicationNumber: string;
    rollNumber: string;
  };
}

export default function MyResult() {
  const [match, params] = useRoute("/my-result/:applicationId");
  const applicationId = params?.applicationId;
  
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [_, setLocation] = useLocation();

  const { data, isLoading, error } = useQuery<ResultData>({
    queryKey: ["/api/my/result", applicationId],
    enabled: !!applicationId && isAuthenticated,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, authLoading, setLocation]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-4xl mx-auto px-6 py-8">
          <Skeleton className="h-96" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-4xl mx-auto px-6 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <p className="text-lg font-medium">Result not available</p>
              <p className="text-muted-foreground mt-2">
                The result for this exam has not been declared yet or you don't have access.
              </p>
              <Button asChild className="mt-6">
                <Link href="/dashboard">Back to Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const { result, exam, candidate, application } = data;
  const isQualified = result.status === "QUALIFIED";

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
            </Link>
          </Button>
          <Button onClick={handlePrint} data-testid="button-print-result">
            <Printer className="w-4 h-4 mr-2" /> Print Result
          </Button>
        </div>

        <Card className="print:shadow-none print:border-2" data-testid="card-result-details">
          <CardHeader className="border-b bg-primary/5 print:bg-transparent">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">{exam.title}</CardTitle>
                <p className="text-muted-foreground">{exam.code}</p>
              </div>
              <Badge 
                className={isQualified ? "bg-green-600" : "bg-red-600"} 
                data-testid="badge-result-status"
              >
                {result.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-start gap-6 mb-6">
              {candidate.photoUrl && (
                <img 
                  src={candidate.photoUrl} 
                  alt="Candidate Photo" 
                  className="w-24 h-28 object-cover border rounded"
                />
              )}
              <div className="flex-1 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Candidate Name</p>
                  <p className="font-semibold" data-testid="text-candidate-name">{candidate.fullName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Father's Name</p>
                  <p className="font-medium">{candidate.fatherName || result.fatherName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Roll Number</p>
                  <p className="font-mono font-semibold" data-testid="text-roll-number">{result.rollNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-medium">{result.category}</p>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Award className="w-5 h-5" /> Result Details
              </h3>
              
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Stage / Tier</TableCell>
                    <TableCell>{result.stage}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Total Marks</TableCell>
                    <TableCell>{result.totalMarks}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Obtained Marks</TableCell>
                    <TableCell className="font-semibold text-lg" data-testid="text-obtained-marks">
                      {result.obtainedMarks}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Percentage</TableCell>
                    <TableCell>{result.percentage}%</TableCell>
                  </TableRow>
                  {result.rank && (
                    <TableRow>
                      <TableCell className="font-medium">Rank</TableCell>
                      <TableCell className="font-semibold" data-testid="text-rank">{result.rank}</TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell className="font-medium">Status</TableCell>
                    <TableCell>
                      <Badge className={isQualified ? "bg-green-600" : "bg-red-600"}>
                        {result.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                  {result.remarks && (
                    <TableRow>
                      <TableCell className="font-medium">Remarks</TableCell>
                      <TableCell>{result.remarks}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {exam.cutoffs && (
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-3">Category-wise Cutoff Marks</h4>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    {exam.cutoffs.general && (
                      <div>
                        <p className="text-muted-foreground">General</p>
                        <p className="font-medium">{exam.cutoffs.general}</p>
                      </div>
                    )}
                    {exam.cutoffs.obc && (
                      <div>
                        <p className="text-muted-foreground">OBC</p>
                        <p className="font-medium">{exam.cutoffs.obc}</p>
                      </div>
                    )}
                    {exam.cutoffs.sc && (
                      <div>
                        <p className="text-muted-foreground">SC</p>
                        <p className="font-medium">{exam.cutoffs.sc}</p>
                      </div>
                    )}
                    {exam.cutoffs.st && (
                      <div>
                        <p className="text-muted-foreground">ST</p>
                        <p className="font-medium">{exam.cutoffs.st}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> This is your personal result. For any discrepancies, 
                please contact the examination authority with your roll number and application number.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
