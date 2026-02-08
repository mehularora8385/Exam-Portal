import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Plus, Pencil, Trash2, ArrowLeft, FileText, CheckCircle, XCircle, 
  Search, ChevronLeft, ChevronRight, Image, FileTextIcon, ChevronDown
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";

const questionFormSchema = z.object({
  paragraph: z.string().optional(),
  paragraphImage: z.string().optional(),
  questionText: z.string().min(1, "Question text is required"),
  questionImage: z.string().optional(),
  optionA: z.string().min(1, "Option A is required"),
  optionB: z.string().min(1, "Option B is required"),
  optionC: z.string().optional(),
  optionD: z.string().optional(),
  optionAImage: z.string().optional(),
  optionBImage: z.string().optional(),
  optionCImage: z.string().optional(),
  optionDImage: z.string().optional(),
  correctAnswer: z.string().min(1, "Correct answer is required"),
  explanation: z.string().optional(),
  section: z.string().optional(),
  marks: z.string().regex(/^\d+$/, "Must be a number"),
  questionOrder: z.string().regex(/^\d+$/, "Must be a number"),
});

const SECTIONS = [
  { value: "Reasoning", label: "Reasoning" },
  { value: "Quantitative Aptitude", label: "Quantitative Aptitude" },
  { value: "English", label: "English" },
  { value: "General Awareness", label: "General Awareness" },
  { value: "General Science", label: "General Science" },
  { value: "Indian History", label: "Indian History" },
  { value: "Indian Polity", label: "Indian Polity" },
  { value: "Geography", label: "Geography" },
  { value: "Banking Awareness", label: "Banking Awareness" },
  { value: "Computer Knowledge", label: "Computer Knowledge" },
  { value: "Current Affairs", label: "Current Affairs" },
  { value: "General", label: "General" },
];

export default function ManageTestQuestions() {
  const [, params] = useRoute("/admin/test-series/:testId/questions");
  const testId = params?.testId;
  const { user, isAuthenticated, isAdmin, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [deleteQuestionId, setDeleteQuestionId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSection, setFilterSection] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const questionsPerPage = 20;
  const { toast } = useToast();

  const { data: testSeries, isLoading: testLoading } = useQuery<any>({
    queryKey: ["/api/test-series", testId],
    enabled: !!testId,
  });

  const { data: questions, isLoading: questionsLoading } = useQuery<any[]>({
    queryKey: ["/api/test-series", testId, "questions"],
    enabled: !!testId,
  });

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) {
      setLocation("/login");
    }
  }, [isAuthenticated, isAdmin, authLoading, setLocation]);

  const form = useForm<z.infer<typeof questionFormSchema>>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      paragraph: "",
      paragraphImage: "",
      questionText: "",
      questionImage: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      optionAImage: "",
      optionBImage: "",
      optionCImage: "",
      optionDImage: "",
      correctAnswer: "A",
      explanation: "",
      section: "General",
      marks: "2",
      questionOrder: "1",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/test-series/${testId}/questions`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/test-series", testId, "questions"] });
      setIsDialogOpen(false);
      form.reset();
      toast({ title: "Success", description: "Question added successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to add question", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", `/api/test-questions/${editingQuestion.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/test-series", testId, "questions"] });
      setIsDialogOpen(false);
      setEditingQuestion(null);
      form.reset();
      toast({ title: "Success", description: "Question updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update question", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/test-questions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/test-series", testId, "questions"] });
      setDeleteQuestionId(null);
      toast({ title: "Success", description: "Question deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete question", variant: "destructive" });
    },
  });

  const onSubmit = (data: z.infer<typeof questionFormSchema>) => {
    const payload = {
      ...data,
      marks: parseInt(data.marks),
      questionOrder: parseInt(data.questionOrder),
      testSeriesId: parseInt(testId!),
    };
    
    if (editingQuestion) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const openEditDialog = (question: any) => {
    setEditingQuestion(question);
    form.reset({
      paragraph: question.paragraph || "",
      paragraphImage: question.paragraphImage || "",
      questionText: question.questionText || "",
      questionImage: question.questionImage || "",
      optionA: question.optionA || "",
      optionB: question.optionB || "",
      optionC: question.optionC || "",
      optionD: question.optionD || "",
      optionAImage: question.optionAImage || "",
      optionBImage: question.optionBImage || "",
      optionCImage: question.optionCImage || "",
      optionDImage: question.optionDImage || "",
      correctAnswer: question.correctAnswer || "A",
      explanation: question.explanation || "",
      section: question.section || "General",
      marks: String(question.marks || 2),
      questionOrder: String(question.questionOrder || 1),
    });
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingQuestion(null);
    const nextOrder = (questions?.length || 0) + 1;
    form.reset({
      paragraph: "",
      paragraphImage: "",
      questionText: "",
      questionImage: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      optionAImage: "",
      optionBImage: "",
      optionCImage: "",
      optionDImage: "",
      correctAnswer: "A",
      explanation: "",
      section: "General",
      marks: "2",
      questionOrder: String(nextOrder),
    });
    setIsDialogOpen(true);
  };

  const filteredQuestions = (questions || []).filter((q: any) => {
    const matchesSearch = q.questionText?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSection = filterSection === "ALL" || q.section === filterSection;
    return matchesSearch && matchesSection;
  });

  const totalPages = Math.ceil(filteredQuestions.length / questionsPerPage);
  const paginatedQuestions = filteredQuestions.slice(
    (currentPage - 1) * questionsPerPage,
    currentPage * questionsPerPage
  );

  const uniqueSections = Array.from(new Set((questions || []).map((q: any) => q.section).filter(Boolean)));

  if (authLoading || testLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-10 w-64 mb-6" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setLocation("/admin/test-series")}
              data-testid="btn-back"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Manage Questions</h1>
              <p className="text-sm text-muted-foreground">
                {testSeries?.title} ({questions?.length || 0} questions)
              </p>
            </div>
          </div>
          <Button onClick={openNewDialog} data-testid="btn-add-question">
            <Plus className="w-4 h-4 mr-1" /> Add Question
          </Button>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input 
                  placeholder="Search questions..." 
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search"
                />
              </div>
              <Select value={filterSection} onValueChange={setFilterSection}>
                <SelectTrigger className="w-full md:w-48" data-testid="select-section-filter">
                  <SelectValue placeholder="Filter by section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Sections</SelectItem>
                  {uniqueSections.map((section) => (
                    <SelectItem key={section} value={section}>{section}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {questionsLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No questions found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || filterSection !== "ALL" 
                    ? "Try adjusting your search or filter"
                    : "Add your first question to this test"}
                </p>
                {!searchQuery && filterSection === "ALL" && (
                  <Button onClick={openNewDialog}>
                    <Plus className="w-4 h-4 mr-1" /> Add First Question
                  </Button>
                )}
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">#</TableHead>
                      <TableHead>Question</TableHead>
                      <TableHead className="w-32">Section</TableHead>
                      <TableHead className="w-24 text-center">Answer</TableHead>
                      <TableHead className="w-20 text-center">Marks</TableHead>
                      <TableHead className="w-28 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedQuestions.map((question: any, idx: number) => (
                      <TableRow key={question.id} data-testid={`row-question-${question.id}`}>
                        <TableCell className="font-medium">
                          {(currentPage - 1) * questionsPerPage + idx + 1}
                        </TableCell>
                        <TableCell>
                          <p className="line-clamp-2 text-sm">{question.questionText}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {question.section || "General"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-green-600">{question.correctAnswer}</Badge>
                        </TableCell>
                        <TableCell className="text-center">{question.marks || 2}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button 
                              size="icon" 
                              variant="ghost"
                              onClick={() => openEditDialog(question)}
                              data-testid={`btn-edit-${question.id}`}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost"
                              onClick={() => setDeleteQuestionId(question.id)}
                              data-testid={`btn-delete-${question.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between p-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Showing {(currentPage - 1) * questionsPerPage + 1} to{" "}
                      {Math.min(currentPage * questionsPerPage, filteredQuestions.length)} of{" "}
                      {filteredQuestions.length} questions
                    </p>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => p - 1)}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => p + 1)}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? "Edit Question" : "Add New Question"}
            </DialogTitle>
            <DialogDescription>
              Fill in the question details below. Options C and D are optional for true/false style questions.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Paragraph/Passage Section */}
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" type="button" className="w-full justify-between" data-testid="btn-toggle-paragraph">
                    <span className="flex items-center gap-2">
                      <FileTextIcon className="w-4 h-4" />
                      Paragraph/Passage (for comprehension questions)
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 pt-3">
                  <FormField
                    control={form.control}
                    name="paragraph"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Paragraph Text</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter a passage/paragraph that the question is based on..."
                            className="min-h-32"
                            data-testid="input-paragraph"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="paragraphImage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Paragraph Image URL</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://example.com/paragraph-image.jpg"
                            data-testid="input-paragraph-image"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CollapsibleContent>
              </Collapsible>

              {/* Question Section */}
              <FormField
                control={form.control}
                name="questionText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question Text *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter the question..."
                        className="min-h-24"
                        data-testid="input-question-text"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="questionImage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Image className="w-4 h-4" />
                      Question Image URL
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://example.com/question-image.jpg"
                        data-testid="input-question-image"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="optionA"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Option A *</FormLabel>
                      <FormControl>
                        <Input placeholder="Option A" data-testid="input-option-a" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="optionB"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Option B *</FormLabel>
                      <FormControl>
                        <Input placeholder="Option B" data-testid="input-option-b" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="optionC"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Option C</FormLabel>
                      <FormControl>
                        <Input placeholder="Option C (optional)" data-testid="input-option-c" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="optionD"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Option D</FormLabel>
                      <FormControl>
                        <Input placeholder="Option D (optional)" data-testid="input-option-d" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Option Images (Collapsible) */}
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" type="button" className="w-full justify-between" data-testid="btn-toggle-option-images">
                    <span className="flex items-center gap-2">
                      <Image className="w-4 h-4" />
                      Option Images (for visual answer choices)
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 pt-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="optionAImage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Option A Image URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://..." data-testid="input-option-a-image" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="optionBImage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Option B Image URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://..." data-testid="input-option-b-image" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="optionCImage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Option C Image URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://..." data-testid="input-option-c-image" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="optionDImage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Option D Image URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://..." data-testid="input-option-d-image" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="correctAnswer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correct Answer *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-correct-answer">
                            <SelectValue placeholder="Select answer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="A">A</SelectItem>
                          <SelectItem value="B">B</SelectItem>
                          <SelectItem value="C">C</SelectItem>
                          <SelectItem value="D">D</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="marks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marks</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" data-testid="input-marks" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="section"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Section</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-section">
                            <SelectValue placeholder="Select section" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SECTIONS.map((section) => (
                            <SelectItem key={section.value} value={section.value}>
                              {section.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="explanation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Explanation (shown after test)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Explain the correct answer..."
                        className="min-h-20"
                        data-testid="input-explanation"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="questionOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question Order</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" data-testid="input-order" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="btn-save-question"
                >
                  {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : "Save Question"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteQuestionId} onOpenChange={() => setDeleteQuestionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The question will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteQuestionId && deleteMutation.mutate(deleteQuestionId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
