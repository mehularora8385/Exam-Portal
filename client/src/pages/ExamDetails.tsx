import { useRoute, useLocation } from "wouter";
import { useExam } from "@/hooks/use-exams";
import { useProfile } from "@/hooks/use-profile";
import { useApplications, useApplyForExam } from "@/hooks/use-applications";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, AlertTriangle, Calendar, FileText, IndianRupee } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ExamDetails() {
  const [match, params] = useRoute("/exams/:id");
  const id = params ? parseInt(params.id) : 0;
  
  const { data: exam, isLoading: examLoading } = useExam(id);
  const { data: profile } = useProfile();
  const { data: applications } = useApplications();
  const applyMutation = useApplyForExam();
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [center, setCenter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  // Check if already applied
  const existingApplication = applications?.find(app => app.examId === id);

  const handleApply = async () => {
    if (!profile) {
      toast({ title: "Profile Required", description: "Please login and complete your profile first.", variant: "destructive" });
      setLocation("/api/login");
      return;
    }
    
    if (!profile.isProfileComplete) {
       toast({ title: "Incomplete Profile", description: "Please complete your OTR profile to apply.", variant: "destructive" });
       setLocation("/profile/create");
       return;
    }

    if (!center) {
      toast({ title: "Select Center", description: "Please select an exam center preference.", variant: "destructive" });
      return;
    }

    try {
      await applyMutation.mutateAsync({
        examId: id,
        preferredCenters: [center],
        paymentStatus: "PENDING" // In real app, redirect to payment gateway first
      });
      toast({ title: "Application Submitted", description: "Your application has been submitted successfully." });
      setDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  if (examLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;
  if (!exam) return <div className="min-h-screen flex items-center justify-center">Exam not found</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      
      <main className="container-custom py-10 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <Badge className="text-sm px-3 py-1">{exam.code}</Badge>
                {existingApplication && <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">Applied</Badge>}
              </div>
              <h1 className="text-3xl font-display font-bold text-primary mb-4">{exam.title}</h1>
              <div className="prose max-w-none text-slate-600">
                <p>{exam.description}</p>
                <h3>Eligibility Criteria</h3>
                <p>Candidate must hold a bachelor's degree from a recognized university. Age limit: 21-30 years.</p>
                <h3>Selection Process</h3>
                <ul>
                  <li>Tier-I: Computer Based Examination</li>
                  <li>Tier-II: Descriptive Paper</li>
                  <li>Tier-III: Skill Test/Typing Test</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <Card className="border-t-4 border-t-primary shadow-md">
              <CardHeader>
                <CardTitle>Important Dates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" /> Start Date
                  </div>
                  <span className="font-medium">{exam.applyStartDate ? format(new Date(exam.applyStartDate), 'dd MMM yyyy') : 'TBD'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <AlertTriangle className="w-4 h-4 text-destructive" /> End Date
                  </div>
                  <span className="font-medium text-destructive">{exam.applyEndDate ? format(new Date(exam.applyEndDate), 'dd MMM yyyy') : 'TBD'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="w-4 h-4" /> Exam Date
                  </div>
                  <span className="font-medium">{exam.examDate ? format(new Date(exam.examDate), 'dd MMM yyyy') : 'To be notified'}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fee Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>Application Fee</span>
                  <span className="flex items-center"><IndianRupee className="w-4 h-4" /> {exam.fees?.general || 0}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Free for SC/ST/Women/Ex-Servicemen</p>
              </CardContent>
            </Card>

            {existingApplication ? (
              <Button className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg" disabled>
                <CheckCircle2 className="mr-2 w-5 h-5" /> Already Applied
              </Button>
            ) : (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full h-12 text-lg shadow-lg shadow-primary/25" disabled={!exam.isActive}>
                    {exam.isActive ? "Apply Now" : "Applications Closed"}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirm Application</DialogTitle>
                    <DialogDescription>
                      You are applying for <strong>{exam.title}</strong>. Please confirm your details.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Candidate Name</Label>
                      <div className="font-medium p-2 bg-slate-100 rounded">{profile?.fullName}</div>
                    </div>
                    <div className="space-y-2">
                      <Label>Registration Number</Label>
                      <div className="font-medium p-2 bg-slate-100 rounded">{profile?.registrationNumber}</div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="center">Exam Center Preference</Label>
                      <Select value={center} onValueChange={setCenter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a city" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Delhi">New Delhi</SelectItem>
                          <SelectItem value="Mumbai">Mumbai</SelectItem>
                          <SelectItem value="Kolkata">Kolkata</SelectItem>
                          <SelectItem value="Chennai">Chennai</SelectItem>
                          <SelectItem value="Bangalore">Bangalore</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleApply} disabled={applyMutation.isPending}>
                      {applyMutation.isPending ? "Submitting..." : "Submit Application"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
