import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { motion } from "framer-motion";
import { JobAlertsHeader } from "@/components/JobAlertsHeader";
import { JobAlertsFooter } from "@/components/JobAlertsFooter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  ArrowLeft, Calendar, Building2, Users, ExternalLink, FileText, 
  Download, Clock, Flame, Share2, Bookmark, Eye, GraduationCap,
  IndianRupee, MapPin, Award, ClipboardList, BookOpen
} from "lucide-react";
import { AdBanner } from "@/components/AdBanner";
import { format, parseISO, isValid, differenceInDays } from "date-fns";
import { useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";

function safeFormatDate(dateValue: any, formatStr: string = "dd MMM yyyy"): string {
  if (!dateValue) return "Not Announced";
  try {
    const date = typeof dateValue === "string" ? parseISO(dateValue) : new Date(dateValue);
    return isValid(date) ? format(date, formatStr) : "Not Announced";
  } catch {
    return "Not Announced";
  }
}

function getApplicationStatus(startDate: any, endDate: any): { status: string; color: string; bgColor: string } {
  const now = new Date();
  
  if (endDate) {
    const end = typeof endDate === "string" ? parseISO(endDate) : new Date(endDate);
    if (isValid(end) && differenceInDays(end, now) < 0) {
      return { status: "Applications Closed", color: "text-gray-600", bgColor: "bg-gray-100" };
    }
  }
  
  if (startDate) {
    const start = typeof startDate === "string" ? parseISO(startDate) : new Date(startDate);
    if (isValid(start) && differenceInDays(start, now) > 0) {
      return { status: "Upcoming", color: "text-blue-600", bgColor: "bg-blue-100" };
    }
  }
  
  return { status: "Apply Now", color: "text-green-600", bgColor: "bg-green-100" };
}

export default function JobAlertDetail() {
  const [, params] = useRoute("/job-alerts/:id");
  const id = params?.id;

  const { data: alert, isLoading } = useQuery<any>({
    queryKey: ["/api/job-alerts", id],
    enabled: !!id,
  });

  const incrementView = useMutation({
    mutationFn: () => apiRequest("POST", `/api/job-alerts/${id}/view`),
  });

  useEffect(() => {
    if (id) {
      incrementView.mutate();
    }
  }, [id]);

  const getCategoryBadge = (category: string) => {
    const styles: Record<string, string> = {
      LATEST_JOB: "bg-green-100 text-green-700 border-green-200",
      RESULT: "bg-blue-100 text-blue-700 border-blue-200",
      ADMIT_CARD: "bg-orange-100 text-orange-700 border-orange-200",
      ANSWER_KEY: "bg-purple-100 text-purple-700 border-purple-200",
      SYLLABUS: "bg-cyan-100 text-cyan-700 border-cyan-200",
      ADMISSION: "bg-pink-100 text-pink-700 border-pink-200",
      IMPORTANT: "bg-red-100 text-red-700 border-red-200",
    };
    return styles[category] || "bg-gray-100 text-gray-700";
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      LATEST_JOB: "Latest Job",
      RESULT: "Result",
      ADMIT_CARD: "Admit Card",
      ANSWER_KEY: "Answer Key",
      SYLLABUS: "Syllabus",
      ADMISSION: "Admission",
      IMPORTANT: "Important",
    };
    return labels[category] || category;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-orange-50">
        <JobAlertsHeader />
        <main className="flex-1 max-w-5xl mx-auto px-4 py-8">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-64 w-full" />
        </main>
        <JobAlertsFooter />
      </div>
    );
  }

  if (!alert) {
    return (
      <div className="min-h-screen flex flex-col bg-orange-50">
        <JobAlertsHeader />
        <main className="flex-1 max-w-5xl mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Job Alert Not Found</h1>
          <Link href="/job-alerts">
            <Button>Back to Job Alerts</Button>
          </Link>
        </main>
        <JobAlertsFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-orange-50">
      <JobAlertsHeader />
      
      <main className="flex-1">
        <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white py-4 md:py-6">
          <div className="max-w-5xl mx-auto px-4">
            <Link href="/job-alerts">
              <Button variant="ghost" size="sm" className="text-white/80 hover:text-white mb-3 md:mb-4 min-h-[44px]">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Job Alerts
              </Button>
            </Link>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge className={getCategoryBadge(alert.category)} variant="outline">
                {getCategoryLabel(alert.category)}
              </Badge>
              {(() => {
                const appStatus = getApplicationStatus(alert.applicationStartDate, alert.applicationEndDate);
                return (
                  <Badge className={`${appStatus.bgColor} ${appStatus.color} border`}>
                    {appStatus.status}
                  </Badge>
                );
              })()}
              {alert.isHot && (
                <Badge variant="destructive" className="gap-1">
                  <Flame className="w-3 h-3" /> Hot
                </Badge>
              )}
              {alert.isNew && (
                <Badge className="bg-green-500 text-white">New</Badge>
              )}
            </div>
            <h1 className="text-xl md:text-3xl font-bold">{alert.title}</h1>
            <div className="flex flex-wrap gap-3 md:gap-4 mt-3 text-xs md:text-sm text-white/80">
              <span className="flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                {alert.organization}
              </span>
              {alert.viewCount > 0 && (
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {alert.viewCount} Views
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Posted: {safeFormatDate(alert.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader className="border-b">
                  <CardTitle className="text-base md:text-lg">Overview</CardTitle>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  <Table className="w-full">
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium w-1/3 text-xs md:text-sm">Organization</TableCell>
                        <TableCell>{alert.organization}</TableCell>
                      </TableRow>
                      {alert.postName && (
                        <TableRow>
                          <TableCell className="font-medium">Post Name</TableCell>
                          <TableCell>{alert.postName}</TableCell>
                        </TableRow>
                      )}
                      {alert.totalVacancies && (
                        <TableRow>
                          <TableCell className="font-medium">Total Vacancies</TableCell>
                          <TableCell className="font-semibold text-green-600">
                            {alert.totalVacancies} Posts
                          </TableCell>
                        </TableRow>
                      )}
                      {alert.qualifications && (
                        <TableRow>
                          <TableCell className="font-medium">Qualification</TableCell>
                          <TableCell>{alert.qualifications}</TableCell>
                        </TableRow>
                      )}
                      {alert.ageLimit && (
                        <TableRow>
                          <TableCell className="font-medium">Age Limit</TableCell>
                          <TableCell>{alert.ageLimit}</TableCell>
                        </TableRow>
                      )}
                      {alert.state && (
                        <TableRow>
                          <TableCell className="font-medium">Location</TableCell>
                          <TableCell>{alert.state}</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="border-b">
                  <CardTitle className="text-base md:text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Important Dates
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium w-1/3">Application Start</TableCell>
                        <TableCell className="text-green-600 font-medium">
                          {safeFormatDate(alert.applicationStartDate)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Last Date to Apply</TableCell>
                        <TableCell className="text-red-600 font-medium">
                          {safeFormatDate(alert.applicationEndDate)}
                        </TableCell>
                      </TableRow>
                      {alert.examDate && (
                        <TableRow>
                          <TableCell className="font-medium">Exam Date</TableCell>
                          <TableCell className="text-blue-600 font-medium">
                            {safeFormatDate(alert.examDate)}
                          </TableCell>
                        </TableRow>
                      )}
                      {alert.admitCardDate && (
                        <TableRow>
                          <TableCell className="font-medium">Admit Card Date</TableCell>
                          <TableCell className="text-orange-600 font-medium">
                            {safeFormatDate(alert.admitCardDate)}
                          </TableCell>
                        </TableRow>
                      )}
                      {alert.resultDate && (
                        <TableRow>
                          <TableCell className="font-medium">Result Date</TableCell>
                          <TableCell className="text-purple-600 font-medium">
                            {safeFormatDate(alert.resultDate)}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {alert.applicationFee && (
                <Card>
                  <CardHeader className="border-b">
                    <CardTitle className="text-base md:text-lg flex items-center gap-2">
                      <IndianRupee className="w-5 h-5 text-primary" />
                      Application Fee
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 overflow-x-auto">
                    <Table>
                      <TableBody>
                        {alert.applicationFee.general && (
                          <TableRow>
                            <TableCell className="font-medium w-1/3">General / OBC</TableCell>
                            <TableCell>₹{alert.applicationFee.general}/-</TableCell>
                          </TableRow>
                        )}
                        {alert.applicationFee.scSt && (
                          <TableRow>
                            <TableCell className="font-medium">SC / ST</TableCell>
                            <TableCell>₹{alert.applicationFee.scSt}/-</TableCell>
                          </TableRow>
                        )}
                        {alert.applicationFee.female && (
                          <TableRow>
                            <TableCell className="font-medium">Female</TableCell>
                            <TableCell>₹{alert.applicationFee.female}/-</TableCell>
                          </TableRow>
                        )}
                        {alert.applicationFee.pwd && (
                          <TableRow>
                            <TableCell className="font-medium">PwD</TableCell>
                            <TableCell>₹{alert.applicationFee.pwd}/-</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {alert.content && (
                <Card>
                  <CardHeader className="border-b">
                    <CardTitle className="text-lg">Details</CardTitle>
                  </CardHeader>
                  <CardContent className="prose prose-sm max-w-none pt-4">
                    <div dangerouslySetInnerHTML={{ __html: alert.content }} />
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card className="border-2 border-primary lg:sticky lg:top-20">
                <CardHeader className="bg-primary text-white">
                  <CardTitle className="text-base md:text-lg">Quick Links</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {alert.applyOnlineLink && (
                    <Button className="w-full" asChild>
                      <a href={alert.applyOnlineLink} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Apply Online
                      </a>
                    </Button>
                  )}
                  {alert.notificationPdfLink && (
                    <Button variant="outline" className="w-full" asChild>
                      <a href={alert.notificationPdfLink} target="_blank" rel="noopener noreferrer">
                        <Download className="w-4 h-4 mr-2" />
                        Download Notification
                      </a>
                    </Button>
                  )}
                  {alert.syllabusLink && (
                    <Button variant="outline" className="w-full" asChild>
                      <a href={alert.syllabusLink} target="_blank" rel="noopener noreferrer">
                        <BookOpen className="w-4 h-4 mr-2" />
                        Syllabus
                      </a>
                    </Button>
                  )}
                  {alert.admitCardLink && (
                    <Button variant="outline" className="w-full text-orange-600 border-orange-200" asChild>
                      <a href={alert.admitCardLink} target="_blank" rel="noopener noreferrer">
                        <ClipboardList className="w-4 h-4 mr-2" />
                        Admit Card
                      </a>
                    </Button>
                  )}
                  {alert.answerKeyLink && (
                    <Button variant="outline" className="w-full text-purple-600 border-purple-200" asChild>
                      <a href={alert.answerKeyLink} target="_blank" rel="noopener noreferrer">
                        <FileText className="w-4 h-4 mr-2" />
                        Answer Key
                      </a>
                    </Button>
                  )}
                  {alert.resultLink && (
                    <Button variant="outline" className="w-full text-green-600 border-green-200" asChild>
                      <a href={alert.resultLink} target="_blank" rel="noopener noreferrer">
                        <Award className="w-4 h-4 mr-2" />
                        View Result
                      </a>
                    </Button>
                  )}
                  {alert.officialWebsite && (
                    <Button variant="ghost" className="w-full" asChild>
                      <a href={alert.officialWebsite} target="_blank" rel="noopener noreferrer">
                        <Building2 className="w-4 h-4 mr-2" />
                        Official Website
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1" 
                      size="sm"
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: alert.title,
                            text: `Check out this job: ${alert.title} - ${alert.organization}`,
                            url: window.location.href,
                          });
                        } else {
                          navigator.clipboard.writeText(window.location.href);
                          window.alert('Link copied to clipboard!');
                        }
                      }}
                      data-testid="button-share"
                    >
                      <Share2 className="w-4 h-4 mr-1" />
                      Share
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1" 
                      size="sm"
                      onClick={() => {
                        const saved = JSON.parse(localStorage.getItem('savedJobs') || '[]');
                        if (!saved.includes(id)) {
                          saved.push(id);
                          localStorage.setItem('savedJobs', JSON.stringify(saved));
                          window.alert('Job saved!');
                        } else {
                          window.alert('Job already saved!');
                        }
                      }}
                      data-testid="button-save"
                    >
                      <Bookmark className="w-4 h-4 mr-1" />
                      Save
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {alert.tags && alert.tags.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Tags</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-2">
                      {alert.tags.map((tag: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <AdBanner size="rectangle" slot="sidebar-detail" />
            </div>
          </div>
        </div>
      </main>

      <JobAlertsFooter />
    </div>
  );
}
