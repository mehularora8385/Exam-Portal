import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Plus, Pencil, Trash2, Eye, Search, Flame, Star, Users, Clock,
  GraduationCap, Award, FileText, BookOpen, ArrowLeft, LayoutDashboard
} from "lucide-react";

const testSeriesFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  examCategory: z.string().min(1, "Category is required"),
  examName: z.string().min(1, "Exam name is required"),
  totalQuestions: z.string().regex(/^\d+$/, "Must be a number"),
  totalMarks: z.string().regex(/^\d+$/, "Must be a number"),
  duration: z.string().regex(/^\d+$/, "Must be a number"),
  negativeMarking: z.string().optional(),
  difficulty: z.string(),
  instructions: z.string().optional(),
  price: z.string().regex(/^\d+$/, "Must be a number"),
  isFree: z.boolean(),
  isActive: z.boolean(),
  isPopular: z.boolean(),
});

const EXAM_CATEGORIES = [
  { value: "SSC", label: "SSC" },
  { value: "UPSC", label: "UPSC" },
  { value: "RAILWAY", label: "Railway" },
  { value: "BANK", label: "Bank" },
  { value: "STATE_PSC", label: "State PSC" },
  { value: "POLICE", label: "Police" },
  { value: "DEFENCE", label: "Defence" },
  { value: "OTHER", label: "Other" },
];

const DIFFICULTY_LEVELS = [
  { value: "EASY", label: "Easy" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HARD", label: "Hard" },
];

export default function ManageTestSeries() {
  const { user, isAuthenticated, isAdmin, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const { toast } = useToast();

  const { data: testSeries, isLoading } = useQuery<any[]>({
    queryKey: ["/api/test-series"],
  });

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) {
      setLocation("/login");
    }
  }, [isAuthenticated, isAdmin, authLoading, setLocation]);

  const form = useForm<z.infer<typeof testSeriesFormSchema>>({
    resolver: zodResolver(testSeriesFormSchema),
    defaultValues: {
      title: "",
      description: "",
      examCategory: "SSC",
      examName: "",
      totalQuestions: "100",
      totalMarks: "200",
      duration: "60",
      negativeMarking: "0.25",
      difficulty: "MEDIUM",
      instructions: "",
      price: "0",
      isFree: true,
      isActive: true,
      isPopular: false,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/test-series", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/test-series"] });
      setIsDialogOpen(false);
      form.reset();
      toast({ title: "Success", description: "Test series created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", `/api/test-series/${editingTest.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/test-series"] });
      setIsDialogOpen(false);
      setEditingTest(null);
      form.reset();
      toast({ title: "Success", description: "Test series updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/test-series/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/test-series"] });
      toast({ title: "Success", description: "Test series deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleEdit = (test: any) => {
    setEditingTest(test);
    form.reset({
      title: test.title || "",
      description: test.description || "",
      examCategory: test.examCategory || "SSC",
      examName: test.examName || "",
      totalQuestions: String(test.totalQuestions || 100),
      totalMarks: String(test.totalMarks || 200),
      duration: String(test.duration || 60),
      negativeMarking: test.negativeMarking || "0.25",
      difficulty: test.difficulty || "MEDIUM",
      instructions: test.instructions || "",
      price: String(test.price || 0),
      isFree: test.isFree ?? true,
      isActive: test.isActive ?? true,
      isPopular: test.isPopular ?? false,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (data: any) => {
    const payload = {
      ...data,
      totalQuestions: parseInt(data.totalQuestions) || 100,
      totalMarks: parseInt(data.totalMarks) || 200,
      duration: parseInt(data.duration) || 60,
      price: parseInt(data.price) || 0,
    };

    if (editingTest) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const filteredTests = testSeries?.filter(test => {
    const matchesSearch = !searchQuery || 
      test.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.examName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "ALL" || test.examCategory === filterCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  if (authLoading || (!isAuthenticated || !isAdmin)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-8 h-8" />
            <div>
              <h1 className="text-xl font-bold">Test Series Management</h1>
              <p className="text-xs text-primary-foreground/70">Create and manage mock tests</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="text-primary-foreground hover:bg-primary-foreground/10">
              <Link href="/admin"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Admin</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle>Test Series</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setEditingTest(null);
                form.reset();
              }
            }}>
              <DialogTrigger asChild>
                <Button data-testid="btn-add-test">
                  <Plus className="w-4 h-4 mr-2" /> Add New Test
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingTest ? "Edit Test Series" : "Add New Test Series"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="SSC CGL Mock Test 1" required data-testid="input-title" />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="examCategory"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Exam Category *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-exam-category">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {EXAM_CATEGORIES.map((cat) => (
                                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="examName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Specific Exam</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="CGL 2026" data-testid="input-exam-name" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Full-length mock test based on latest pattern..." data-testid="input-description" />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="totalQuestions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Total Questions</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" data-testid="input-total-questions" />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="totalMarks"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Total Marks</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" data-testid="input-total-marks" />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="duration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Duration (mins)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" data-testid="input-duration" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="negativeMarking"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Negative Marking</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="0.25" data-testid="input-negative-marking" />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="difficulty"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Difficulty</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-difficulty">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {DIFFICULTY_LEVELS.map((level) => (
                                  <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price (₹) - Set 0 for free</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" data-testid="input-price" />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="instructions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Test Instructions</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Read all questions carefully..." rows={3} data-testid="input-instructions" />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="flex flex-wrap gap-6">
                      <FormField
                        control={form.control}
                        name="isFree"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2">
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-is-free" />
                            </FormControl>
                            <FormLabel className="!mt-0">Free Test</FormLabel>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="isPopular"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2">
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-is-popular" />
                            </FormControl>
                            <FormLabel className="!mt-0">Popular/Featured</FormLabel>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2">
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-is-active" />
                            </FormControl>
                            <FormLabel className="!mt-0">Active</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createMutation.isPending || updateMutation.isPending}
                        data-testid="btn-save-test"
                      >
                        {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingTest ? "Update" : "Create"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardHeader>

          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search tests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[180px]" data-testid="select-filter-category">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  {EXAM_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : filteredTests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <GraduationCap className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>No test series found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Questions</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Attempts</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTests.map((test) => (
                      <TableRow key={test.id} data-testid={`test-row-${test.id}`}>
                        <TableCell>
                          <div>
                            <span className="font-medium">{test.title}</span>
                            {test.isPopular && (
                              <Badge className="ml-2 bg-orange-500"><Flame className="w-3 h-3 mr-1" /> Popular</Badge>
                            )}
                          </div>
                          {test.examName && <span className="text-xs text-gray-500">{test.examName}</span>}
                        </TableCell>
                        <TableCell><Badge variant="outline">{test.examCategory}</Badge></TableCell>
                        <TableCell>{test.totalQuestions}</TableCell>
                        <TableCell>{test.duration} min</TableCell>
                        <TableCell>
                          {test.isFree ? (
                            <Badge className="bg-green-500">FREE</Badge>
                          ) : (
                            <span>₹{test.price}</span>
                          )}
                        </TableCell>
                        <TableCell>{test.attemptCount || 0}</TableCell>
                        <TableCell>
                          {test.isActive ? (
                            <Badge className="bg-green-500">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Link href={`/admin/test-series/${test.id}/questions`}>
                              <Button variant="ghost" size="icon" title="Manage Questions" data-testid={`btn-questions-${test.id}`}>
                                <FileText className="w-4 h-4 text-blue-500" />
                              </Button>
                            </Link>
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(test)} data-testid={`btn-edit-${test.id}`}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => {
                                if (confirm("Are you sure you want to delete this test?")) {
                                  deleteMutation.mutate(test.id);
                                }
                              }}
                              data-testid={`btn-delete-${test.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
