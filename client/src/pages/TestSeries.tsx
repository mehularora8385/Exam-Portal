import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { JobAlertsHeader } from "@/components/JobAlertsHeader";
import { JobAlertsFooter } from "@/components/JobAlertsFooter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, Clock, Users, Star, ChevronRight, GraduationCap,
  FileText, Timer, Flame, BookOpen, Award, Play
} from "lucide-react";

const EXAM_CATEGORIES = [
  { id: "ALL", label: "All Tests", icon: BookOpen },
  { id: "SSC", label: "SSC", icon: GraduationCap },
  { id: "UPSC", label: "UPSC", icon: Award },
  { id: "RAILWAY", label: "Railway", icon: FileText },
  { id: "BANK", label: "Bank", icon: FileText },
  { id: "STATE_PSC", label: "State PSC", icon: GraduationCap },
  { id: "POLICE", label: "Police", icon: FileText },
  { id: "DEFENCE", label: "Defence", icon: Award },
];

export default function TestSeries() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  const { data: testSeries, isLoading } = useQuery<any[]>({
    queryKey: ["/api/test-series"],
  });

  const filteredTests = testSeries?.filter(test => {
    const matchesSearch = !searchQuery || 
      test.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.examName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "ALL" || test.examCategory === selectedCategory;
    
    return matchesSearch && matchesCategory && test.isActive;
  })?.sort((a, b) => {
    if (a.isPopular && !b.isPopular) return -1;
    if (!a.isPopular && b.isPopular) return 1;
    return (b.attemptCount || 0) - (a.attemptCount || 0);
  }) || [];

  const popularTests = testSeries?.filter(t => t.isPopular && t.isActive).slice(0, 4) || [];
  const freeTests = testSeries?.filter(t => t.isFree && t.isActive).slice(0, 6) || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-gray-900 dark:to-gray-800">
      <JobAlertsHeader />

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            <GraduationCap className="inline w-8 h-8 mr-2 text-orange-600" />
            Test Series & Mock Tests
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Practice with our free and premium mock tests for SSC, UPSC, Railway, Bank and more
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search tests by name or exam..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 bg-white dark:bg-gray-800"
              data-testid="input-search-tests"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {EXAM_CATEGORIES.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
              className={selectedCategory === cat.id ? "bg-orange-600 hover:bg-orange-700" : ""}
              data-testid={`btn-category-${cat.id.toLowerCase()}`}
            >
              <cat.icon className="w-4 h-4 mr-1" />
              {cat.label}
            </Button>
          ))}
        </div>

        {popularTests.length > 0 && selectedCategory === "ALL" && !searchQuery && (
          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              Popular Tests
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {popularTests.map((test) => (
                <Card key={test.id} className="hover:shadow-lg transition-shadow border-orange-200 dark:border-orange-800">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base line-clamp-2">{test.title}</CardTitle>
                      {test.isFree && (
                        <Badge className="bg-green-500 shrink-0">FREE</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-2 mb-3 text-xs text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {test.totalQuestions} Qs
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {test.duration} min
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {test.attemptCount || 0}
                      </span>
                    </div>
                    <Badge variant="outline" className="mb-3">{test.examCategory}</Badge>
                    <Link href={`/job-alerts/test-series/${test.id}/take`}>
                      <Button 
                        className="w-full bg-orange-600 hover:bg-orange-700"
                        size="sm"
                        data-testid={`btn-start-test-${test.id}`}
                      >
                        <Play className="w-4 h-4 mr-1" /> Start Test
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {freeTests.length > 0 && selectedCategory === "ALL" && !searchQuery && (
          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Free Mock Tests
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {freeTests.map((test) => (
                <Card key={test.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold line-clamp-2">{test.title}</h3>
                      <Badge className="bg-green-500 shrink-0">FREE</Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {test.description || test.examName}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-3 text-xs text-gray-500">
                        <span>{test.totalQuestions} Qs</span>
                        <span>{test.duration} min</span>
                      </div>
                      <Link href={`/job-alerts/test-series/${test.id}/take`}>
                        <Button size="sm" variant="outline" data-testid={`btn-attempt-${test.id}`}>
                          <Play className="w-3 h-3 mr-1" /> Attempt
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-xl font-bold mb-4">
            {selectedCategory === "ALL" ? "All Tests" : `${selectedCategory} Tests`}
            <span className="text-sm font-normal text-gray-500 ml-2">({filteredTests.length} tests)</span>
          </h2>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-3" />
                    <Skeleton className="h-8 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredTests.length === 0 ? (
            <Card className="p-8 text-center">
              <GraduationCap className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Tests Available</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery ? "Try adjusting your search terms" : "Check back soon for new test series"}
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTests.map((test) => (
                <Card key={test.id} className="hover:shadow-md transition-shadow" data-testid={`test-card-${test.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold line-clamp-2">{test.title}</h3>
                      <div className="flex gap-1 shrink-0">
                        {test.isPopular && (
                          <Badge variant="outline" className="border-orange-500 text-orange-500">
                            <Flame className="w-3 h-3 mr-1" /> Popular
                          </Badge>
                        )}
                        {test.isFree ? (
                          <Badge className="bg-green-500">FREE</Badge>
                        ) : (
                          <Badge className="bg-blue-500">₹{test.price}</Badge>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {test.description || `${test.examCategory} - ${test.examName || 'Mock Test'}`}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        <FileText className="w-3 h-3" />
                        {test.totalQuestions} Questions
                      </span>
                      <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        <Timer className="w-3 h-3" />
                        {test.duration} mins
                      </span>
                      <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        <Award className="w-3 h-3" />
                        {test.totalMarks} marks
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{test.examCategory}</Badge>
                      <span className="text-xs text-gray-500">
                        <Users className="w-3 h-3 inline mr-1" />
                        {test.attemptCount || 0} attempts
                      </span>
                    </div>
                    
                    <Link href={`/job-alerts/test-series/${test.id}/take`}>
                      <Button 
                        className="w-full mt-3 bg-orange-600 hover:bg-orange-700"
                        data-testid={`btn-start-${test.id}`}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        {test.isFree ? "Start Free Test" : "Start Test"}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>

      <JobAlertsFooter />
    </div>
  );
}
