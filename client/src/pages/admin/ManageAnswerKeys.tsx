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
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, FileKey, Trash2, Edit, ArrowLeft, Upload, ExternalLink } from "lucide-react";
import type { Exam, AnswerKey } from "@shared/schema";

export default function ManageAnswerKeys() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<AnswerKey | null>(null);
  const [formData, setFormData] = useState({
    examId: "",
    title: "",
    description: "",
    pdfUrl: "",
    status: "DRAFT",
    objectionWindowStart: "",
    objectionWindowEnd: "",
    objectionFee: "",
  });

  const { data: exams } = useQuery<Exam[]>({ queryKey: ["/api/exams"] });
  const { data: answerKeys, isLoading } = useQuery<AnswerKey[]>({ queryKey: ["/api/answer-keys"] });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/answer-keys", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/answer-keys"] });
      toast({ title: "Answer key created successfully" });
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to create answer key", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest("PUT", `/api/answer-keys/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/answer-keys"] });
      toast({ title: "Answer key updated successfully" });
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/answer-keys/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/answer-keys"] });
      toast({ title: "Answer key deleted" });
    }
  });

  const resetForm = () => {
    setFormData({
      examId: "",
      title: "",
      description: "",
      pdfUrl: "",
      status: "DRAFT",
      objectionWindowStart: "",
      objectionWindowEnd: "",
      objectionFee: "",
    });
    setEditingKey(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = () => {
    const data = {
      ...formData,
      examId: Number(formData.examId),
      objectionFee: formData.objectionFee ? Number(formData.objectionFee) : null,
      objectionWindowStart: formData.objectionWindowStart || null,
      objectionWindowEnd: formData.objectionWindowEnd || null,
      publishedAt: formData.status !== "DRAFT" ? new Date().toISOString() : null,
    };

    if (editingKey) {
      updateMutation.mutate({ id: editingKey.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (key: AnswerKey) => {
    setEditingKey(key);
    setFormData({
      examId: String(key.examId),
      title: key.title,
      description: key.description || "",
      pdfUrl: key.pdfUrl || "",
      status: key.status || "DRAFT",
      objectionWindowStart: key.objectionWindowStart ? new Date(key.objectionWindowStart).toISOString().slice(0, 16) : "",
      objectionWindowEnd: key.objectionWindowEnd ? new Date(key.objectionWindowEnd).toISOString().slice(0, 16) : "",
      objectionFee: key.objectionFee ? String(key.objectionFee) : "",
    });
    setIsDialogOpen(true);
  };

  const getExamTitle = (examId: number) => {
    return exams?.find(e => e.id === examId)?.title || "Unknown Exam";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "FINAL": return <Badge className="bg-green-600">Final</Badge>;
      case "PROVISIONAL": return <Badge className="bg-amber-600">Provisional</Badge>;
      default: return <Badge variant="secondary">Draft</Badge>;
    }
  };

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
                <h1 className="text-2xl font-bold text-primary" data-testid="text-answer-keys-title">
                  Manage Answer Keys
                </h1>
                <p className="text-muted-foreground">Upload and manage answer keys for exams</p>
              </div>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()} data-testid="button-add-answer-key">
                  <Plus className="w-4 h-4 mr-2" /> Add Answer Key
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingKey ? "Edit Answer Key" : "Add New Answer Key"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Select Exam</Label>
                    <Select value={formData.examId} onValueChange={(v) => setFormData({...formData, examId: v})}>
                      <SelectTrigger data-testid="select-exam">
                        <SelectValue placeholder="Select exam" />
                      </SelectTrigger>
                      <SelectContent>
                        {exams?.map(exam => (
                          <SelectItem key={exam.id} value={String(exam.id)}>{exam.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input 
                      placeholder="e.g., CGL 2024 Tier-I Answer Key (Set A)"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      data-testid="input-title"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea 
                      placeholder="Additional details about this answer key..."
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      data-testid="input-description"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>PDF URL</Label>
                    <Input 
                      placeholder="https://example.com/answer-key.pdf"
                      value={formData.pdfUrl}
                      onChange={(e) => setFormData({...formData, pdfUrl: e.target.value})}
                      data-testid="input-pdf-url"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                      <SelectTrigger data-testid="select-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="PROVISIONAL">Provisional (Open for Objections)</SelectItem>
                        <SelectItem value="FINAL">Final</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {formData.status === "PROVISIONAL" && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Objection Window Start</Label>
                          <Input 
                            type="datetime-local"
                            value={formData.objectionWindowStart}
                            onChange={(e) => setFormData({...formData, objectionWindowStart: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Objection Window End</Label>
                          <Input 
                            type="datetime-local"
                            value={formData.objectionWindowEnd}
                            onChange={(e) => setFormData({...formData, objectionWindowEnd: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Objection Fee (₹)</Label>
                        <Input 
                          type="number"
                          placeholder="100"
                          value={formData.objectionFee}
                          onChange={(e) => setFormData({...formData, objectionFee: e.target.value})}
                        />
                      </div>
                    </>
                  )}
                  
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={resetForm}>Cancel</Button>
                    <Button 
                      onClick={handleSubmit}
                      disabled={!formData.examId || !formData.title || createMutation.isPending || updateMutation.isPending}
                      data-testid="button-save-answer-key"
                    >
                      {editingKey ? "Update" : "Create"} Answer Key
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="text-center py-12">Loading...</div>
          ) : answerKeys && answerKeys.length > 0 ? (
            <div className="grid gap-4">
              {answerKeys.map(key => (
                <Card key={key.id} data-testid={`answer-key-${key.id}`}>
                  <CardHeader className="flex flex-row items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <FileKey className="w-8 h-8 text-primary" />
                      <div>
                        <CardTitle className="text-lg">{key.title}</CardTitle>
                        <CardDescription>{getExamTitle(key.examId)}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(key.status || "DRAFT")}
                      {key.pdfUrl && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={key.pdfUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-1" /> View PDF
                          </a>
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(key)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => deleteMutation.mutate(key.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  {key.description && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{key.description}</p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <Card className="py-12">
              <CardContent className="text-center">
                <FileKey className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Answer Keys Yet</h3>
                <p className="text-muted-foreground mb-4">Upload answer keys for your exams</p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Add First Answer Key
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
