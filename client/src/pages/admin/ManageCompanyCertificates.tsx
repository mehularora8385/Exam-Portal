import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Shield, Trash2, Copy, QrCode, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

interface CompanyCertificate {
  id: number;
  certificateNumber: string;
  certificateType: string;
  title: string;
  description: string | null;
  issuedTo: string;
  issuedBy: string;
  issueDate: string;
  validUntil: string | null;
  status: string;
  verificationCode: string;
  metadata: any;
  createdAt: string;
}

const CERTIFICATE_TYPES = [
  { value: "INFRASTRUCTURE", label: "Infrastructure Compliance" },
  { value: "SECURITY", label: "Security Compliance (CERT-IN)" },
  { value: "UPTIME", label: "Uptime Guarantee" },
  { value: "GIGW", label: "GIGW 3.0 Accessibility" },
  { value: "DATA_PROTECTION", label: "Data Protection & Privacy" },
];

export default function ManageCompanyCertificates() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    certificateType: "",
    title: "",
    description: "",
    issuedTo: "Sai Educare Private Limited",
    issuedBy: "Sai Educare Private Limited",
    issueDate: new Date().toISOString().split("T")[0],
    validUntil: "",
    metadata: {
      signatoryName: "",
      signatoryDesignation: "Managing Director",
      companyAddress: "A-18, 2nd Floor, RV Tower, Prince Rd, A, Opp. Sarovar Portico, Nityanand Nagar, Vaishali Nagar, Jaipur, Rajasthan 302021",
    },
  });
  const { toast } = useToast();

  const { data: certificates = [], isLoading } = useQuery<CompanyCertificate[]>({
    queryKey: ["/api/admin/company-certificates"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/admin/company-certificates", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/company-certificates"] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Success", description: "Certificate created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create certificate", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/company-certificates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/company-certificates"] });
      toast({ title: "Success", description: "Certificate deleted" });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("PATCH", `/api/admin/company-certificates/${id}`, { status: "REVOKED" });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/company-certificates"] });
      toast({ title: "Success", description: "Certificate revoked" });
    },
  });

  const resetForm = () => {
    setFormData({
      certificateType: "",
      title: "",
      description: "",
      issuedTo: "Sai Educare Private Limited",
      issuedBy: "Sai Educare Private Limited",
      issueDate: new Date().toISOString().split("T")[0],
      validUntil: "",
      metadata: {
        signatoryName: "",
        signatoryDesignation: "Managing Director",
        companyAddress: "A-18, 2nd Floor, RV Tower, Prince Rd, A, Opp. Sarovar Portico, Nityanand Nagar, Vaishali Nagar, Jaipur, Rajasthan 302021",
      },
    });
  };

  const handleSubmit = () => {
    if (!formData.certificateType || !formData.title) {
      toast({ title: "Error", description: "Please fill required fields", variant: "destructive" });
      return;
    }
    createMutation.mutate(formData);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: `${label} copied to clipboard` });
  };

  const getVerificationUrl = (code: string) => {
    return `${window.location.origin}/verify-company-certificate?code=${code}`;
  };

  const getCertificateTypeLabel = (type: string) => {
    return CERTIFICATE_TYPES.find((t) => t.value === type)?.label || type;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold">Company Certificates</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage tender compliance certificates for verification</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-certificate">
              <Plus className="h-4 w-4 mr-2" />
              Create Certificate
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Company Certificate</DialogTitle>
              <DialogDescription>
                Create a new compliance certificate for tender purposes
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Certificate Type *</Label>
                  <Select
                    value={formData.certificateType}
                    onValueChange={(value) => setFormData({ ...formData, certificateType: value })}
                  >
                    <SelectTrigger data-testid="select-certificate-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {CERTIFICATE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Issue Date *</Label>
                  <Input
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                    data-testid="input-issue-date"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Certificate Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Infrastructure Compliance Certificate"
                  data-testid="input-certificate-title"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the certificate"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Issued To</Label>
                  <Input
                    value={formData.issuedTo}
                    onChange={(e) => setFormData({ ...formData, issuedTo: e.target.value })}
                    data-testid="input-issued-to"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Issued By</Label>
                  <Input
                    value={formData.issuedBy}
                    onChange={(e) => setFormData({ ...formData, issuedBy: e.target.value })}
                    data-testid="input-issued-by"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Valid Until (optional)</Label>
                <Input
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  data-testid="input-valid-until"
                />
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Signatory Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Signatory Name</Label>
                    <Input
                      value={formData.metadata.signatoryName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          metadata: { ...formData.metadata, signatoryName: e.target.value },
                        })
                      }
                      placeholder="e.g., Mr. Rajesh Kumar"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Signatory Designation</Label>
                    <Input
                      value={formData.metadata.signatoryDesignation}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          metadata: { ...formData.metadata, signatoryDesignation: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={createMutation.isPending} data-testid="button-submit-certificate">
                  {createMutation.isPending ? "Creating..." : "Create Certificate"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Issued Certificates</CardTitle>
          <CardDescription>
            All certificates that can be verified at /verify-company-certificate
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : certificates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No certificates created yet. Click "Create Certificate" to add one.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Certificate No.</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verification Code</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {certificates.map((cert) => (
                  <TableRow key={cert.id}>
                    <TableCell className="font-mono text-sm">
                      <div className="flex items-center gap-1">
                        {cert.certificateNumber}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(cert.certificateNumber, "Certificate number")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getCertificateTypeLabel(cert.certificateType)}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{cert.title}</TableCell>
                    <TableCell>{format(new Date(cert.issueDate), "dd/MM/yyyy")}</TableCell>
                    <TableCell>
                      {cert.validUntil ? format(new Date(cert.validUntil), "dd/MM/yyyy") : "No Expiry"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={cert.status === "ACTIVE" ? "default" : "destructive"}>
                        {cert.status === "ACTIVE" ? (
                          <><CheckCircle className="h-3 w-3 mr-1" /> Active</>
                        ) : (
                          <><XCircle className="h-3 w-3 mr-1" /> {cert.status}</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      <div className="flex items-center gap-1">
                        {cert.verificationCode}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(cert.verificationCode, "Verification code")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(getVerificationUrl(cert.verificationCode), "Verification URL")}
                        >
                          <QrCode className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {cert.status === "ACTIVE" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => revokeMutation.mutate(cert.id)}
                            className="text-yellow-600"
                          >
                            Revoke
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this certificate?")) {
                              deleteMutation.mutate(cert.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>How Verification Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
          <p>1. When you create a certificate, a unique certificate number and verification code are generated.</p>
          <p>2. Include the certificate number on your tender documents.</p>
          <p>3. Anyone can verify the certificate at: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">/verify-company-certificate</code></p>
          <p>4. The QR code on printed certificates links directly to the verification page.</p>
        </CardContent>
      </Card>
    </div>
  );
}
