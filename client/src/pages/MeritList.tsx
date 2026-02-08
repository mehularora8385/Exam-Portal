import { useState } from "react";
import { Link, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Trophy, Search, Download, Users, Filter } from "lucide-react";

interface MeritResult {
  rollNumber: string;
  candidateName: string;
  fatherName: string;
  category: string;
  rank: number;
  status: string;
  stage: string;
}

interface Exam {
  id: number;
  code: string;
  title: string;
  conductingBody: string;
  cutoffs: any;
}

export default function MeritList() {
  const [match, params] = useRoute("/results/:examId/merit-list");
  const examId = params?.examId;
  
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const { data: exam, isLoading: examLoading } = useQuery<Exam>({
    queryKey: ["/api/exams", examId],
    enabled: !!examId,
  });

  const { data: results, isLoading: resultsLoading } = useQuery<MeritResult[]>({
    queryKey: ["/api/exams", examId, "results", "public"],
    enabled: !!examId,
  });

  const isLoading = examLoading || resultsLoading;

  const filteredResults = results?.filter(r => {
    const matchesSearch = !searchQuery || 
      r.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.candidateName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || r.category === categoryFilter;
    return matchesSearch && matchesCategory;
  }) || [];

  const qualifiedCount = results?.filter(r => r.status === "QUALIFIED").length || 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <Skeleton className="h-12 w-64 mb-4" />
          <Skeleton className="h-96" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" asChild>
            <Link href="/results">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Results
            </Link>
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader className="bg-primary/5">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Trophy className="w-6 h-6" /> Merit List - {exam?.title}
                </CardTitle>
                <p className="text-muted-foreground mt-1">{exam?.code}</p>
              </div>
              <Badge className="bg-green-600">
                {qualifiedCount} Qualified
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search by Roll Number or Name..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-merit"
                  />
                </div>
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[150px]" data-testid="select-category-filter">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="GEN">General</SelectItem>
                  <SelectItem value="OBC">OBC</SelectItem>
                  <SelectItem value="SC">SC</SelectItem>
                  <SelectItem value="ST">ST</SelectItem>
                  <SelectItem value="EWS">EWS</SelectItem>
                  <SelectItem value="PWD">PWD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filteredResults.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No results found</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-16">Rank</TableHead>
                      <TableHead>Roll Number</TableHead>
                      <TableHead>Candidate Name</TableHead>
                      <TableHead>Father's Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResults.map((result, index) => (
                      <TableRow key={result.rollNumber} data-testid={`row-merit-${result.rollNumber}`}>
                        <TableCell className="font-bold text-primary">
                          {result.rank || index + 1}
                        </TableCell>
                        <TableCell className="font-mono">{result.rollNumber}</TableCell>
                        <TableCell className="font-medium">{result.candidateName}</TableCell>
                        <TableCell>{result.fatherName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{result.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={result.status === "QUALIFIED" ? "bg-green-600" : "bg-red-600"}>
                            {result.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="mt-4 text-sm text-muted-foreground">
              Showing {filteredResults.length} of {results?.length || 0} results
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> This is the public merit list. Candidates can login to view their 
              detailed individual result with marks breakdown. For any discrepancy, please contact 
              the examination authority.
            </p>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
