import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, FileText, Calendar, Users, Download } from "lucide-react";
import { format } from "date-fns";

interface Exam {
  id: number;
  code: string;
  title: string;
  conductingBody: string;
  resultDate: string | null;
  resultDeclared: boolean;
  cutoffs: {
    general?: number;
    obc?: number;
    sc?: number;
    st?: number;
    ews?: number;
    pwd?: number;
    female?: number;
    exServiceman?: number;
  } | null;
}

export default function Results() {
  const { data: exams, isLoading } = useQuery<Exam[]>({
    queryKey: ["/api/exams"]
  });

  const resultsExams = exams?.filter(e => e.resultDeclared && e.cutoffs) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header />
        <main className="container-custom py-10 flex-1">
          <Skeleton className="h-10 w-64 mb-8" />
          <div className="grid gap-6">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-48" />)}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      <main className="container-custom py-10 flex-1">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-primary mb-2 flex items-center gap-3">
            <Trophy className="w-8 h-8" /> Examination Results
          </h1>
          <p className="text-muted-foreground">View category-wise cutoff marks for declared results</p>
        </div>

        {resultsExams.length > 0 ? (
          <div className="space-y-6">
            {resultsExams.map((exam) => (
              <Card key={exam.id} className="overflow-hidden" data-testid={`card-result-${exam.id}`}>
                <CardHeader className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        {exam.title}
                      </CardTitle>
                      <CardDescription className="text-primary-foreground/80 mt-1">
                        {exam.conductingBody} | {exam.code}
                      </CardDescription>
                    </div>
                    <Badge className="bg-white/20 text-white border-white/30">
                      Result Declared
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Calendar className="w-4 h-4" />
                    Result Date: {exam.resultDate ? format(new Date(exam.resultDate), 'dd MMM yyyy') : 'N/A'}
                  </div>

                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Category-wise Cutoff Marks
                  </h4>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Cutoff Marks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {exam.cutoffs?.general !== undefined && (
                        <TableRow>
                          <TableCell>General / UR</TableCell>
                          <TableCell className="text-right font-bold">{exam.cutoffs.general}</TableCell>
                        </TableRow>
                      )}
                      {exam.cutoffs?.ews !== undefined && (
                        <TableRow>
                          <TableCell>EWS</TableCell>
                          <TableCell className="text-right font-bold">{exam.cutoffs.ews}</TableCell>
                        </TableRow>
                      )}
                      {exam.cutoffs?.obc !== undefined && (
                        <TableRow>
                          <TableCell>OBC</TableCell>
                          <TableCell className="text-right font-bold">{exam.cutoffs.obc}</TableCell>
                        </TableRow>
                      )}
                      {exam.cutoffs?.sc !== undefined && (
                        <TableRow>
                          <TableCell>SC</TableCell>
                          <TableCell className="text-right font-bold">{exam.cutoffs.sc}</TableCell>
                        </TableRow>
                      )}
                      {exam.cutoffs?.st !== undefined && (
                        <TableRow>
                          <TableCell>ST</TableCell>
                          <TableCell className="text-right font-bold">{exam.cutoffs.st}</TableCell>
                        </TableRow>
                      )}
                      {exam.cutoffs?.pwd !== undefined && (
                        <TableRow>
                          <TableCell>PWD</TableCell>
                          <TableCell className="text-right font-bold">{exam.cutoffs.pwd}</TableCell>
                        </TableRow>
                      )}
                      {exam.cutoffs?.exServiceman !== undefined && (
                        <TableRow>
                          <TableCell>Ex-Serviceman</TableCell>
                          <TableCell className="text-right font-bold">{exam.cutoffs.exServiceman}</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button variant="outline" asChild>
                      <Link href={`/exams/${exam.id}`}>View Exam Details</Link>
                    </Button>
                    <Button variant="default" asChild data-testid={`button-merit-list-${exam.id}`}>
                      <Link href={`/results/${exam.id}/merit-list`}>
                        <Users className="w-4 h-4 mr-2" /> View Merit List
                      </Link>
                    </Button>
                    <Button variant="outline" data-testid={`button-download-result-${exam.id}`}>
                      <Download className="w-4 h-4 mr-2" /> Download Result PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-16">
            <CardContent>
              <Trophy className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No Results Available</h3>
              <p className="text-muted-foreground mb-6">
                Results will appear here once they are declared by the Commission.
              </p>
              <Button asChild>
                <Link href="/exams">Browse Live Exams</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
}
