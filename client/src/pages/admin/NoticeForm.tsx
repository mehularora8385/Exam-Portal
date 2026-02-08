import { useEffect } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const noticeSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().optional(),
  type: z.string().min(1, "Type is required"),
  linkUrl: z.string().optional(),
  pdfUrl: z.string().optional(),
  isNew: z.boolean().default(true),
  isActive: z.boolean().default(true),
});

type NoticeFormData = z.infer<typeof noticeSchema>;

export default function NoticeForm() {
  const { isAuthenticated, isAdmin, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [_, setLocation] = useLocation();
  const params = useParams<{ id?: string }>();
  const isEditing = !!params.id;

  const { data: existingNotice } = useQuery({
    queryKey: ["/api/notices", params.id],
    queryFn: async () => {
      if (!params.id) return null;
      const res = await fetch(`/api/notices/${params.id}`);
      if (!res.ok) throw new Error("Failed to fetch notice");
      return res.json();
    },
    enabled: isEditing,
  });

  const form = useForm<NoticeFormData>({
    resolver: zodResolver(noticeSchema),
    defaultValues: {
      title: "",
      content: "",
      type: "General",
      linkUrl: "",
      pdfUrl: "",
      isNew: true,
      isActive: true,
    },
  });

  useEffect(() => {
    if (existingNotice) {
      form.reset({
        title: existingNotice.title || "",
        content: existingNotice.content || "",
        type: existingNotice.type || "General",
        linkUrl: existingNotice.linkUrl || "",
        pdfUrl: existingNotice.pdfUrl || "",
        isNew: existingNotice.isNew ?? true,
        isActive: existingNotice.isActive ?? true,
      });
    }
  }, [existingNotice, form]);

  const mutation = useMutation({
    mutationFn: async (data: NoticeFormData) => {
      if (isEditing) {
        return apiRequest("PUT", `/api/notices/${params.id}`, data);
      }
      return apiRequest("POST", "/api/notices", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notices"] });
      toast({ title: isEditing ? "Notice Updated" : "Notice Created" });
      setLocation("/admin/notices");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save notice.", variant: "destructive" });
    },
  });

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) {
      setLocation("/login");
    }
  }, [isAuthenticated, isAdmin, authLoading, setLocation]);

  const onSubmit = (data: NoticeFormData) => {
    mutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="text-primary-foreground">
            <Link href="/admin/notices"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <h1 className="text-xl font-bold">{isEditing ? "Edit Notice" : "Create New Notice"}</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? "Edit Notice Details" : "Notice Details"}</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="Notice title" {...field} data-testid="input-notice-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-notice-type">
                            <SelectValue placeholder="Select notice type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="General">General</SelectItem>
                          <SelectItem value="Admit Card">Admit Card</SelectItem>
                          <SelectItem value="Result">Result</SelectItem>
                          <SelectItem value="Recruitment">Recruitment</SelectItem>
                          <SelectItem value="Important">Important</SelectItem>
                          <SelectItem value="Correction">Correction Window</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Notice content/description" 
                          className="min-h-[120px]" 
                          {...field} 
                          data-testid="input-notice-content"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="linkUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Link URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} data-testid="input-notice-link" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pdfUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PDF URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://...pdf" {...field} data-testid="input-notice-pdf" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-center gap-8">
                  <FormField
                    control={form.control}
                    name="isNew"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-3">
                        <FormControl>
                          <Switch 
                            checked={field.value} 
                            onCheckedChange={field.onChange}
                            data-testid="switch-notice-new"
                          />
                        </FormControl>
                        <Label>Mark as NEW</Label>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-3">
                        <FormControl>
                          <Switch 
                            checked={field.value} 
                            onCheckedChange={field.onChange}
                            data-testid="switch-notice-active"
                          />
                        </FormControl>
                        <Label>Active</Label>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <Button type="button" variant="outline" asChild>
                    <Link href="/admin/notices">Cancel</Link>
                  </Button>
                  <Button type="submit" disabled={mutation.isPending} data-testid="button-save-notice">
                    <Save className="w-4 h-4 mr-2" />
                    {mutation.isPending ? "Saving..." : (isEditing ? "Update Notice" : "Create Notice")}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
