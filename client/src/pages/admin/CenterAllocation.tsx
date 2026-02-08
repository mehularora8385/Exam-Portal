import { useEffect, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MapPin, Users, Building2, RefreshCw, Loader2 } from "lucide-react";

interface CenterStats {
  center: string;
  count: number;
  capacity?: number;
}

export default function CenterAllocation() {
  const [match, params] = useRoute("/admin/exams/:examId/centers");
  const examId = params?.examId;
  
  const { isAuthenticated, isAdmin, isLoading: authLoading } = useAuth();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: exam, isLoading: examLoading } = useQuery<any>({
    queryKey: ["/api/exams", examId],
    enabled: !!examId
  });

  const { data: applications, isLoading: appsLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/applications"],
  });

  const updateCenterMutation = useMutation({
    mutationFn: async ({ appId, center }: { appId: number; center: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/applications/${appId}`, { allocatedCenter: center });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Center updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/applications"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) {
      setLocation("/login");
    }
  }, [isAuthenticated, isAdmin, authLoading, setLocation]);

  const examApplications = applications?.filter(app => app.examId === Number(examId)) || [];
  
  const defaultCenters = ["New Delhi", "Mumbai", "Chennai", "Kolkata", "Bangalore", "Hyderabad", "Lucknow", "Jaipur"];
  const examCenters = exam?.examCenters?.cities || defaultCenters;

  const centerStats: CenterStats[] = examCenters.map((center: string) => ({
    center,
    count: examApplications.filter(app => app.allocatedCenter === center).length,
    capacity: 500
  }));

  const unallocatedCount = examApplications.filter(app => !app.allocatedCenter).length;

  if (authLoading || examLoading || appsLoading) {
    return (
      <div className="min-h-screen bg-slate-100 p-8">
        <div className="max-w-7xl mx-auto space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="text-primary-foreground hover:bg-primary-foreground/10">
            <Link href="/admin/exams"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold">Center Allocation</h1>
            <p className="text-sm opacity-80">{exam?.title} ({exam?.code})</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Applications</p>
                  <p className="text-2xl font-bold" data-testid="text-total-applications">{examApplications.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Building2 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Centers</p>
                  <p className="text-2xl font-bold" data-testid="text-total-centers">{examCenters.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <MapPin className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Allocated</p>
                  <p className="text-2xl font-bold">{examApplications.length - unallocatedCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <RefreshCw className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold" data-testid="text-pending-allocation">{unallocatedCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" /> Center Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {centerStats.map(stat => (
                  <div key={stat.center} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{stat.center}</span>
                    </div>
                    <Badge variant={stat.count > 0 ? "default" : "secondary"}>
                      {stat.count} candidates
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Application Allocations</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Roll Number</TableHead>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Preferred</TableHead>
                    <TableHead>Allocated Center</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {examApplications.map((app: any) => (
                    <TableRow key={app.id} data-testid={`row-allocation-${app.id}`}>
                      <TableCell className="font-mono text-sm">{app.rollNumber}</TableCell>
                      <TableCell>{app.candidate?.fullName || "-"}</TableCell>
                      <TableCell>{app.preferredCenters?.[0] || "-"}</TableCell>
                      <TableCell>
                        <Select 
                          value={app.allocatedCenter || ""} 
                          onValueChange={(val) => updateCenterMutation.mutate({ appId: app.id, center: val })}
                        >
                          <SelectTrigger className="w-[160px]" data-testid={`select-center-${app.id}`}>
                            <SelectValue placeholder="Assign center" />
                          </SelectTrigger>
                          <SelectContent>
                            {examCenters.map((center: string) => (
                              <SelectItem key={center} value={center}>{center}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                  {examApplications.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No applications for this exam yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
