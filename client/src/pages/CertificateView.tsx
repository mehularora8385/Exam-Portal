import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Award, Download, ArrowLeft, Shield, QrCode, Calendar,
  CheckCircle, Printer
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

export default function CertificateView() {
  const { id } = useParams();

  const { data: certificate, isLoading } = useQuery<Certificate>({
    queryKey: ["/api/certificates", id],
    enabled: !!id
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-[600px]" />
        </div>
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-4xl mx-auto text-center py-16">
          <Award className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-600">Certificate Not Found</h2>
          <Link href="/certificates">
            <Button variant="ghost">Back to Certificates</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-primary text-white py-3 px-6 print:hidden">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/certificates">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
          </Link>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" /> Print
            </Button>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <Download className="w-4 h-4 mr-2" /> Download
            </Button>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto p-6">
        <Card className="shadow-2xl overflow-hidden" id="certificate-container">
          <div className="bg-gradient-to-r from-primary via-blue-700 to-primary h-3" />
          
          <CardContent className="p-8 md:p-12">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="w-10 h-10 text-primary" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-primary mb-2">Government Examination Portal</h1>
              <p className="text-gray-600">Ministry of Personnel, Public Grievances and Pensions</p>
            </div>

            <div className="border-4 border-double border-primary/20 p-8 rounded-lg bg-white">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-serif font-bold text-primary uppercase tracking-wider">
                  {certificate.certificateType === "PROVISIONAL" ? "Provisional Certificate" : 
                   certificate.certificateType === "MARKSHEET" ? "Statement of Marks" :
                   certificate.certificateType === "MIGRATION" ? "Migration Certificate" :
                   `${certificate.certificateType} Certificate`}
                </h2>
                <div className="h-1 w-32 bg-secondary mx-auto mt-2" />
              </div>

              <div className="space-y-6 text-center">
                <div className="bg-gray-50 rounded-lg p-4 inline-block mx-auto">
                  <p className="text-sm text-gray-600 mb-1">Certificate Number</p>
                  <p className="text-xl font-mono font-bold text-primary flex items-center justify-center gap-2">
                    <QrCode className="w-5 h-5" />
                    {certificate.certificateNumber}
                  </p>
                </div>

                <div className="py-4">
                  <p className="text-lg text-gray-700 leading-relaxed">
                    This is to certify that the candidate with Application ID{" "}
                    <span className="font-semibold">{certificate.applicationId}</span>{" "}
                    has successfully completed the examination requirements.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 text-left bg-gray-50 rounded-lg p-6">
                  <div>
                    <p className="text-sm text-gray-500">Certificate Type</p>
                    <p className="font-semibold">{certificate.certificateType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {certificate.status}
                    </Badge>
                  </div>
                  {certificate.issuedAt && (
                    <div>
                      <p className="text-sm text-gray-500">Issue Date</p>
                      <p className="font-semibold flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {format(new Date(certificate.issuedAt), "dd MMMM yyyy")}
                      </p>
                    </div>
                  )}
                  {certificate.validUntil && (
                    <div>
                      <p className="text-sm text-gray-500">Valid Until</p>
                      <p className="font-semibold text-amber-600">
                        {format(new Date(certificate.validUntil), "dd MMMM yyyy")}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-8 pt-6 border-t-2 border-dashed border-gray-200">
                  <div className="flex justify-between items-end">
                    <div className="text-left">
                      <div className="w-32 h-12 border-b-2 border-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">Authorized Signatory</p>
                    </div>
                    <div className="text-center">
                      <div className="w-24 h-24 border-2 border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                        <QrCode className="w-12 h-12 text-gray-400" />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Scan to verify</p>
                    </div>
                    <div className="text-right">
                      <div className="w-20 h-20 border-2 border-gray-300 rounded-full flex items-center justify-center bg-gray-50">
                        <Shield className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Official Seal</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center text-sm text-gray-500">
              <p>This is a computer-generated certificate and is valid without signature.</p>
              <p className="mt-1">Verify online at: portal.gov.in/verify/{certificate.certificateNumber}</p>
            </div>
          </CardContent>

          <div className="bg-gradient-to-r from-primary via-blue-700 to-primary h-3" />
        </Card>
      </main>
    </div>
  );
}
