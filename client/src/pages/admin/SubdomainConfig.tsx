import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Globe, Server, Shield, CheckCircle2, ExternalLink, Copy, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Exam } from "@shared/schema";

export default function SubdomainConfig() {
  const { toast } = useToast();
  
  const { data: exams } = useQuery<Exam[]>({
    queryKey: ["/api/exams"],
  });

  const activeExams = exams?.filter(e => e.isActive && !e.isDraft) || [];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8" id="main-content">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-primary mb-2" data-testid="text-subdomain-title">
            Subdomain Configuration
          </h1>
          <p className="text-muted-foreground mb-8">
            Configure exam-specific subdomains for your portal (e.g., CGL.examinationportal.com)
          </p>

          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertTitle>AWS Deployment Required</AlertTitle>
            <AlertDescription>
              Subdomain routing requires DNS and load balancer configuration in AWS. 
              Follow the steps below to set up exam-specific subdomains.
            </AlertDescription>
          </Alert>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Step 1: DNS Configuration
                </CardTitle>
                <CardDescription>Configure CNAME records for each exam subdomain</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Add CNAME records in AWS Route 53 or your DNS provider for each exam code:
                </p>
                
                <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-2">
                  {activeExams.length > 0 ? (
                    activeExams.map(exam => (
                      <div key={exam.id} className="flex items-center justify-between">
                        <span>{exam.code}.examinationportal.com → examinationportal.com</span>
                        <Button 
                          size="icon" 
                          variant="ghost"
                          onClick={() => copyToClipboard(`${exam.code}.examinationportal.com CNAME examinationportal.com`)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <>
                      <div>CGL.examinationportal.com → examinationportal.com</div>
                      <div>CHSL.examinationportal.com → examinationportal.com</div>
                      <div>MTS.examinationportal.com → examinationportal.com</div>
                    </>
                  )}
                </div>

                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
                  <span>Use CNAME records pointing to your main domain</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Step 2: SSL/TLS Certificates
                </CardTitle>
                <CardDescription>Configure wildcard SSL certificate in AWS Certificate Manager</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Create a wildcard certificate to cover all exam subdomains:
                </p>
                
                <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                  <div className="flex items-center justify-between">
                    <span>Certificate Domain: *.examinationportal.com</span>
                    <Button 
                      size="icon" 
                      variant="ghost"
                      onClick={() => copyToClipboard("*.examinationportal.com")}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
                    <span>Request certificate in AWS Certificate Manager (ACM)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
                    <span>Validate via DNS or email verification</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
                    <span>Attach to Application Load Balancer</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="w-5 h-5" />
                  Step 3: Load Balancer Rules
                </CardTitle>
                <CardDescription>Configure host-based routing in Application Load Balancer</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Set up host header routing rules in your ALB:
                </p>
                
                <div className="bg-muted p-4 rounded-lg text-sm space-y-3">
                  <div className="border-b pb-2">
                    <Badge variant="outline" className="mb-2">Rule Priority 1</Badge>
                    <div className="font-mono">
                      IF Host Header = CGL.examinationportal.com<br/>
                      THEN Forward to Target Group (with exam filter)
                    </div>
                  </div>
                  <div className="border-b pb-2">
                    <Badge variant="outline" className="mb-2">Rule Priority 2</Badge>
                    <div className="font-mono">
                      IF Host Header = CHSL.examinationportal.com<br/>
                      THEN Forward to Target Group (with exam filter)
                    </div>
                  </div>
                  <div>
                    <Badge variant="outline" className="mb-2">Default Rule</Badge>
                    <div className="font-mono">
                      IF Host Header = examinationportal.com<br/>
                      THEN Forward to Main Portal
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current Active Exams</CardTitle>
                <CardDescription>These exam codes can be used as subdomains</CardDescription>
              </CardHeader>
              <CardContent>
                {activeExams.length > 0 ? (
                  <div className="grid gap-3">
                    {activeExams.map(exam => (
                      <div key={exam.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <div className="font-medium">{exam.title}</div>
                          <div className="text-sm text-muted-foreground">Code: {exam.code}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge>{exam.code}</Badge>
                          <a 
                            href={`https://${exam.code}.examinationportal.com`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No active exams found. Create exams first.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AWS Services Required</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5" />
                    <div>
                      <div className="font-medium">Route 53</div>
                      <div className="text-muted-foreground">DNS management</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5" />
                    <div>
                      <div className="font-medium">Certificate Manager</div>
                      <div className="text-muted-foreground">SSL/TLS certificates</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5" />
                    <div>
                      <div className="font-medium">Application Load Balancer</div>
                      <div className="text-muted-foreground">Traffic routing</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5" />
                    <div>
                      <div className="font-medium">CloudFront (Optional)</div>
                      <div className="text-muted-foreground">CDN for global delivery</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
