import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Printer, Download, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

interface AdmitCardData {
  rollNumber: string;
  examTitle: string;
  examCode: string;
  examDate: string | null;
  reportingTime: string;
  gateClosingTime: string;
  examCenter: string;
  candidateName: string;
  fatherName: string;
  category: string;
  photoUrl: string | null;
  signatureUrl: string | null;
  instructions: string;
}

export default function AdmitCard() {
  const [match, params] = useRoute("/admit-card/:applicationId");
  const applicationId = params?.applicationId;

  const { data: admitCard, isLoading, error } = useQuery<AdmitCardData>({
    queryKey: ["/api/applications", applicationId, "admit-card"],
    queryFn: async () => {
      const res = await fetch(`/api/applications/${applicationId}/admit-card`, {
        credentials: "include"
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to fetch admit card");
      }
      return res.json();
    },
    enabled: !!applicationId
  });

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin w-8 h-8 text-primary" />
        </main>
      </div>
    );
  }

  if (error || !admitCard) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-8">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Admit Card Not Available</h2>
          <p className="text-muted-foreground text-center max-w-md">
            {(error as Error)?.message || "Admit cards will be available after the Commission releases them. Please check back later."}
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container-custom max-w-4xl">
          <div className="flex justify-between items-center mb-6 print:hidden">
            <h1 className="text-2xl font-bold text-primary">Admit Card</h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePrint} data-testid="button-print">
                <Printer className="w-4 h-4 mr-2" /> Print
              </Button>
              <Button onClick={handlePrint} data-testid="button-download">
                <Download className="w-4 h-4 mr-2" /> Download PDF
              </Button>
            </div>
          </div>

          <Card className="border-2 border-primary print:border-black" data-testid="admit-card">
            <CardContent className="p-0">
              <div className="bg-primary text-primary-foreground p-4 text-center">
                <h2 className="text-xl font-bold">EXAMINATION PORTAL</h2>
                <p className="text-sm opacity-90">ADMIT CARD / HALL TICKET</p>
              </div>

              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-primary mb-2" data-testid="text-exam-title">
                      {admitCard.examTitle}
                    </h3>
                    <Badge variant="secondary" data-testid="text-exam-code">{admitCard.examCode}</Badge>
                  </div>
                  <div className="w-28 h-36 border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50">
                    {admitCard.photoUrl ? (
                      <img src={admitCard.photoUrl} alt="Candidate" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-muted-foreground text-center px-2">Photo</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-muted-foreground">Roll Number</span>
                      <p className="font-bold text-lg" data-testid="text-roll-number">{admitCard.rollNumber}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Candidate Name</span>
                      <p className="font-semibold" data-testid="text-candidate-name">{admitCard.candidateName}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Father's Name</span>
                      <p className="font-semibold">{admitCard.fatherName}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Category</span>
                      <p className="font-semibold">{admitCard.category}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-muted-foreground">Exam Date</span>
                      <p className="font-bold text-lg" data-testid="text-exam-date">
                        {admitCard.examDate ? format(new Date(admitCard.examDate), 'dd MMM yyyy') : 'To be notified'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Exam Center</span>
                      <p className="font-semibold" data-testid="text-exam-center">{admitCard.examCenter}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Reporting Time</span>
                      <p className="font-semibold">{admitCard.reportingTime}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Gate Closing Time</span>
                      <p className="font-semibold text-red-600">{admitCard.gateClosingTime}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 mb-4">
                  <h4 className="font-semibold mb-2">Important Instructions:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Carry this admit card along with a valid photo ID proof.</li>
                    <li>Report at the exam center before the gate closing time.</li>
                    <li>Electronic devices including mobile phones are strictly prohibited.</li>
                    <li>{admitCard.instructions}</li>
                  </ul>
                </div>

                <div className="flex justify-between items-end border-t pt-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Candidate Signature</p>
                    <div className="w-32 h-12 border border-dashed border-slate-300 mt-1 flex items-center justify-center">
                      {admitCard.signatureUrl ? (
                        <img src={admitCard.signatureUrl} alt="Signature" className="max-w-full max-h-full" />
                      ) : (
                        <span className="text-xs text-muted-foreground">Signature</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Controller of Examinations</p>
                    <p className="font-semibold text-sm mt-1">Examination Portal</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="text-sm text-muted-foreground text-center mt-4 print:hidden">
            This is a computer generated admit card. No signature required.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
