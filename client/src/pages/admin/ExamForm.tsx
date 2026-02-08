import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Save, Send, FileText, Calendar, Users, CreditCard, Upload, Settings, MapPin, Info, Briefcase, Plus, Trash2 } from "lucide-react";

interface PostItem {
  id: string;
  postCode: string;
  postName: string;
  numberOfPosts: number;
  payScale?: string;
  minimumQualification?: string;
  fees?: {
    general?: number;
    obc?: number;
    sc?: number;
    st?: number;
    female?: number;
    pwd?: number;
    exServiceman?: number;
    ews?: number;
  };
  notificationPdfUrl?: string;
}

interface ExamFormProps {
  exam?: any;
  isEditing?: boolean;
}

export default function ExamForm({ exam, isEditing = false }: ExamFormProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("basic");
  const [posts, setPosts] = useState<PostItem[]>(exam?.posts || []);

  const form = useForm({
    defaultValues: {
      // Basic Info
      code: exam?.code || "",
      title: exam?.title || "",
      description: exam?.description || "",
      conductingBody: exam?.conductingBody || "SSC",
      subdomain: exam?.subdomain || "",
      postName: exam?.postName || "",
      totalVacancies: exam?.totalVacancies || 0,
      advertisementNumber: exam?.advertisementNumber || "",
      notificationPdfUrl: exam?.notificationPdfUrl || "",
      
      // Important Dates
      applyStartDate: exam?.applyStartDate ? new Date(exam.applyStartDate).toISOString().split('T')[0] : "",
      applyEndDate: exam?.applyEndDate ? new Date(exam.applyEndDate).toISOString().split('T')[0] : "",
      feeLastDate: exam?.feeLastDate ? new Date(exam.feeLastDate).toISOString().split('T')[0] : "",
      admitCardDate: exam?.admitCardDate ? new Date(exam.admitCardDate).toISOString().split('T')[0] : "",
      examDate: exam?.examDate ? new Date(exam.examDate).toISOString().split('T')[0] : "",
      resultDate: exam?.resultDate ? new Date(exam.resultDate).toISOString().split('T')[0] : "",
      
      // Eligibility
      minAge: exam?.minAge || 18,
      maxAge: exam?.maxAge || 35,
      ageRelaxationSC: exam?.ageRelaxation?.sc || 5,
      ageRelaxationST: exam?.ageRelaxation?.st || 5,
      ageRelaxationOBC: exam?.ageRelaxation?.obc || 3,
      ageRelaxationPWD: exam?.ageRelaxation?.pwd || 10,
      ageRelaxationExServiceman: exam?.ageRelaxation?.exServiceman || 5,
      educationRequired: exam?.educationRequired || "",
      experienceRequired: exam?.experienceRequired || "",
      eligibilityNotes: exam?.eligibilityNotes || "",
      
      // Fees
      feeGeneral: exam?.fees?.general || 0,
      feeOBC: exam?.fees?.obc || 0,
      feeSC: exam?.fees?.sc || 0,
      feeST: exam?.fees?.st || 0,
      feeFemale: exam?.fees?.female || 0,
      feePWD: exam?.fees?.pwd || 0,
      feeExServiceman: exam?.fees?.exServiceman || 0,
      feeEWS: exam?.fees?.ews || 0,
      
      // Documents
      docPhoto: exam?.documentsRequired?.photo?.required ?? true,
      docSignature: exam?.documentsRequired?.signature?.required ?? true,
      docIdProof: exam?.documentsRequired?.idProof?.required ?? true,
      docCaste: exam?.documentsRequired?.casteCertificate?.required ?? false,
      docEducation: exam?.documentsRequired?.educationCertificate?.required ?? true,
      docDomicile: exam?.documentsRequired?.domicileCertificate?.required ?? false,
      docIncome: exam?.documentsRequired?.incomeCertificate?.required ?? false,
      docPWD: exam?.documentsRequired?.pwdCertificate?.required ?? false,
      docExServiceman: exam?.documentsRequired?.exServicemanCertificate?.required ?? false,
      docNOC: exam?.documentsRequired?.nocCertificate?.required ?? false,
      
      // Payment
      paymentMode: exam?.paymentMode || "FREE",
      razorpayEnabled: exam?.razorpayEnabled || false,
      razorpayKeyId: exam?.razorpayKeyId || "",
      razorpayKeySecret: exam?.razorpayKeySecret || "",
      paymentMethodUPI: exam?.paymentMethods?.upi ?? true,
      paymentMethodCard: exam?.paymentMethods?.card ?? true,
      paymentMethodNetbanking: exam?.paymentMethods?.netbanking ?? true,
      paymentMethodWallet: exam?.paymentMethods?.wallet ?? false,
      paymentMethodEMI: exam?.paymentMethods?.emi ?? false,
      paymentMethodChallan: exam?.paymentMethods?.challan ?? false,
      ddPayableTo: exam?.ddDetails?.payableTo || "",
      ddBankName: exam?.ddDetails?.bankName || "",
      ddBranchAddress: exam?.ddDetails?.branchAddress || "",
      ddSendToAddress: exam?.ddDetails?.sendToAddress || "",
      
      // Exam Centers
      allowCityChange: exam?.examCenters?.allowCityChange ?? true,
      girlOnlyCenter: exam?.examCenters?.girlOnlyCenter ?? false,
      manualAllocation: exam?.examCenters?.manualAllocation ?? false,
      centerCities: exam?.examCenters?.cities?.map((c: any) => c.name).join(", ") || "",
      
      // Instructions
      examInstructions: exam?.examInstructions || "",
      uploadInstructions: exam?.uploadInstructions || "",
      refundPolicy: exam?.refundPolicy || "",
      generalInstructions: exam?.generalInstructions || "",
      
      // Status
      isActive: exam?.isActive ?? true,
      isDraft: exam?.isDraft ?? true,
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = transformFormData(data);
      if (isEditing && exam?.id) {
        return apiRequest("PUT", `/api/exams/${exam.id}`, payload);
      }
      return apiRequest("POST", "/api/exams", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
      toast({
        title: isEditing ? "Exam Updated" : "Exam Created",
        description: `Exam has been ${isEditing ? "updated" : "created"} successfully.`,
      });
      setLocation("/admin/exams");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save exam",
        variant: "destructive",
      });
    },
  });

  const transformFormData = (data: any) => {
    const centerCities = data.centerCities
      ? data.centerCities.split(",").map((c: string, i: number) => ({
          code: `CITY${i + 1}`,
          name: c.trim(),
          state: ""
        }))
      : [];

    return {
      code: data.code,
      title: data.title,
      description: data.description,
      conductingBody: data.conductingBody,
      subdomain: data.subdomain?.toUpperCase() || null,
      postName: data.postName,
      totalVacancies: parseInt(data.totalVacancies) || 0,
      advertisementNumber: data.advertisementNumber,
      notificationPdfUrl: data.notificationPdfUrl,
      applyStartDate: data.applyStartDate ? new Date(data.applyStartDate) : null,
      applyEndDate: data.applyEndDate ? new Date(data.applyEndDate) : null,
      feeLastDate: data.feeLastDate ? new Date(data.feeLastDate) : null,
      admitCardDate: data.admitCardDate ? new Date(data.admitCardDate) : null,
      examDate: data.examDate ? new Date(data.examDate) : null,
      resultDate: data.resultDate ? new Date(data.resultDate) : null,
      minAge: parseInt(data.minAge) || 18,
      maxAge: parseInt(data.maxAge) || 35,
      ageRelaxation: {
        sc: parseInt(data.ageRelaxationSC) || 5,
        st: parseInt(data.ageRelaxationST) || 5,
        obc: parseInt(data.ageRelaxationOBC) || 3,
        pwd: parseInt(data.ageRelaxationPWD) || 10,
        exServiceman: parseInt(data.ageRelaxationExServiceman) || 5,
      },
      educationRequired: data.educationRequired,
      experienceRequired: data.experienceRequired,
      eligibilityNotes: data.eligibilityNotes,
      fees: {
        general: parseInt(data.feeGeneral) || 0,
        obc: parseInt(data.feeOBC) || 0,
        sc: parseInt(data.feeSC) || 0,
        st: parseInt(data.feeST) || 0,
        female: parseInt(data.feeFemale) || 0,
        pwd: parseInt(data.feePWD) || 0,
        exServiceman: parseInt(data.feeExServiceman) || 0,
        ews: parseInt(data.feeEWS) || 0,
      },
      documentsRequired: {
        photo: { required: data.docPhoto },
        signature: { required: data.docSignature },
        idProof: { required: data.docIdProof },
        casteCertificate: { required: data.docCaste },
        educationCertificate: { required: data.docEducation },
        domicileCertificate: { required: data.docDomicile },
        incomeCertificate: { required: data.docIncome },
        pwdCertificate: { required: data.docPWD },
        exServicemanCertificate: { required: data.docExServiceman },
        nocCertificate: { required: data.docNOC },
      },
      paymentMode: data.paymentMode,
      razorpayEnabled: data.razorpayEnabled,
      razorpayKeyId: data.razorpayKeyId,
      razorpayKeySecret: data.razorpayKeySecret,
      paymentMethods: {
        upi: data.paymentMethodUPI,
        card: data.paymentMethodCard,
        netbanking: data.paymentMethodNetbanking,
        wallet: data.paymentMethodWallet,
        emi: data.paymentMethodEMI,
        challan: data.paymentMethodChallan,
      },
      ddDetails: {
        payableTo: data.ddPayableTo,
        bankName: data.ddBankName,
        branchAddress: data.ddBranchAddress,
        sendToAddress: data.ddSendToAddress,
      },
      examCenters: {
        cities: centerCities,
        allowCityChange: data.allowCityChange,
        girlOnlyCenter: data.girlOnlyCenter,
        manualAllocation: data.manualAllocation,
      },
      examInstructions: data.examInstructions,
      uploadInstructions: data.uploadInstructions,
      refundPolicy: data.refundPolicy,
      generalInstructions: data.generalInstructions,
      posts: posts,
      isActive: data.isActive,
      isDraft: data.isDraft,
    };
  };

  const addPost = () => {
    const newPost: PostItem = {
      id: `post-${Date.now()}`,
      postCode: "",
      postName: "",
      numberOfPosts: 0,
      payScale: "",
      minimumQualification: "",
      fees: { general: 0, obc: 0, sc: 0, st: 0, female: 0, pwd: 0, exServiceman: 0, ews: 0 },
      notificationPdfUrl: ""
    };
    setPosts([...posts, newPost]);
  };

  const removePost = (id: string) => {
    setPosts(posts.filter(p => p.id !== id));
  };

  const updatePost = (id: string, field: string, value: any) => {
    setPosts(posts.map(p => {
      if (p.id !== id) return p;
      if (field.startsWith('fees.')) {
        const feeField = field.split('.')[1];
        return { ...p, fees: { ...p.fees, [feeField]: parseInt(value) || 0 } };
      }
      return { ...p, [field]: value };
    }));
  };

  const onSubmit = (data: any) => {
    saveMutation.mutate(data);
  };

  const publishExam = () => {
    const data = form.getValues();
    data.isDraft = false;
    saveMutation.mutate(data);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/admin/exams")} data-testid="button-back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">{isEditing ? "Edit Exam" : "Create New Exam"}</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-5 lg:grid-cols-9 gap-1">
              <TabsTrigger value="basic" className="flex items-center gap-1 text-xs">
                <FileText className="h-3 w-3" /> Basic
              </TabsTrigger>
              <TabsTrigger value="posts" className="flex items-center gap-1 text-xs">
                <Briefcase className="h-3 w-3" /> Posts
              </TabsTrigger>
              <TabsTrigger value="dates" className="flex items-center gap-1 text-xs">
                <Calendar className="h-3 w-3" /> Dates
              </TabsTrigger>
              <TabsTrigger value="eligibility" className="flex items-center gap-1 text-xs">
                <Users className="h-3 w-3" /> Eligibility
              </TabsTrigger>
              <TabsTrigger value="fees" className="flex items-center gap-1 text-xs">
                <CreditCard className="h-3 w-3" /> Fees
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center gap-1 text-xs">
                <Upload className="h-3 w-3" /> Documents
              </TabsTrigger>
              <TabsTrigger value="payment" className="flex items-center gap-1 text-xs">
                <Settings className="h-3 w-3" /> Payment
              </TabsTrigger>
              <TabsTrigger value="centers" className="flex items-center gap-1 text-xs">
                <MapPin className="h-3 w-3" /> Centers
              </TabsTrigger>
              <TabsTrigger value="instructions" className="flex items-center gap-1 text-xs">
                <Info className="h-3 w-3" /> Instructions
              </TabsTrigger>
            </TabsList>

            {/* Section 1: Basic Info */}
            <TabsContent value="basic">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Exam Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="code" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exam Code *</FormLabel>
                      <FormControl><Input placeholder="e.g., CGL-2024" {...field} data-testid="input-exam-code" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="subdomain" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subdomain</FormLabel>
                      <FormControl><Input placeholder="e.g., RRB, SSC, UPSC" {...field} data-testid="input-subdomain" /></FormControl>
                      <p className="text-xs text-muted-foreground">For subdomain routing (e.g., RRB.examinationportal.com)</p>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exam Title *</FormLabel>
                      <FormControl><Input placeholder="Full exam name" {...field} data-testid="input-exam-title" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="conductingBody" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conducting Body *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-conducting-body">
                            <SelectValue placeholder="Select body" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="SSC">SSC (Staff Selection Commission)</SelectItem>
                          <SelectItem value="RRB">RRB (Railway Recruitment Board)</SelectItem>
                          <SelectItem value="UPSC">UPSC</SelectItem>
                          <SelectItem value="State PSC">State PSC</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="postName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Post Name</FormLabel>
                      <FormControl><Input placeholder="e.g., Junior Assistant" {...field} data-testid="input-post-name" /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="totalVacancies" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Vacancies</FormLabel>
                      <FormControl><Input type="number" {...field} data-testid="input-vacancies" /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="advertisementNumber" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Advertisement Number</FormLabel>
                      <FormControl><Input placeholder="e.g., HQ-PPI03/11/2024" {...field} data-testid="input-adv-number" /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="notificationPdfUrl" render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Notification PDF URL</FormLabel>
                      <FormControl><Input placeholder="https://..." {...field} data-testid="input-notification-pdf" /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Description</FormLabel>
                      <FormControl><Textarea rows={4} placeholder="Exam description..." {...field} data-testid="input-description" /></FormControl>
                    </FormItem>
                  )} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Posts Management - Multi-Post Support */}
            <TabsContent value="posts">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Posts / Positions</CardTitle>
                    <CardDescription>Add multiple posts for this examination (SSC-style multi-post support)</CardDescription>
                  </div>
                  <Button type="button" onClick={addPost} data-testid="button-add-post">
                    <Plus className="h-4 w-4 mr-2" /> Add Post
                  </Button>
                </CardHeader>
                <CardContent>
                  {posts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No posts added yet. Click "Add Post" to add positions for this exam.</p>
                      <p className="text-sm mt-2">Each post can have its own post code, vacancies, pay scale, and category-wise fees.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {posts.map((post, index) => (
                        <div key={post.id} className="border rounded-lg p-4 bg-slate-50 relative">
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="absolute top-2 right-2 text-destructive"
                            onClick={() => removePost(post.id)}
                            data-testid={`button-remove-post-${index}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          
                          <h4 className="font-semibold text-primary mb-4">Post #{index + 1}</h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                            <div className="space-y-1">
                              <Label className="text-xs">Post Code *</Label>
                              <Input 
                                placeholder="e.g., AAO, JSO" 
                                value={post.postCode}
                                onChange={(e) => updatePost(post.id, 'postCode', e.target.value)}
                                data-testid={`input-post-code-${index}`}
                              />
                            </div>
                            <div className="space-y-1 md:col-span-2">
                              <Label className="text-xs">Post Name *</Label>
                              <Input 
                                placeholder="e.g., Assistant Audit Officer" 
                                value={post.postName}
                                onChange={(e) => updatePost(post.id, 'postName', e.target.value)}
                                data-testid={`input-post-name-${index}`}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Number of Posts *</Label>
                              <Input 
                                type="number" 
                                placeholder="0" 
                                value={post.numberOfPosts || ''}
                                onChange={(e) => updatePost(post.id, 'numberOfPosts', parseInt(e.target.value) || 0)}
                                data-testid={`input-post-vacancies-${index}`}
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="space-y-1">
                              <Label className="text-xs">Pay Scale / Grade Pay</Label>
                              <Input 
                                placeholder="e.g., Level 8 (47600-151100)" 
                                value={post.payScale || ''}
                                onChange={(e) => updatePost(post.id, 'payScale', e.target.value)}
                                data-testid={`input-post-pay-${index}`}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Minimum Qualification</Label>
                              <Input 
                                placeholder="e.g., Graduate" 
                                value={post.minimumQualification || ''}
                                onChange={(e) => updatePost(post.id, 'minimumQualification', e.target.value)}
                                data-testid={`input-post-qual-${index}`}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Post Notification PDF URL</Label>
                              <Input 
                                placeholder="https://..." 
                                value={post.notificationPdfUrl || ''}
                                onChange={(e) => updatePost(post.id, 'notificationPdfUrl', e.target.value)}
                                data-testid={`input-post-pdf-${index}`}
                              />
                            </div>
                          </div>
                          
                          <div className="mt-4 pt-4 border-t">
                            <Label className="text-xs font-semibold text-primary mb-2 block">Category-wise Fee for this Post (if different from exam fees)</Label>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
                              <div className="space-y-1">
                                <Label className="text-xs">General</Label>
                                <Input 
                                  type="number" 
                                  placeholder="0" 
                                  value={post.fees?.general || ''}
                                  onChange={(e) => updatePost(post.id, 'fees.general', e.target.value)}
                                  data-testid={`input-post-fee-gen-${index}`}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">OBC</Label>
                                <Input 
                                  type="number" 
                                  placeholder="0" 
                                  value={post.fees?.obc || ''}
                                  onChange={(e) => updatePost(post.id, 'fees.obc', e.target.value)}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">SC</Label>
                                <Input 
                                  type="number" 
                                  placeholder="0" 
                                  value={post.fees?.sc || ''}
                                  onChange={(e) => updatePost(post.id, 'fees.sc', e.target.value)}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">ST</Label>
                                <Input 
                                  type="number" 
                                  placeholder="0" 
                                  value={post.fees?.st || ''}
                                  onChange={(e) => updatePost(post.id, 'fees.st', e.target.value)}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">EWS</Label>
                                <Input 
                                  type="number" 
                                  placeholder="0" 
                                  value={post.fees?.ews || ''}
                                  onChange={(e) => updatePost(post.id, 'fees.ews', e.target.value)}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Female</Label>
                                <Input 
                                  type="number" 
                                  placeholder="0" 
                                  value={post.fees?.female || ''}
                                  onChange={(e) => updatePost(post.id, 'fees.female', e.target.value)}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">PWD</Label>
                                <Input 
                                  type="number" 
                                  placeholder="0" 
                                  value={post.fees?.pwd || ''}
                                  onChange={(e) => updatePost(post.id, 'fees.pwd', e.target.value)}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Ex-SM</Label>
                                <Input 
                                  type="number" 
                                  placeholder="0" 
                                  value={post.fees?.exServiceman || ''}
                                  onChange={(e) => updatePost(post.id, 'fees.exServiceman', e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Section 2: Important Dates */}
            <TabsContent value="dates">
              <Card>
                <CardHeader>
                  <CardTitle>Important Dates</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <FormField control={form.control} name="applyStartDate" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apply Start Date *</FormLabel>
                      <FormControl><Input type="date" {...field} data-testid="input-apply-start" /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="applyEndDate" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apply End Date *</FormLabel>
                      <FormControl><Input type="date" {...field} data-testid="input-apply-end" /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="feeLastDate" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fee Payment Last Date</FormLabel>
                      <FormControl><Input type="date" {...field} data-testid="input-fee-last" /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="admitCardDate" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Admit Card Date</FormLabel>
                      <FormControl><Input type="date" {...field} data-testid="input-admit-card" /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="examDate" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exam Date</FormLabel>
                      <FormControl><Input type="date" {...field} data-testid="input-exam-date" /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="resultDate" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Result Date</FormLabel>
                      <FormControl><Input type="date" {...field} data-testid="input-result-date" /></FormControl>
                    </FormItem>
                  )} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Section 3: Eligibility */}
            <TabsContent value="eligibility">
              <Card>
                <CardHeader>
                  <CardTitle>Eligibility Criteria</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <FormField control={form.control} name="minAge" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Age</FormLabel>
                        <FormControl><Input type="number" {...field} data-testid="input-min-age" /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="maxAge" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Age</FormLabel>
                        <FormControl><Input type="number" {...field} data-testid="input-max-age" /></FormControl>
                      </FormItem>
                    )} />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Age Relaxation (in years)</Label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <FormField control={form.control} name="ageRelaxationSC" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">SC</FormLabel>
                          <FormControl><Input type="number" {...field} data-testid="input-relax-sc" /></FormControl>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="ageRelaxationST" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">ST</FormLabel>
                          <FormControl><Input type="number" {...field} data-testid="input-relax-st" /></FormControl>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="ageRelaxationOBC" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">OBC</FormLabel>
                          <FormControl><Input type="number" {...field} data-testid="input-relax-obc" /></FormControl>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="ageRelaxationPWD" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">PWD</FormLabel>
                          <FormControl><Input type="number" {...field} data-testid="input-relax-pwd" /></FormControl>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="ageRelaxationExServiceman" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Ex-Serviceman</FormLabel>
                          <FormControl><Input type="number" {...field} data-testid="input-relax-ex" /></FormControl>
                        </FormItem>
                      )} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="educationRequired" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Education Required</FormLabel>
                        <FormControl><Textarea rows={2} placeholder="e.g., Graduate from recognized university" {...field} data-testid="input-education" /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="experienceRequired" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Experience Required (Optional)</FormLabel>
                        <FormControl><Textarea rows={2} placeholder="e.g., 2 years in relevant field" {...field} data-testid="input-experience" /></FormControl>
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="eligibilityNotes" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Eligibility Notes</FormLabel>
                      <FormControl><Textarea rows={3} {...field} data-testid="input-eligibility-notes" /></FormControl>
                    </FormItem>
                  )} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Section 4: Fees */}
            <TabsContent value="fees">
              <Card>
                <CardHeader>
                  <CardTitle>Category-wise Application Fees (in Rupees)</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <FormField control={form.control} name="feeGeneral" render={({ field }) => (
                    <FormItem>
                      <FormLabel>General</FormLabel>
                      <FormControl><Input type="number" {...field} data-testid="input-fee-general" /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="feeOBC" render={({ field }) => (
                    <FormItem>
                      <FormLabel>OBC</FormLabel>
                      <FormControl><Input type="number" {...field} data-testid="input-fee-obc" /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="feeSC" render={({ field }) => (
                    <FormItem>
                      <FormLabel>SC</FormLabel>
                      <FormControl><Input type="number" {...field} data-testid="input-fee-sc" /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="feeST" render={({ field }) => (
                    <FormItem>
                      <FormLabel>ST</FormLabel>
                      <FormControl><Input type="number" {...field} data-testid="input-fee-st" /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="feeFemale" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Female</FormLabel>
                      <FormControl><Input type="number" {...field} data-testid="input-fee-female" /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="feePWD" render={({ field }) => (
                    <FormItem>
                      <FormLabel>PWD</FormLabel>
                      <FormControl><Input type="number" {...field} data-testid="input-fee-pwd" /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="feeExServiceman" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ex-Serviceman</FormLabel>
                      <FormControl><Input type="number" {...field} data-testid="input-fee-ex" /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="feeEWS" render={({ field }) => (
                    <FormItem>
                      <FormLabel>EWS</FormLabel>
                      <FormControl><Input type="number" {...field} data-testid="input-fee-ews" /></FormControl>
                    </FormItem>
                  )} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Section 5: Documents */}
            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <CardTitle>Required Documents</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {[
                    { name: "docPhoto", label: "Photo" },
                    { name: "docSignature", label: "Signature" },
                    { name: "docIdProof", label: "ID Proof" },
                    { name: "docCaste", label: "Caste Certificate" },
                    { name: "docEducation", label: "Education Certificate" },
                    { name: "docDomicile", label: "Domicile Certificate" },
                    { name: "docIncome", label: "Income Certificate" },
                    { name: "docPWD", label: "PWD Certificate" },
                    { name: "docExServiceman", label: "Ex-Serviceman Certificate" },
                    { name: "docNOC", label: "NOC Certificate" },
                  ].map((doc) => (
                    <FormField key={doc.name} control={form.control} name={doc.name as any} render={({ field }) => (
                      <FormItem className="flex items-center gap-2 space-y-0">
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} data-testid={`switch-${doc.name}`} />
                        </FormControl>
                        <FormLabel className="text-sm">{doc.label}</FormLabel>
                      </FormItem>
                    )} />
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Section 6: Payment */}
            <TabsContent value="payment">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField control={form.control} name="paymentMode" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Mode</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-payment-mode">
                            <SelectValue placeholder="Select mode" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="FREE">Free (No Payment)</SelectItem>
                          <SelectItem value="ONLINE">Online Payment Only</SelectItem>
                          <SelectItem value="DD">Demand Draft Only</SelectItem>
                          <SelectItem value="BOTH">Both Online & DD</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />

                  {(form.watch("paymentMode") === "ONLINE" || form.watch("paymentMode") === "BOTH") && (
                    <div className="border p-4 rounded-md space-y-4">
                      <h4 className="font-medium">Razorpay Configuration</h4>
                      <FormField control={form.control} name="razorpayEnabled" render={({ field }) => (
                        <FormItem className="flex items-center gap-2 space-y-0">
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-razorpay" />
                          </FormControl>
                          <FormLabel>Enable Razorpay</FormLabel>
                        </FormItem>
                      )} />
                      {form.watch("razorpayEnabled") && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField control={form.control} name="razorpayKeyId" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Razorpay Key ID</FormLabel>
                              <FormControl><Input {...field} data-testid="input-razorpay-key" /></FormControl>
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="razorpayKeySecret" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Razorpay Key Secret</FormLabel>
                              <FormControl><Input type="password" {...field} data-testid="input-razorpay-secret" /></FormControl>
                            </FormItem>
                          )} />
                        </div>
                      )}

                      <div className="mt-4">
                        <h4 className="font-medium mb-3">Allowed Payment Methods</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <FormField control={form.control} name="paymentMethodUPI" render={({ field }) => (
                            <FormItem className="flex items-center gap-2 space-y-0">
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-payment-upi" />
                              </FormControl>
                              <FormLabel>UPI</FormLabel>
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="paymentMethodCard" render={({ field }) => (
                            <FormItem className="flex items-center gap-2 space-y-0">
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-payment-card" />
                              </FormControl>
                              <FormLabel>Credit/Debit Card</FormLabel>
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="paymentMethodNetbanking" render={({ field }) => (
                            <FormItem className="flex items-center gap-2 space-y-0">
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-payment-netbanking" />
                              </FormControl>
                              <FormLabel>Net Banking</FormLabel>
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="paymentMethodWallet" render={({ field }) => (
                            <FormItem className="flex items-center gap-2 space-y-0">
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-payment-wallet" />
                              </FormControl>
                              <FormLabel>Wallet</FormLabel>
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="paymentMethodEMI" render={({ field }) => (
                            <FormItem className="flex items-center gap-2 space-y-0">
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-payment-emi" />
                              </FormControl>
                              <FormLabel>EMI</FormLabel>
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="paymentMethodChallan" render={({ field }) => (
                            <FormItem className="flex items-center gap-2 space-y-0">
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-payment-challan" />
                              </FormControl>
                              <FormLabel>Challan</FormLabel>
                            </FormItem>
                          )} />
                        </div>
                      </div>
                    </div>
                  )}

                  {(form.watch("paymentMode") === "DD" || form.watch("paymentMode") === "BOTH") && (
                    <div className="border p-4 rounded-md space-y-4">
                      <h4 className="font-medium">DD (Demand Draft) Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="ddPayableTo" render={({ field }) => (
                          <FormItem>
                            <FormLabel>DD Payable To</FormLabel>
                            <FormControl><Input {...field} data-testid="input-dd-payable" /></FormControl>
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="ddBankName" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bank Name</FormLabel>
                            <FormControl><Input {...field} data-testid="input-dd-bank" /></FormControl>
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="ddBranchAddress" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Branch Address</FormLabel>
                            <FormControl><Input {...field} data-testid="input-dd-branch" /></FormControl>
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="ddSendToAddress" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Send DD To Address</FormLabel>
                            <FormControl><Textarea rows={2} {...field} data-testid="input-dd-address" /></FormControl>
                          </FormItem>
                        )} />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Section 7: Exam Centers */}
            <TabsContent value="centers">
              <Card>
                <CardHeader>
                  <CardTitle>Exam Center Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="allowCityChange" render={({ field }) => (
                      <FormItem className="flex items-center gap-2 space-y-0">
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-city-change" />
                        </FormControl>
                        <FormLabel>Allow City Change</FormLabel>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="girlOnlyCenter" render={({ field }) => (
                      <FormItem className="flex items-center gap-2 space-y-0">
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-girl-center" />
                        </FormControl>
                        <FormLabel>Girl Only Center Option</FormLabel>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="manualAllocation" render={({ field }) => (
                      <FormItem className="flex items-center gap-2 space-y-0">
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-manual-alloc" />
                        </FormControl>
                        <FormLabel>Manual Allocation</FormLabel>
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="centerCities" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exam Center Cities (comma-separated)</FormLabel>
                      <FormControl>
                        <Textarea 
                          rows={3} 
                          placeholder="Delhi, Mumbai, Kolkata, Chennai, Bangalore..." 
                          {...field} 
                          data-testid="input-center-cities"
                        />
                      </FormControl>
                    </FormItem>
                  )} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Section 8: Instructions */}
            <TabsContent value="instructions">
              <Card>
                <CardHeader>
                  <CardTitle>Instructions & Policies</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField control={form.control} name="examInstructions" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exam Instructions</FormLabel>
                      <FormControl><Textarea rows={4} placeholder="Instructions for the exam day..." {...field} data-testid="input-exam-instructions" /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="uploadInstructions" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Upload Instructions</FormLabel>
                      <FormControl><Textarea rows={4} placeholder="Guidelines for uploading documents..." {...field} data-testid="input-upload-instructions" /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="refundPolicy" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Refund Policy</FormLabel>
                      <FormControl><Textarea rows={3} placeholder="Fee refund terms and conditions..." {...field} data-testid="input-refund-policy" /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="generalInstructions" render={({ field }) => (
                    <FormItem>
                      <FormLabel>General Instructions</FormLabel>
                      <FormControl><Textarea rows={4} placeholder="Other important instructions..." {...field} data-testid="input-general-instructions" /></FormControl>
                    </FormItem>
                  )} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card className="mt-6">
            <CardContent className="flex flex-wrap gap-4 justify-between items-center pt-6">
              <div className="flex items-center gap-2">
                <FormField control={form.control} name="isActive" render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-active" />
                    </FormControl>
                    <FormLabel>Active</FormLabel>
                  </FormItem>
                )} />
              </div>
              <div className="flex gap-2">
                <Button type="submit" variant="outline" disabled={saveMutation.isPending} data-testid="button-save-draft">
                  <Save className="h-4 w-4 mr-2" />
                  {saveMutation.isPending ? "Saving..." : "Save as Draft"}
                </Button>
                <Button type="button" onClick={publishExam} disabled={saveMutation.isPending} data-testid="button-publish">
                  <Send className="h-4 w-4 mr-2" />
                  {saveMutation.isPending ? "Publishing..." : "Publish Exam"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}
