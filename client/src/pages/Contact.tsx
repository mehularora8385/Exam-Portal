import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin, Clock, Globe, Building2 } from "lucide-react";

export default function Contact() {
  const { data: settings } = useQuery<Record<string, any>>({
    queryKey: ["/api/settings"],
  });

  const portalName = settings?.portalName || "Examination Portal";
  const contactEmail = settings?.contactEmail || "support@portal.gov.in";
  const contactPhone = settings?.contactPhone || "1800-XXX-XXXX";
  const contactAddress = settings?.contactAddress || "Block C, CGO Complex, Lodhi Road, New Delhi - 110003";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8" id="main-content">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-primary mb-2" data-testid="text-contact-title">Contact Us</h1>
          <p className="text-muted-foreground mb-8">Get in touch with {portalName}</p>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  Office Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <p className="text-foreground whitespace-pre-line" data-testid="text-contact-address">
                    {contactAddress}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary" />
                  Email Support
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <a 
                    href={`mailto:${contactEmail}`} 
                    className="text-primary hover:underline"
                    data-testid="link-contact-email"
                  >
                    {contactEmail}
                  </a>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  For queries related to examinations, applications, and technical support
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-primary" />
                  Phone Support
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <a 
                    href={`tel:${contactPhone}`} 
                    className="text-primary hover:underline"
                    data-testid="link-contact-phone"
                  >
                    {contactPhone}
                  </a>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Toll-free helpline for candidate assistance
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Working Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monday - Friday</span>
                    <span className="font-medium">9:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Saturday</span>
                    <span className="font-medium">9:00 AM - 1:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sunday</span>
                    <span className="font-medium">Closed</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                Important Links
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <a href="/exams" className="text-primary hover:underline" data-testid="link-active-exams">
                  Active Examinations
                </a>
                <a href="/notices" className="text-primary hover:underline" data-testid="link-notices">
                  Notices & Circulars
                </a>
                <a href="/results" className="text-primary hover:underline" data-testid="link-results">
                  Results
                </a>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Disclaimer</h3>
            <p className="text-sm text-muted-foreground">
              This is the official portal for government examinations. For any grievances or 
              complaints, please use the official grievance redressal system. Beware of 
              fraudulent websites and do not share your credentials with anyone.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
