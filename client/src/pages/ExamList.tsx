import { useExams } from "@/hooks/use-exams";
import { Link } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar, Search } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

export default function ExamList() {
  const { data: exams, isLoading } = useExams();
  const [search, setSearch] = useState("");

  const filteredExams = exams?.filter(e => 
    e.title.toLowerCase().includes(search.toLowerCase()) || 
    e.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <div className="container-custom py-6 md:py-10 flex-1">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-primary">Active Examinations</h1>
            <p className="text-sm md:text-base text-muted-foreground">Browse and apply for ongoing recruitments.</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by Exam Name or Code..." 
              className="pl-9 bg-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[1,2,3,4].map(i => <div key={i} className="h-64 bg-slate-200 rounded-xl animate-pulse" />)}
          </div>
        ) : filteredExams?.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="text-xl font-medium text-muted-foreground">No exams found matching your search.</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredExams?.map((exam) => (
              <Card key={exam.id} className="flex flex-col hover:shadow-lg transition-all border-t-4 border-t-secondary">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <Badge variant="outline" className="font-mono">{exam.code}</Badge>
                    <Badge className={exam.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {exam.isActive ? "Active" : "Closed"}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg md:text-xl">{exam.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {exam.description}
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between border-b border-dashed pb-2 gap-2">
                      <span className="text-muted-foreground">Vacancies</span>
                      <span className="font-semibold">{exam.totalVacancies}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed pb-2 gap-2">
                      <span className="text-muted-foreground">Application Ends</span>
                      <span className="font-semibold text-destructive flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {exam.applyEndDate ? format(new Date(exam.applyEndDate), 'dd MMM yyyy') : 'TBD'}
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-4 bg-slate-50">
                  <Button className="w-full" asChild disabled={!exam.isActive}>
                    <Link href={`/exams/${exam.id}`}>
                      {exam.isActive ? "Apply Online" : "View Details"}
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
