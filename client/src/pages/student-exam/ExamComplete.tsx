import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock } from "lucide-react";

export default function ExamComplete() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-green-800">Exam Completed</h1>
            <p className="text-muted-foreground">
              Your exam has been submitted successfully. Your responses have been saved.
            </p>
          </div>

          <Badge className="bg-green-500 text-white px-4 py-2">
            <CheckCircle className="w-4 h-4 mr-2" />
            Submission Confirmed
          </Badge>

          <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
            <p className="flex items-center justify-center gap-2">
              <Clock className="w-4 h-4" />
              Your responses will be synced to the main server by the exam center.
            </p>
          </div>

          <p className="text-sm text-muted-foreground">
            You may now close this window or wait for further instructions from the invigilator.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
