import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Edit, Trash2, Eye, ArrowLeft, MapPin, Shield } from "lucide-react";
import { format } from "date-fns";
import ExamForm from "./ExamForm";

export default function ManageExams() {
  const [, setLocation] = useLocation();
  const [matchCreate] = useRoute("/admin/exams/new");
  const [matchEdit, paramsEdit] = useRoute("/admin/exams/:id/edit");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: exams, isLoading } = useQuery<any[]>({
    queryKey: ["/api/exams", "all"],
    queryFn: async () => {
      const res = await fetch("/api/exams?all=true");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/exams/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
      toast({ title: "Exam deleted successfully" });
      setDeleteId(null);
    },
    onError: () => {
      toast({ title: "Failed to delete exam", variant: "destructive" });
    },
  });

  const selectedExam = matchEdit && paramsEdit?.id 
    ? exams?.find(e => e.id === parseInt(paramsEdit.id)) 
    : null;

  if (matchCreate) {
    return <ExamForm />;
  }

  if (matchEdit && selectedExam) {
    return <ExamForm exam={selectedExam} isEditing />;
  }

  if (matchEdit && !selectedExam && !isLoading) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => setLocation("/admin/exams")} data-testid="button-back">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Exams
        </Button>
        <p className="mt-4">Exam not found.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/admin")} data-testid="button-back-dashboard">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Manage Exams</h1>
        </div>
        <Button onClick={() => setLocation("/admin/exams/new")} data-testid="button-create-exam">
          <Plus className="h-4 w-4 mr-2" /> Create Exam
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Exams</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : exams && exams.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Conducting Body</TableHead>
                  <TableHead>Vacancies</TableHead>
                  <TableHead>Apply Dates</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exams.map((exam) => (
                  <TableRow key={exam.id} data-testid={`row-exam-${exam.id}`}>
                    <TableCell className="font-medium">{exam.code}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{exam.title}</TableCell>
                    <TableCell>{exam.conductingBody || "-"}</TableCell>
                    <TableCell>{exam.totalVacancies?.toLocaleString() || 0}</TableCell>
                    <TableCell className="text-sm">
                      {exam.applyStartDate && exam.applyEndDate ? (
                        <>
                          {format(new Date(exam.applyStartDate), "dd/MM/yy")} - {format(new Date(exam.applyEndDate), "dd/MM/yy")}
                        </>
                      ) : exam.applicationStartDate && exam.applicationEndDate ? (
                        <>
                          {format(new Date(exam.applicationStartDate), "dd/MM/yy")} - {format(new Date(exam.applicationEndDate), "dd/MM/yy")}
                        </>
                      ) : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {exam.isDraft && <Badge variant="secondary">Draft</Badge>}
                        {exam.isActive ? (
                          <Badge variant="default">Active</Badge>
                        ) : (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setLocation(`/exams/${exam.id}`)} data-testid={`button-view-${exam.id}`}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setLocation(`/admin/exams/${exam.id}/centers`)} data-testid={`button-centers-${exam.id}`} title="Manage Centers">
                          <MapPin className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setLocation(`/admin/exams/${exam.id}/seb-config`)} data-testid={`button-seb-${exam.id}`} title="SEB Configuration">
                          <Shield className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setLocation(`/admin/exams/${exam.id}/edit`)} data-testid={`button-edit-${exam.id}`}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(exam.id)} data-testid={`button-delete-${exam.id}`}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No exams found. Create your first exam to get started.
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this exam? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
