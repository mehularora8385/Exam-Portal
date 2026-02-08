import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Plus, Pencil, Trash2, Eye, Search, Flame, Star, Building2, Users, Calendar,
  ExternalLink, FileText, Briefcase, Award, ClipboardList, BookOpen, GraduationCap, RefreshCw, Rss
} from "lucide-react";
import { format, parseISO, isValid } from "date-fns";

const CATEGORIES = [
  { value: "LATEST_JOB", label: "Latest Job", icon: Briefcase },
  { value: "RESULT", label: "Result", icon: Award },
  { value: "ADMIT_CARD", label: "Admit Card", icon: ClipboardList },
  { value: "ANSWER_KEY", label: "Answer Key", icon: BookOpen },
  { value: "SYLLABUS", label: "Syllabus", icon: GraduationCap },
  { value: "ADMISSION", label: "Admission", icon: GraduationCap },
  { value: "IMPORTANT", label: "Important", icon: Star },
];

const JOB_TYPES = [
  { value: "GOVERNMENT", label: "Government Job", icon: Building2 },
  { value: "PRIVATE", label: "Private Job", icon: Briefcase },
];

const STATES = [
  "All India", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", 
  "Chhattisgarh", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh",
  "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", 
  "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

function safeFormatDate(dateValue: any, formatStr: string = "dd MMM yyyy"): string {
  if (!dateValue) return "-";
  try {
    const date = typeof dateValue === "string" ? parseISO(dateValue) : new Date(dateValue);
    return isValid(date) ? format(date, formatStr) : "-";
  } catch {
    return "-";
  }
}

export default function ManageJobAlerts() {
  const { user, isAuthenticated, isAdmin, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const { toast } = useToast();

  const { data: jobAlerts, isLoading } = useQuery<any[]>({
    queryKey: ["/api/job-alerts"],
  });

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) {
      setLocation("/login");
    }
  }, [isAuthenticated, isAdmin, authLoading, setLocation]);

  const form = useForm({
    defaultValues: {
      title: "",
      shortDescription: "",
      content: "",
      category: "LATEST_JOB",
      jobType: "GOVERNMENT",
      organization: "",
      postName: "",
      totalVacancies: "",
      qualifications: "",
      applicationStartDate: "",
      applicationEndDate: "",
      examDate: "",
      resultDate: "",
      admitCardDate: "",
      ageLimit: "",
      feeGeneral: "",
      feeScSt: "",
      feeFemale: "",
      feePwd: "",
      officialWebsite: "",
      applyOnlineLink: "",
      notificationPdfLink: "",
      syllabusLink: "",
      admitCardLink: "",
      resultLink: "",
      answerKeyLink: "",
      tags: "",
      state: "All India",
      isHot: false,
      isNew: true,
      isActive: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/job-alerts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-alerts"] });
      setIsDialogOpen(false);
      form.reset();
      toast({ title: "Success", description: "Job alert created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest("PUT", `/api/job-alerts/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-alerts"] });
      setIsDialogOpen(false);
      setEditingAlert(null);
      form.reset();
      toast({ title: "Success", description: "Job alert updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/job-alerts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-alerts"] });
      toast({ title: "Success", description: "Job alert deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const fetchRssMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/job-alerts/fetch-rss"),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-alerts"] });
      toast({ 
        title: "RSS Fetch Complete", 
        description: `Fetched ${data.fetched} jobs, saved ${data.saved} new jobs` 
      });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: any) => {
    const payload = {
      ...data,
      totalVacancies: data.totalVacancies ? parseInt(data.totalVacancies) : null,
      applicationFee: {
        general: data.feeGeneral ? parseInt(data.feeGeneral) : undefined,
        scSt: data.feeScSt ? parseInt(data.feeScSt) : undefined,
        female: data.feeFemale ? parseInt(data.feeFemale) : undefined,
        pwd: data.feePwd ? parseInt(data.feePwd) : undefined,
      },
      tags: data.tags ? data.tags.split(",").map((t: string) => t.trim()) : [],
      applicationStartDate: data.applicationStartDate || null,
      applicationEndDate: data.applicationEndDate || null,
      examDate: data.examDate || null,
      resultDate: data.resultDate || null,
      admitCardDate: data.admitCardDate || null,
    };

    delete payload.feeGeneral;
    delete payload.feeScSt;
    delete payload.feeFemale;
    delete payload.feePwd;

    if (editingAlert) {
      updateMutation.mutate({ id: editingAlert.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (alert: any) => {
    setEditingAlert(alert);
    form.reset({
      title: alert.title || "",
      shortDescription: alert.shortDescription || "",
      content: alert.content || "",
      category: alert.category || "LATEST_JOB",
      organization: alert.organization || "",
      postName: alert.postName || "",
      totalVacancies: alert.totalVacancies?.toString() || "",
      qualifications: alert.qualifications || "",
      applicationStartDate: alert.applicationStartDate?.split("T")[0] || "",
      applicationEndDate: alert.applicationEndDate?.split("T")[0] || "",
      examDate: alert.examDate?.split("T")[0] || "",
      resultDate: alert.resultDate?.split("T")[0] || "",
      admitCardDate: alert.admitCardDate?.split("T")[0] || "",
      ageLimit: alert.ageLimit || "",
      feeGeneral: alert.applicationFee?.general?.toString() || "",
      feeScSt: alert.applicationFee?.scSt?.toString() || "",
      feeFemale: alert.applicationFee?.female?.toString() || "",
      feePwd: alert.applicationFee?.pwd?.toString() || "",
      officialWebsite: alert.officialWebsite || "",
      applyOnlineLink: alert.applyOnlineLink || "",
      notificationPdfLink: alert.notificationPdfLink || "",
      syllabusLink: alert.syllabusLink || "",
      admitCardLink: alert.admitCardLink || "",
      resultLink: alert.resultLink || "",
      answerKeyLink: alert.answerKeyLink || "",
      tags: alert.tags?.join(", ") || "",
      state: alert.state || "All India",
      isHot: alert.isHot || false,
      isNew: alert.isNew || true,
      isActive: alert.isActive ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingAlert(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const filteredAlerts = jobAlerts?.filter(alert => {
    const matchesSearch = !searchQuery || 
      alert.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.organization?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "ALL" || alert.category === filterCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  const getCategoryBadge = (category: string) => {
    const styles: Record<string, string> = {
      LATEST_JOB: "bg-green-100 text-green-700",
      RESULT: "bg-blue-100 text-blue-700",
      ADMIT_CARD: "bg-orange-100 text-orange-700",
      ANSWER_KEY: "bg-purple-100 text-purple-700",
      SYLLABUS: "bg-cyan-100 text-cyan-700",
      ADMISSION: "bg-pink-100 text-pink-700",
      IMPORTANT: "bg-red-100 text-red-700",
    };
    return styles[category] || "bg-gray-100 text-gray-700";
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-100 p-8">
        <div className="max-w-7xl mx-auto">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Job Alerts Management</h1>
            <p className="text-xs text-primary-foreground/70">Manage RojgarHub job listings</p>
          </div>
          <Button variant="outline" size="sm" asChild className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
            <Link href="/admin">← Back to Admin</Link>
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold">Job Alerts & Notifications</h2>
            <p className="text-muted-foreground">Add jobs, results, admit cards and notifications</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => fetchRssMutation.mutate()}
              disabled={fetchRssMutation.isPending}
              data-testid="button-fetch-rss"
            >
              {fetchRssMutation.isPending ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Rss className="w-4 h-4 mr-2" />
              )}
              {fetchRssMutation.isPending ? "Fetching..." : "Fetch from RSS"}
            </Button>
            <Button onClick={handleAddNew} data-testid="button-add-job-alert">
              <Plus className="w-4 h-4 mr-2" />
              Add New Alert
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="border-b">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search alerts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-alerts"
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Last Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {alert.isHot && <Flame className="w-4 h-4 text-red-500" />}
                        {alert.isNew && <Badge className="bg-green-500 text-white text-xs">New</Badge>}
                        <span className="font-medium line-clamp-1">{alert.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getCategoryBadge(alert.category)}>
                        {CATEGORIES.find(c => c.value === alert.category)?.label || alert.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{alert.organization}</TableCell>
                    <TableCell className="text-sm">
                      {safeFormatDate(alert.applicationEndDate)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={alert.isActive ? "default" : "secondary"}>
                        {alert.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{alert.viewCount || 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/job-alerts/${alert.id}`}>
                          <Button variant="ghost" size="icon">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEdit(alert)}
                          data-testid={`button-edit-${alert.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-500"
                          onClick={() => {
                            if (confirm("Delete this alert?")) {
                              deleteMutation.mutate(alert.id);
                            }
                          }}
                          data-testid={`button-delete-${alert.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredAlerts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No job alerts found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAlert ? "Edit Job Alert" : "Add New Job Alert"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Title *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="SSC CGL 2024 Recruitment - 5000+ Posts" required />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="jobType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Type *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-job-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {JOB_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="organization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Staff Selection Commission" required />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="postName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Post Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Group B & C Posts" />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="totalVacancies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Vacancies</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" placeholder="5000" />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="qualifications"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Qualification</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Graduate from any recognized university" />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ageLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age Limit</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="18-27 years (relaxation as per rules)" />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State/Region</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {STATES.map((state) => (
                            <SelectItem key={state} value={state}>{state}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">Important Dates</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="applicationStartDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Application Start</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="applicationEndDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Date to Apply</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="examDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Exam Date</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="admitCardDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admit Card Date</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="resultDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Result Date</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">Application Fee (₹)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="feeGeneral"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>General/OBC</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="100" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="feeScSt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SC/ST</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="0" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="feeFemale"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Female</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="0" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="feePwd"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PwD</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="0" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">Important Links</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="applyOnlineLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apply Online Link</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://..." />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notificationPdfLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notification PDF</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://..." />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="syllabusLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Syllabus Link</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://..." />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="admitCardLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admit Card Link</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://..." />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="answerKeyLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Answer Key Link</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://..." />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="resultLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Result Link</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://..." />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="officialWebsite"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Official Website</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://..." />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="shortDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Short Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Brief overview of the job/notification..." rows={2} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Content (HTML)</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Detailed information..." rows={4} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags (comma separated)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="SSC, CGL, Government Job, Graduate" />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex flex-wrap gap-6 border-t pt-4">
                <FormField
                  control={form.control}
                  name="isHot"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="!mt-0 flex items-center gap-1">
                        <Flame className="w-4 h-4 text-red-500" /> Mark as Hot
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isNew"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="!mt-0">Show "New" Badge</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="!mt-0">Active</FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingAlert ? "Update" : "Create"} Job Alert
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      </main>
    </div>
  );
}
