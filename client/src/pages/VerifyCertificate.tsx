import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Shield, Search, CheckCircle, XCircle, QrCode, Award, 
  Calendar, User, FileText, Loader2, Home 
} from "lucide-react";
import { format } from "date-fns";

interface VerificationResult {
  certificate: {
    id: number;
    certificateNumber: string;
    certificateType: string;
    status: string;
    issuedAt: string | null;
    validUntil: string | null;
  };
  exam: {
    name: string;
    code: string;
  } | null;
  candidate: {
    name: string;
    registrationNumber: string;
  } | null;
}

export default function VerifyCertificate() {
  const [certificateNumber, setCertificateNumber] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const { toast } = useToast();

  const handleVerify = async () => {
    if (!certificateNumber.trim()) {
      toast({ title: "Please enter a certificate number", variant: "destructive" });
      return;
    }
    
    setIsVerifying(true);
    setResult(null);
    setNotFound(false);

    try {
      const res = await apiRequest("GET", `/api/certificates/verify/${certificateNumber.trim()}`);
      const data = await res.json();
      setResult(data);
    } catch (error: any) {
      if (error.message?.includes("404") || error.message?.includes("not found")) {
        setNotFound(true);
      } else {
        toast({ title: "Verification Failed", description: error.message, variant: "destructive" });
      }
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="bg-primary text-white py-2 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between text-sm">
          <span>Certificate Verification Portal</span>
          <Link href="/" className="flex items-center gap-1 hover:underline">
            <Home className="w-4 h-4" /> Home
          </Link>
        </div>
      </div>

      <header className="bg-white shadow-sm border-b-4 border-secondary py-4">
        <div className="max-w-4xl mx-auto px-4 flex items-center gap-4">
          <div className="flex items-center justify-center w-16 h-16 bg-primary rounded-full">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary">Certificate Verification</h1>
            <p className="text-sm text-muted-foreground">Verify authenticity of certificates issued by the portal</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <Card className="shadow-xl">
          <CardHeader className="bg-primary text-white">
            <CardTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" /> Enter Certificate Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Enter Certificate Number (e.g., CGL-PRO-2026-123456)"
                  value={certificateNumber}
                  onChange={(e) => setCertificateNumber(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                  className="h-12 text-lg font-mono"
                  data-testid="input-cert-number"
                />
              </div>
              <Button 
                onClick={handleVerify} 
                className="h-12 px-6"
                disabled={isVerifying}
                data-testid="button-verify"
              >
                {isVerifying ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</>
                ) : (
                  <><Search className="w-4 h-4 mr-2" /> Verify</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {notFound && (
          <Card className="mt-6 border-red-200 bg-red-50">
            <CardContent className="p-6 text-center">
              <XCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
              <h3 className="text-xl font-semibold text-red-800 mb-2">Certificate Not Found</h3>
              <p className="text-red-600">
                No certificate was found with the provided number. Please check the certificate number and try again.
              </p>
              <p className="text-sm text-red-500 mt-4">
                If you believe this is an error, please contact the issuing authority.
              </p>
            </CardContent>
          </Card>
        )}

        {result && (
          <Card className="mt-6 border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                <h3 className="text-xl font-semibold text-green-800 mb-2">Certificate Verified</h3>
                <p className="text-green-600">This certificate is authentic and was issued by the portal.</p>
              </div>

              <div className="bg-white rounded-lg p-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <QrCode className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Certificate Number</p>
                      <p className="font-mono font-semibold">{result.certificate.certificateNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Certificate Type</p>
                      <p className="font-semibold">{result.certificate.certificateType}</p>
                    </div>
                  </div>
                  {result.candidate && (
                    <>
                      <div className="flex items-start gap-3">
                        <User className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Candidate Name</p>
                          <p className="font-semibold">{result.candidate.name}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Award className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Registration Number</p>
                          <p className="font-semibold">{result.candidate.registrationNumber}</p>
                        </div>
                      </div>
                    </>
                  )}
                  {result.exam && (
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Examination</p>
                        <p className="font-semibold">{result.exam.name} ({result.exam.code})</p>
                      </div>
                    </div>
                  )}
                  {result.certificate.issuedAt && (
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Issue Date</p>
                        <p className="font-semibold">{format(new Date(result.certificate.issuedAt), "dd MMMM yyyy")}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-4 border-t">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  {result.certificate.status === "ISSUED" || result.certificate.status === "GENERATED" ? (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" /> Valid
                    </Badge>
                  ) : result.certificate.status === "REVOKED" ? (
                    <Badge variant="destructive">
                      <XCircle className="w-3 h-3 mr-1" /> Revoked
                    </Badge>
                  ) : (
                    <Badge variant="outline">{result.certificate.status}</Badge>
                  )}
                  
                  {result.certificate.validUntil && (
                    <span className="text-sm text-amber-600 ml-4">
                      Valid until: {format(new Date(result.certificate.validUntil), "dd MMM yyyy")}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg text-blue-800 flex items-center gap-2">
              <Shield className="w-5 h-5" /> About Certificate Verification
            </CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700 text-sm space-y-2">
            <p>This verification system allows employers, institutions, and other authorized parties to verify the authenticity of certificates issued through the Government Examination Portal.</p>
            <p>You can verify certificates by:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Entering the certificate number manually</li>
              <li>Scanning the QR code printed on the certificate</li>
            </ul>
            <p className="mt-4">For any discrepancies or issues, please contact the examination authority.</p>
          </CardContent>
        </Card>
      </main>

      <footer className="bg-primary text-white py-4 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm">
          <p>Government Examination Portal - Certificate Verification System</p>
          <p className="text-white/70 mt-1">For official use only</p>
        </div>
      </footer>
    </div>
  );
}
