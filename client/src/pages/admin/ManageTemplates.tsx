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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Plus, FileText, Edit, Trash2, Eye, IdCard, Trophy, Save } from "lucide-react";
import type { Exam, AdmitCardTemplate } from "@shared/schema";

export default function ManageTemplates() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("admit-card");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [editingTemplate, setEditingTemplate] = useState<AdmitCardTemplate | null>(null);
  
  const [formData, setFormData] = useState({
    templateName: "",
    headerLogoUrl: "",
    footerText: "",
    examVenue: "",
    reportingTime: "",
    examDuration: "",
    instructions: "",
    templateHtml: "",
  });

  const { data: exams } = useQuery<Exam[]>({ queryKey: ["/api/exams"] });
  const { data: templates, isLoading } = useQuery<AdmitCardTemplate[]>({ 
    queryKey: ["/api/admin/admit-card-templates"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingTemplate) {
        return await apiRequest("PUT", `/api/admin/admit-card-templates/${editingTemplate.id}`, data);
      }
      return await apiRequest("POST", "/api/admin/admit-card-templates", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/admit-card-templates"] });
      toast({ title: editingTemplate ? "Template updated" : "Template created" });
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to save template", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/admin/admit-card-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/admit-card-templates"] });
      toast({ title: "Template deleted" });
    }
  });

  const resetForm = () => {
    setFormData({
      templateName: "",
      headerLogoUrl: "",
      footerText: "",
      examVenue: "",
      reportingTime: "",
      examDuration: "",
      instructions: "",
      templateHtml: "",
    });
    setSelectedExamId("");
    setEditingTemplate(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (template: AdmitCardTemplate) => {
    setEditingTemplate(template);
    setSelectedExamId(String(template.examId));
    setFormData({
      templateName: template.templateName || "",
      headerLogoUrl: template.headerLogoUrl || "",
      footerText: template.footerText || "",
      examVenue: template.examVenue || "",
      reportingTime: template.reportingTime || "",
      examDuration: template.examDuration || "",
      instructions: template.instructions || "",
      templateHtml: template.templateHtml || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!selectedExamId) {
      toast({ title: "Please select an exam", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      examId: Number(selectedExamId),
      ...formData,
    });
  };

  const getExamName = (examId: number) => {
    const exam = exams?.find(e => e.id === examId);
    return exam ? `${exam.title} (${exam.code})` : `Exam #${examId}`;
  };

  const defaultTemplateHtml = `<div class="admit-card">
  <div class="header">
    <img src="{{logoUrl}}" alt="Logo" class="logo" />
    <h1>{{examTitle}}</h1>
    <h2>ADMIT CARD</h2>
  </div>
  
  <div class="candidate-info">
    <div class="photo"><img src="{{photoUrl}}" alt="Photo" /></div>
    <table>
      <tr><td>Roll Number:</td><td><strong>{{rollNumber}}</strong></td></tr>
      <tr><td>Name:</td><td>{{candidateName}}</td></tr>
      <tr><td>Father's Name:</td><td>{{fatherName}}</td></tr>
      <tr><td>DOB:</td><td>{{dob}}</td></tr>
      <tr><td>Category:</td><td>{{category}}</td></tr>
    </table>
  </div>
  
  <div class="exam-details">
    <h3>Exam Details</h3>
    <p><strong>Venue:</strong> {{examVenue}}</p>
    <p><strong>Date:</strong> {{examDate}}</p>
    <p><strong>Reporting Time:</strong> {{reportingTime}}</p>
    <p><strong>Duration:</strong> {{examDuration}}</p>
  </div>
  
  <div class="instructions">
    <h3>Instructions</h3>
    <div>{{instructions}}</div>
  </div>
  
  <div class="footer">
    <p>{{footerText}}</p>
    <div class="signatures">
      <div>Candidate Signature</div>
      <div>Invigilator Signature</div>
    </div>
  </div>
</div>`;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/admin"><ArrowLeft className="w-5 h-5" /></Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-primary" data-testid="text-templates-title">
                  Manage Templates
                </h1>
                <p className="text-muted-foreground">Configure admit card and result templates per exam</p>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="admit-card" className="gap-2">
                <IdCard className="w-4 h-4" /> Admit Card Templates
              </TabsTrigger>
              <TabsTrigger value="result" className="gap-2">
                <Trophy className="w-4 h-4" /> Result Templates
              </TabsTrigger>
            </TabsList>

            <TabsContent value="admit-card">
              <div className="flex justify-end mb-4">
                <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsDialogOpen(open); }}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-template">
                      <Plus className="w-4 h-4 mr-2" /> Add Template
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingTemplate ? "Edit" : "Create"} Admit Card Template</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Select Exam *</Label>
                          <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                            <SelectTrigger data-testid="select-template-exam">
                              <SelectValue placeholder="Select exam" />
                            </SelectTrigger>
                            <SelectContent>
                              {exams?.map(exam => (
                                <SelectItem key={exam.id} value={String(exam.id)}>
                                  {exam.title} ({exam.code})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Template Name *</Label>
                          <Input 
                            value={formData.templateName}
                            onChange={(e) => setFormData({...formData, templateName: e.target.value})}
                            placeholder="e.g., SSC CGL 2024 Admit Card"
                            data-testid="input-template-name"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Header Logo URL</Label>
                          <Input 
                            value={formData.headerLogoUrl}
                            onChange={(e) => setFormData({...formData, headerLogoUrl: e.target.value})}
                            placeholder="https://example.com/logo.png"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Exam Duration</Label>
                          <Input 
                            value={formData.examDuration}
                            onChange={(e) => setFormData({...formData, examDuration: e.target.value})}
                            placeholder="e.g., 2 Hours"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Default Exam Venue</Label>
                          <Input 
                            value={formData.examVenue}
                            onChange={(e) => setFormData({...formData, examVenue: e.target.value})}
                            placeholder="e.g., TCS iON Centre"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Reporting Time</Label>
                          <Input 
                            value={formData.reportingTime}
                            onChange={(e) => setFormData({...formData, reportingTime: e.target.value})}
                            placeholder="e.g., 8:30 AM"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Footer Text</Label>
                        <Input 
                          value={formData.footerText}
                          onChange={(e) => setFormData({...formData, footerText: e.target.value})}
                          placeholder="e.g., This is a computer generated document"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Instructions for Candidates</Label>
                        <Textarea 
                          value={formData.instructions}
                          onChange={(e) => setFormData({...formData, instructions: e.target.value})}
                          rows={4}
                          placeholder="1. Bring original ID proof&#10;2. Reach venue 30 mins before&#10;3. No electronic devices allowed"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Custom HTML Template (Advanced)</Label>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setFormData({...formData, templateHtml: defaultTemplateHtml})}
                          >
                            Load Default Template
                          </Button>
                        </div>
                        <Textarea 
                          value={formData.templateHtml}
                          onChange={(e) => setFormData({...formData, templateHtml: e.target.value})}
                          rows={10}
                          className="font-mono text-sm"
                          placeholder="Leave empty to use default template. Use placeholders: {{rollNumber}}, {{candidateName}}, {{examTitle}}, etc."
                        />
                        <p className="text-xs text-muted-foreground">
                          Available placeholders: {"{{rollNumber}}, {{candidateName}}, {{fatherName}}, {{dob}}, {{category}}, {{photoUrl}}, {{signatureUrl}}, {{examTitle}}, {{examDate}}, {{examVenue}}, {{reportingTime}}, {{examDuration}}, {{instructions}}, {{footerText}}, {{logoUrl}}"}
                        </p>
                      </div>

                      <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={resetForm}>Cancel</Button>
                        <Button 
                          onClick={handleSubmit}
                          disabled={!selectedExamId || !formData.templateName || createMutation.isPending}
                          data-testid="button-save-template"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {createMutation.isPending ? "Saving..." : "Save Template"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {isLoading ? (
                <div className="text-center py-12">Loading templates...</div>
              ) : templates && templates.length > 0 ? (
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Template Name</TableHead>
                        <TableHead>Exam</TableHead>
                        <TableHead>Venue</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {templates.map(template => (
                        <TableRow key={template.id} data-testid={`template-${template.id}`}>
                          <TableCell className="font-medium">{template.templateName}</TableCell>
                          <TableCell>{getExamName(template.examId)}</TableCell>
                          <TableCell>{template.examVenue || "-"}</TableCell>
                          <TableCell>{template.examDuration || "-"}</TableCell>
                          <TableCell>
                            {template.isActive ? (
                              <Badge className="bg-green-600">Active</Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleEdit(template)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => deleteMutation.mutate(template.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              ) : (
                <Card className="py-12">
                  <CardContent className="text-center">
                    <IdCard className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Templates Created</h3>
                    <p className="text-muted-foreground mb-4">
                      Create templates to customize admit cards for each exam
                    </p>
                    <Button onClick={() => setIsDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" /> Create First Template
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="result">
              <Card className="py-12">
                <CardContent className="text-center">
                  <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Result Templates</h3>
                  <p className="text-muted-foreground mb-4">
                    Result display templates are configured per exam during result declaration.
                    Each exam can have custom cutoffs, marks display format, and category-wise results.
                  </p>
                  <Button variant="outline" asChild>
                    <Link href="/admin/results">
                      <Trophy className="w-4 h-4 mr-2" /> Go to Results Management
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
