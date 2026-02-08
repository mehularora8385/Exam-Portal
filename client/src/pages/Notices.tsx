import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useNotices } from "@/hooks/use-notices";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FileText, Download, ChevronRight, Bell, Award, CreditCard, Calendar, X, ExternalLink } from "lucide-react";
import { format, isValid, parseISO } from "date-fns";

function safeFormatDate(dateValue: any, formatStr: string): string {
  if (!dateValue) return "";
  try {
    const date = typeof dateValue === "string" ? parseISO(dateValue) : new Date(dateValue);
    return isValid(date) ? format(date, formatStr) : "";
  } catch {
    return "";
  }
}

export default function Notices() {
  const { data: notices, isLoading } = useNotices();
  const [selectedNotice, setSelectedNotice] = useState<any>(null);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'RESULT': return <Award className="w-5 h-5" />;
      case 'ADMIT_CARD': return <CreditCard className="w-5 h-5" />;
      case 'NOTIFICATION': return <Bell className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getTypeBadgeStyle = (type: string) => {
    switch (type) {
      case 'RESULT': return 'bg-green-100 text-green-800 border-green-200';
      case 'ADMIT_CARD': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'NOTIFICATION': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleNoticeClick = (notice: any) => {
    setSelectedNotice(notice);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-6 md:py-10 flex-1 w-full">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-primary mb-2">Notices & Circulars</h1>
          <p className="text-sm md:text-base text-muted-foreground">Stay updated with the latest announcements, results, and admit cards.</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-20" />)}
          </div>
        ) : notices && notices.length > 0 ? (
          <div className="space-y-3 md:space-y-4">
            {notices.map((notice) => (
              <Card 
                key={notice.id} 
                className="hover:shadow-md transition-shadow cursor-pointer group border border-slate-200 hover:border-primary/50"
                onClick={() => handleNoticeClick(notice)}
                data-testid={`notice-card-${notice.id}`}
              >
                <CardContent className="p-4 md:p-5">
                  <div className="flex items-start gap-3 md:gap-4">
                    <div className="bg-primary/10 text-primary p-2.5 md:p-3 rounded-lg shrink-0">
                      {getTypeIcon(notice.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-sm md:text-base text-foreground group-hover:text-primary transition-colors">
                          {notice.title}
                        </h3>
                        {notice.isNew && (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-red-100 text-red-600 font-bold uppercase shrink-0">New</span>
                        )}
                      </div>
                      <p className="text-xs md:text-sm text-muted-foreground line-clamp-1">{notice.content}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Badge variant="outline" className={`${getTypeBadgeStyle(notice.type)} text-xs`}>
                          {notice.type?.replace(/_/g, ' ')}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {safeFormatDate(notice.publishedAt, 'dd MMM yyyy') || 'N/A'}
                        </span>
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors shrink-0 hidden md:block self-center" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-16 border-dashed border-2">
            <CardContent>
              <Bell className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Notices Available</h3>
              <p className="text-muted-foreground">Check back later for new announcements.</p>
            </CardContent>
          </Card>
        )}
      </main>

      <Dialog open={!!selectedNotice} onOpenChange={() => setSelectedNotice(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${selectedNotice ? getTypeBadgeStyle(selectedNotice.type) : ''}`}>
                {selectedNotice && getTypeIcon(selectedNotice.type)}
              </div>
              <div className="flex-1">
                <DialogTitle className="text-lg md:text-xl font-bold text-foreground">
                  {selectedNotice?.title}
                </DialogTitle>
                <DialogDescription className="flex flex-wrap items-center gap-3 mt-2">
                  <Badge variant="outline" className={selectedNotice ? getTypeBadgeStyle(selectedNotice.type) : ''}>
                    {selectedNotice?.type?.replace(/_/g, ' ')}
                  </Badge>
                  <span className="text-sm">
                    Published: {safeFormatDate(selectedNotice?.publishedAt, 'dd MMMM yyyy') || 'N/A'}
                  </span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="mt-4 space-y-4">
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="text-foreground leading-relaxed whitespace-pre-wrap text-sm md:text-base">
                {selectedNotice?.content}
              </p>
            </div>

            {(selectedNotice?.pdfUrl || selectedNotice?.linkUrl) && (
              <div className="flex flex-col sm:flex-row gap-3">
                {selectedNotice?.pdfUrl && (
                  <Button asChild className="flex-1" data-testid="button-download-pdf">
                    <a href={selectedNotice.pdfUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </a>
                  </Button>
                )}
                {selectedNotice?.linkUrl && (
                  <Button variant="outline" asChild className="flex-1" data-testid="button-open-link">
                    <a href={selectedNotice.linkUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open Link
                    </a>
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
