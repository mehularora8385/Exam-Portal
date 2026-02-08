import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProfileSchema } from "@shared/schema";
import { z } from "zod";
import { useLocation } from "wouter";
import { useCreateProfile, useUpdateProfile, useProfile } from "@/hooks/use-profile";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, User, MapPin, GraduationCap, Upload, FileText } from "lucide-react";

// Extend schema for form validation
const formSchema = insertProfileSchema.extend({
  mobile: z.string().min(10, "Mobile number must be at least 10 digits"),
  pincode: z.string().min(6, "Invalid pincode"),
});

type FormData = z.infer<typeof formSchema>;

export default function CreateProfile() {
  const { data: existingProfile, isLoading } = useProfile();
  const createProfile = useCreateProfile();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [step, setStep] = useState("personal");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: existingProfile || {
      fullName: "",
      fatherName: "",
      motherName: "",
      gender: "Male",
      category: "General",
      mobile: "",
      address: "",
      state: "",
      pincode: "",
      qualifications: {},
      isProfileComplete: true,
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      if (existingProfile) {
        await updateProfile.mutateAsync(data);
        toast({ title: "Success", description: "Profile updated successfully" });
      } else {
        await createProfile.mutateAsync(data);
        toast({ title: "Success", description: "Registration completed successfully" });
      }
      setLocation("/dashboard");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const nextStep = (next: string) => {
    // Ideally validate current step fields before moving
    setStep(next);
  };

  if (isLoading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="container-custom py-10">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-display font-bold text-primary mb-2">
              {existingProfile ? "Update Profile" : "One Time Registration (OTR)"}
            </h1>
            <p className="text-muted-foreground">Complete your profile to unlock examination applications.</p>
          </div>

          <Tabs value={step} onValueChange={setStep} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-white p-1 rounded-xl shadow-sm mb-6 h-auto">
              <TabsTrigger value="personal" className="py-3 data-[state=active]:bg-primary data-[state=active]:text-white">
                <User className="w-4 h-4 mr-2" /> Personal
              </TabsTrigger>
              <TabsTrigger value="contact" className="py-3 data-[state=active]:bg-primary data-[state=active]:text-white">
                <MapPin className="w-4 h-4 mr-2" /> Contact
              </TabsTrigger>
              <TabsTrigger value="education" className="py-3 data-[state=active]:bg-primary data-[state=active]:text-white">
                <GraduationCap className="w-4 h-4 mr-2" /> Education
              </TabsTrigger>
              <TabsTrigger value="uploads" className="py-3 data-[state=active]:bg-primary data-[state=active]:text-white">
                <Upload className="w-4 h-4 mr-2" /> Documents
              </TabsTrigger>
            </TabsList>

            <form onSubmit={form.handleSubmit(onSubmit)}>
              {/* Personal Details Step */}
              <TabsContent value="personal">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Details</CardTitle>
                    <CardDescription>Enter your details exactly as per matriculation certificate.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input id="fullName" {...form.register("fullName")} />
                        {form.formState.errors.fullName && <p className="text-xs text-destructive">{form.formState.errors.fullName.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dob">Date of Birth</Label>
                        <Input id="dob" type="date" {...form.register("dob")} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fatherName">Father's Name</Label>
                        <Input id="fatherName" {...form.register("fatherName")} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="motherName">Mother's Name</Label>
                        <Input id="motherName" {...form.register("motherName")} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gender">Gender</Label>
                        <select 
                          {...form.register("gender")} 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <select 
                          {...form.register("category")}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          <option value="General">General</option>
                          <option value="OBC">OBC</option>
                          <option value="SC">SC</option>
                          <option value="ST">ST</option>
                          <option value="EWS">EWS</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end pt-4">
                      <Button type="button" onClick={() => nextStep("contact")}>Next: Contact Details</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Contact Details Step */}
              <TabsContent value="contact">
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="address">Permanent Address</Label>
                      <Textarea id="address" {...form.register("address")} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input id="state" {...form.register("state")} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pincode">Pincode</Label>
                        <Input id="pincode" {...form.register("pincode")} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mobile">Mobile Number</Label>
                        <Input id="mobile" {...form.register("mobile")} />
                      </div>
                    </div>
                    <div className="flex justify-between pt-4">
                      <Button type="button" variant="outline" onClick={() => nextStep("personal")}>Back</Button>
                      <Button type="button" onClick={() => nextStep("education")}>Next: Qualifications</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Education Step - Comprehensive Details */}
              <TabsContent value="education">
                <Card>
                  <CardHeader>
                    <CardTitle>Educational Qualifications</CardTitle>
                    <CardDescription>Enter complete details of your educational qualifications</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* 10th Class */}
                    <div className="space-y-4 p-4 bg-slate-50 rounded-lg border">
                      <h4 className="font-semibold text-primary flex items-center gap-2">
                        <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
                        Matriculation / 10th Standard
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Board Name *</Label>
                          <Select 
                            onValueChange={(value) => form.setValue("qualifications.tenth.board" as any, value)}
                            defaultValue={form.getValues("qualifications.tenth.board" as any)}
                          >
                            <SelectTrigger data-testid="select-tenth-board">
                              <SelectValue placeholder="Select Board" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CBSE">CBSE</SelectItem>
                              <SelectItem value="ICSE">ICSE</SelectItem>
                              <SelectItem value="UP Board">UP Board</SelectItem>
                              <SelectItem value="Bihar Board">Bihar Board</SelectItem>
                              <SelectItem value="MP Board">MP Board</SelectItem>
                              <SelectItem value="Rajasthan Board">Rajasthan Board</SelectItem>
                              <SelectItem value="Gujarat Board">Gujarat Board</SelectItem>
                              <SelectItem value="Maharashtra Board">Maharashtra Board</SelectItem>
                              <SelectItem value="West Bengal Board">West Bengal Board</SelectItem>
                              <SelectItem value="Tamil Nadu Board">Tamil Nadu Board</SelectItem>
                              <SelectItem value="Karnataka Board">Karnataka Board</SelectItem>
                              <SelectItem value="Kerala Board">Kerala Board</SelectItem>
                              <SelectItem value="Andhra Pradesh Board">Andhra Pradesh Board</SelectItem>
                              <SelectItem value="Other State Board">Other State Board</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">School Name</Label>
                          <Input placeholder="School Name" {...form.register("qualifications.tenth.schoolName")} data-testid="input-tenth-school" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Year of Passing *</Label>
                          <Input type="number" placeholder="2020" {...form.register("qualifications.tenth.year")} data-testid="input-tenth-year" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Total Marks *</Label>
                          <Input type="number" placeholder="500" {...form.register("qualifications.tenth.totalMarks")} data-testid="input-tenth-total" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Obtained Marks *</Label>
                          <Input type="number" placeholder="450" {...form.register("qualifications.tenth.obtainedMarks")} data-testid="input-tenth-obtained" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Percentage *</Label>
                          <Input placeholder="90.00" {...form.register("qualifications.tenth.percentage")} data-testid="input-tenth-percentage" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Roll Number</Label>
                          <Input placeholder="Roll Number" {...form.register("qualifications.tenth.rollNo")} data-testid="input-tenth-rollno" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Medium of Instruction</Label>
                          <Select 
                            onValueChange={(value) => form.setValue("qualifications.tenth.medium" as any, value)}
                            defaultValue={form.getValues("qualifications.tenth.medium" as any)}
                          >
                            <SelectTrigger data-testid="select-tenth-medium">
                              <SelectValue placeholder="Select Medium" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Hindi">Hindi</SelectItem>
                              <SelectItem value="English">English</SelectItem>
                              <SelectItem value="Regional">Regional Language</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    
                    {/* 12th Class */}
                    <div className="space-y-4 p-4 bg-slate-50 rounded-lg border">
                      <h4 className="font-semibold text-primary flex items-center gap-2">
                        <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
                        Intermediate / 12th Standard
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Board Name *</Label>
                          <Select 
                            onValueChange={(value) => form.setValue("qualifications.twelfth.board" as any, value)}
                            defaultValue={form.getValues("qualifications.twelfth.board" as any)}
                          >
                            <SelectTrigger data-testid="select-twelfth-board">
                              <SelectValue placeholder="Select Board" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CBSE">CBSE</SelectItem>
                              <SelectItem value="ICSE">ISC</SelectItem>
                              <SelectItem value="UP Board">UP Board</SelectItem>
                              <SelectItem value="Bihar Board">Bihar Board</SelectItem>
                              <SelectItem value="MP Board">MP Board</SelectItem>
                              <SelectItem value="Rajasthan Board">Rajasthan Board</SelectItem>
                              <SelectItem value="Gujarat Board">Gujarat Board</SelectItem>
                              <SelectItem value="Maharashtra Board">Maharashtra Board</SelectItem>
                              <SelectItem value="West Bengal Board">West Bengal Board</SelectItem>
                              <SelectItem value="Tamil Nadu Board">Tamil Nadu Board</SelectItem>
                              <SelectItem value="Karnataka Board">Karnataka Board</SelectItem>
                              <SelectItem value="Kerala Board">Kerala Board</SelectItem>
                              <SelectItem value="Andhra Pradesh Board">Andhra Pradesh Board</SelectItem>
                              <SelectItem value="Other State Board">Other State Board</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Stream *</Label>
                          <Select 
                            onValueChange={(value) => form.setValue("qualifications.twelfth.stream" as any, value)}
                            defaultValue={form.getValues("qualifications.twelfth.stream" as any)}
                          >
                            <SelectTrigger data-testid="select-twelfth-stream">
                              <SelectValue placeholder="Select Stream" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Science (PCM)">Science (PCM)</SelectItem>
                              <SelectItem value="Science (PCB)">Science (PCB)</SelectItem>
                              <SelectItem value="Commerce">Commerce</SelectItem>
                              <SelectItem value="Arts/Humanities">Arts/Humanities</SelectItem>
                              <SelectItem value="Vocational">Vocational</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">School/College Name</Label>
                          <Input placeholder="School/College Name" {...form.register("qualifications.twelfth.schoolName")} data-testid="input-twelfth-school" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Main Subjects</Label>
                          <Input placeholder="e.g., Physics, Chemistry, Maths" {...form.register("qualifications.twelfth.subjects")} data-testid="input-twelfth-subjects" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Year of Passing *</Label>
                          <Input type="number" placeholder="2022" {...form.register("qualifications.twelfth.year")} data-testid="input-twelfth-year" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Total Marks *</Label>
                          <Input type="number" placeholder="500" {...form.register("qualifications.twelfth.totalMarks")} data-testid="input-twelfth-total" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Obtained Marks *</Label>
                          <Input type="number" placeholder="450" {...form.register("qualifications.twelfth.obtainedMarks")} data-testid="input-twelfth-obtained" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Percentage *</Label>
                          <Input placeholder="90.00" {...form.register("qualifications.twelfth.percentage")} data-testid="input-twelfth-percentage" />
                        </div>
                      </div>
                    </div>

                    {/* Graduation */}
                    <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <h4 className="font-semibold text-primary flex items-center gap-2">
                        <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">3</span>
                        Graduation (if applicable)
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Degree</Label>
                          <Select 
                            onValueChange={(value) => form.setValue("qualifications.graduation.degree" as any, value)}
                            defaultValue={form.getValues("qualifications.graduation.degree" as any)}
                          >
                            <SelectTrigger data-testid="select-graduation-degree">
                              <SelectValue placeholder="Select Degree" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="B.A.">B.A. (Bachelor of Arts)</SelectItem>
                              <SelectItem value="B.Sc.">B.Sc. (Bachelor of Science)</SelectItem>
                              <SelectItem value="B.Com.">B.Com. (Bachelor of Commerce)</SelectItem>
                              <SelectItem value="B.Tech/B.E.">B.Tech/B.E.</SelectItem>
                              <SelectItem value="BBA">BBA</SelectItem>
                              <SelectItem value="BCA">BCA</SelectItem>
                              <SelectItem value="LLB">LLB</SelectItem>
                              <SelectItem value="MBBS">MBBS</SelectItem>
                              <SelectItem value="B.Ed.">B.Ed.</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">University</Label>
                          <Input placeholder="University Name" {...form.register("qualifications.graduation.university")} data-testid="input-graduation-university" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">College</Label>
                          <Input placeholder="College Name" {...form.register("qualifications.graduation.college")} data-testid="input-graduation-college" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Subject/Specialization</Label>
                          <Input placeholder="Major Subject" {...form.register("qualifications.graduation.subject")} data-testid="input-graduation-subject" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Year of Passing</Label>
                          <Input type="number" placeholder="2025" {...form.register("qualifications.graduation.year")} data-testid="input-graduation-year" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Total Marks</Label>
                          <Input type="number" placeholder="1000" {...form.register("qualifications.graduation.totalMarks")} data-testid="input-graduation-total" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Obtained Marks</Label>
                          <Input type="number" placeholder="750" {...form.register("qualifications.graduation.obtainedMarks")} data-testid="input-graduation-obtained" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Percentage/CGPA</Label>
                          <Input placeholder="75% or 7.5" {...form.register("qualifications.graduation.percentage")} data-testid="input-graduation-percentage" />
                        </div>
                      </div>
                    </div>

                    {/* Post Graduation */}
                    <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-100">
                      <h4 className="font-semibold text-green-700 flex items-center gap-2">
                        <span className="bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">4</span>
                        Post Graduation (if applicable)
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Degree</Label>
                          <Select 
                            onValueChange={(value) => form.setValue("qualifications.postGraduation.degree" as any, value)}
                            defaultValue={form.getValues("qualifications.postGraduation.degree" as any)}
                          >
                            <SelectTrigger data-testid="select-pg-degree">
                              <SelectValue placeholder="Select Degree" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="M.A.">M.A. (Master of Arts)</SelectItem>
                              <SelectItem value="M.Sc.">M.Sc. (Master of Science)</SelectItem>
                              <SelectItem value="M.Com.">M.Com. (Master of Commerce)</SelectItem>
                              <SelectItem value="M.Tech/M.E.">M.Tech/M.E.</SelectItem>
                              <SelectItem value="MBA">MBA</SelectItem>
                              <SelectItem value="MCA">MCA</SelectItem>
                              <SelectItem value="LLM">LLM</SelectItem>
                              <SelectItem value="M.Ed.">M.Ed.</SelectItem>
                              <SelectItem value="PhD">PhD</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">University</Label>
                          <Input placeholder="University Name" {...form.register("qualifications.postGraduation.university")} data-testid="input-pg-university" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Specialization</Label>
                          <Input placeholder="Specialization" {...form.register("qualifications.postGraduation.subject")} data-testid="input-pg-subject" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Year of Passing</Label>
                          <Input type="number" placeholder="2027" {...form.register("qualifications.postGraduation.year")} data-testid="input-pg-year" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Total Marks</Label>
                          <Input type="number" placeholder="1000" {...form.register("qualifications.postGraduation.totalMarks")} data-testid="input-pg-total" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Obtained Marks</Label>
                          <Input type="number" placeholder="800" {...form.register("qualifications.postGraduation.obtainedMarks")} data-testid="input-pg-obtained" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Percentage/CGPA</Label>
                          <Input placeholder="80% or 8.0" {...form.register("qualifications.postGraduation.percentage")} data-testid="input-pg-percentage" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between pt-4">
                      <Button type="button" variant="outline" onClick={() => nextStep("contact")}>Back</Button>
                      <Button type="button" onClick={() => nextStep("uploads")}>Next: Documents</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Uploads Step (Mock uploads for MVP) */}
              <TabsContent value="uploads">
                <Card>
                  <CardHeader>
                    <CardTitle>Document Uploads</CardTitle>
                    <CardDescription>Upload recent passport size photo and signature.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer bg-slate-50">
                         <div className="w-12 h-12 bg-blue-100 text-primary rounded-full flex items-center justify-center mx-auto mb-3">
                           <User className="w-6 h-6" />
                         </div>
                         <h3 className="font-medium">Photograph</h3>
                         <p className="text-xs text-muted-foreground mt-1">JPG/PNG, Max 50KB</p>
                         <Input type="text" placeholder="Enter Photo URL (Mock)" className="mt-4" {...form.register("photoUrl")} />
                       </div>
                       
                       <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer bg-slate-50">
                         <div className="w-12 h-12 bg-blue-100 text-primary rounded-full flex items-center justify-center mx-auto mb-3">
                           <FileText className="w-6 h-6" />
                         </div>
                         <h3 className="font-medium">Signature</h3>
                         <p className="text-xs text-muted-foreground mt-1">JPG/PNG, Max 20KB</p>
                         <Input type="text" placeholder="Enter Signature URL (Mock)" className="mt-4" {...form.register("signatureUrl")} />
                       </div>
                    </div>
                    
                    <div className="flex justify-between pt-4">
                      <Button type="button" variant="outline" onClick={() => nextStep("education")}>Back</Button>
                      <Button type="submit" size="lg" className="bg-green-600 hover:bg-green-700" disabled={createProfile.isPending || updateProfile.isPending}>
                        {(createProfile.isPending || updateProfile.isPending) ? "Saving..." : "Submit Profile"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </form>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
