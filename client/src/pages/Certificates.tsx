import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Award, Download, Eye, Shield, CheckCircle, Clock, XCircle, 
  ArrowLeft, QrCode, Calendar, FileText 
} from "lucide-react";
import { format } from "date-fns";

interface Certificate {
  id: number;
  applicationId: number;
  candidateId: number;
  examId: number;
  certificateNumber: string;
  certificateType: string;
  status: string;
  issuedAt: string | null;
  validUntil: string | null;
  documentUrl: string | null;
  qrCode: string | null;
  createdAt: string;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "GENERATED":
    case "ISSUED":
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" /> {status}</Badge>;
    case "PENDING":
      return <Badge variant="outline" className="text-yellow-700"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
    case "REVOKED":
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Revoked</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getTypeIcon(type: string) {
  switch (type) {
    case "PROVISIONAL":
      return <Award className="w-5 h-5 text-blue-600" />;
    case "MARKSHEET":
      return <FileText className="w-5 h-5 text-green-600" />;
    case "MIGRATION":
      return <Shield className="w-5 h-5 text-purple-600" />;
    default:
      return <Award className="w-5 h-5 text-gray-600" />;
  }
}

export default function Certificates() {
  const { data: certificates, isLoading } = useQuery<Certificate[]>({
    queryKey: ["/api/my-certificates"]
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-12 w-64" />
          {[1, 2].map(i => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-primary text-white py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Award className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">My Certificates</h1>
              <p className="text-sm text-white/80">Download your certificates and mark sheets</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto p-6">
        {!certificates || certificates.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Award className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Certificates Available</h3>
              <p className="text-gray-500">
                Your certificates and mark sheets will appear here once they are generated after result declaration.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {certificates.map((cert) => (
              <Card key={cert.id} className="hover-elevate transition-all">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center">
                        {getTypeIcon(cert.certificateType)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold">{cert.certificateType} Certificate</h3>
                          {getStatusBadge(cert.status)}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p className="flex items-center gap-2">
                            <QrCode className="w-4 h-4" />
                            Certificate No: <span className="font-mono font-medium">{cert.certificateNumber}</span>
                          </p>
                          {cert.issuedAt && (
                            <p className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              Issued: {format(new Date(cert.issuedAt), "dd MMM yyyy")}
                            </p>
                          )}
                          {cert.validUntil && (
                            <p className="flex items-center gap-2 text-amber-600">
                              <Clock className="w-4 h-4" />
                              Valid until: {format(new Date(cert.validUntil), "dd MMM yyyy")}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/certificate/${cert.id}`}>
                        <Button variant="outline" size="sm" data-testid={`button-view-cert-${cert.id}`}>
                          <Eye className="w-4 h-4 mr-2" /> View
                        </Button>
                      </Link>
                      {cert.status === "ISSUED" && (
                        <Button size="sm" data-testid={`button-download-cert-${cert.id}`}>
                          <Download className="w-4 h-4 mr-2" /> Download
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg text-blue-800 flex items-center gap-2">
              <Shield className="w-5 h-5" /> Certificate Verification
            </CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700 text-sm">
            <p>All certificates issued through this portal can be verified online at:</p>
            <p className="font-mono font-medium mt-2">https://portal.gov.in/verify/[certificate-number]</p>
            <p className="mt-2">Employers and institutions can scan the QR code on the certificate for instant verification.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
