import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, XCircle, Search, Building2, Calendar, FileCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

interface CertificateInfo {
  certificateNumber: string;
  certificateType: string;
  title: string;
  issuedTo: string;
  issuedBy: string;
  issueDate: string;
  validUntil: string | null;
  status: string;
  metadata?: {
    signatoryName?: string;
    signatoryDesignation?: string;
    companyAddress?: string;
    specifications?: Record<string, string>;
  };
}

interface VerificationResult {
  verified: boolean;
  certificate?: CertificateInfo;
  message: string;
}

export default function VerifyCompanyCertificate() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const { toast } = useToast();

  const handleVerify = async () => {
    if (!code.trim()) {
      toast({ title: "Error", description: "Please enter a certificate number or verification code", variant: "destructive" });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(`/api/company-certificates/verify/${encodeURIComponent(code.trim())}`);
      const data = await response.json();
      setResult(data);
    } catch (error) {
      toast({ title: "Error", description: "Verification failed. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getCertificateTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      INFRASTRUCTURE: "Infrastructure Compliance",
      SECURITY: "Security Compliance (CERT-IN)",
      UPTIME: "Uptime Guarantee",
      GIGW: "GIGW 3.0 Accessibility",
      DATA_PROTECTION: "Data Protection & Privacy",
    };
    return types[type] || type;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Shield className="h-12 w-12 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Certificate Verification
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              Verify the authenticity of compliance certificates issued by Sai Educare Private Limited
            </p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Enter Certificate Details
              </CardTitle>
              <CardDescription>
                Enter the certificate number (e.g., SEPL/INF/2026/1234) or the 16-character verification code
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Input
                  placeholder="Certificate Number or Verification Code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                  className="flex-1"
                  data-testid="input-certificate-code"
                />
                <Button onClick={handleVerify} disabled={loading} data-testid="button-verify-certificate">
                  {loading ? "Verifying..." : "Verify"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {result && (
            <Card className={result.verified ? "border-green-500 bg-green-50 dark:bg-green-900/20" : "border-red-500 bg-red-50 dark:bg-red-900/20"}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  {result.verified ? (
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  ) : (
                    <XCircle className="h-8 w-8 text-red-600" />
                  )}
                  <div>
                    <CardTitle className={result.verified ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}>
                      {result.verified ? "Certificate Verified" : "Verification Failed"}
                    </CardTitle>
                    <CardDescription className={result.verified ? "text-green-600" : "text-red-600"}>
                      {result.message}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              {result.certificate && (
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Certificate Number</p>
                      <p className="font-mono font-semibold" data-testid="text-certificate-number">
                        {result.certificate.certificateNumber}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Certificate Type</p>
                      <Badge variant={result.verified ? "default" : "destructive"}>
                        {getCertificateTypeLabel(result.certificate.certificateType)}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Title</p>
                    <p className="font-semibold">{result.certificate.title}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Building2 className="h-4 w-4" /> Issued To
                      </p>
                      <p className="font-semibold">{result.certificate.issuedTo}</p>
                      {result.certificate.metadata?.companyAddress && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {result.certificate.metadata.companyAddress}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <FileCheck className="h-4 w-4" /> Issued By
                      </p>
                      <p className="font-semibold">{result.certificate.issuedBy}</p>
                      {result.certificate.metadata?.signatoryName && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {result.certificate.metadata.signatoryName}
                          {result.certificate.metadata.signatoryDesignation && 
                            `, ${result.certificate.metadata.signatoryDesignation}`}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Calendar className="h-4 w-4" /> Issue Date
                      </p>
                      <p className="font-semibold">
                        {format(new Date(result.certificate.issueDate), "dd MMMM yyyy")}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Calendar className="h-4 w-4" /> Valid Until
                      </p>
                      <p className="font-semibold">
                        {result.certificate.validUntil 
                          ? format(new Date(result.certificate.validUntil), "dd MMMM yyyy")
                          : "No Expiry"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                    <Badge variant={result.certificate.status === "ACTIVE" ? "default" : "destructive"}>
                      {result.certificate.status}
                    </Badge>
                  </div>

                  {result.certificate.metadata?.specifications && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Specifications</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {Object.entries(result.certificate.metadata.specifications).map(([key, value]) => (
                          <div key={key} className="flex justify-between border-b pb-1">
                            <span className="text-gray-600 dark:text-gray-400">{key}</span>
                            <span className="font-medium">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          )}

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>About Certificate Verification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
              <p>
                This verification system allows you to confirm the authenticity of compliance 
                certificates issued by <strong>Sai Educare Private Limited</strong>.
              </p>
              <p>
                <strong>How to verify:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Enter the certificate number printed on the document (e.g., SEPL/INF/2026/1234)</li>
                <li>Or enter the 16-character verification code from the QR code</li>
                <li>Click "Verify" to check the certificate's authenticity</li>
              </ul>
              <p>
                <strong>Company Details:</strong><br />
                Sai Educare Private Limited<br />
                A-18, 2nd Floor, RV Tower, Prince Rd, A<br />
                Opp. Sarovar Portico, Nityanand Nagar<br />
                Vaishali Nagar, Jaipur, Rajasthan 302021
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
