import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Clock, CheckCircle, AlertCircle, ChevronLeft, ChevronRight,
  Flag, Send, Monitor, WifiOff
} from "lucide-react";

interface Question {
  id: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC?: string;
  optionD?: string;
}

interface Response {
  questionId: number;
  selectedAnswer: string;
  markedForReview: boolean;
  timeSpent: number;
}

export default function StudentExamPanel() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const searchParams = new URLSearchParams(window.location.search);
  const token = searchParams.get("token");

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Response[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [examStarted, setExamStarted] = useState(false);

  const { data: sessionData, isLoading, error } = useQuery({
    queryKey: ["/api/student-exam/validate", token],
    queryFn: async () => {
      const res = await fetch(`/api/student-exam/validate/${token}`);
      if (!res.ok) throw new Error("Invalid session");
      return res.json();
    },
    enabled: !!token,
  });

  const { data: questionsData } = useQuery({
    queryKey: ["/api/student-exam", token, "questions"],
    queryFn: async () => {
      const res = await fetch(`/api/student-exam/${token}/questions`);
      if (!res.ok) throw new Error("Failed to fetch questions");
      return res.json();
    },
    enabled: !!token && examStarted,
  });

  const questions: Question[] = questionsData?.questions || [
    { id: 1, questionText: "Sample Question 1 - This is a demo question. Real questions will be loaded from the server.", optionA: "Option A", optionB: "Option B", optionC: "Option C", optionD: "Option D" },
  ];

  useEffect(() => {
    if (sessionData?.session?.status === "IN_PROGRESS") {
      setExamStarted(true);
      const duration = sessionData.exam?.duration || 60;
      setTimeRemaining(duration * 60);
    }
  }, [sessionData]);

  // Initialize responses when questions load
  useEffect(() => {
    if (questions.length > 0 && (responses.length === 0 || responses.length !== questions.length)) {
      setResponses(questions.map(q => ({
        questionId: q.id,
        selectedAnswer: "",
        markedForReview: false,
        timeSpent: 0,
      })));
    }
  }, [questions.length]);

  useEffect(() => {
    if (!examStarted || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examStarted, timeRemaining]);

  const saveResponseMutation = useMutation({
    mutationFn: async (data: Response[]) => {
      const res = await apiRequest("POST", `/api/student-exam/${token}/save-response`, { responses: data });
      return res.json();
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/student-exam/${token}/submit`, {
        responses,
        totalQuestions: questions.length,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Exam Submitted",
        description: "Your responses have been saved successfully",
      });
      setLocation("/student-exam/complete");
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAnswerChange = useCallback((answer: string) => {
    setResponses(prev => {
      const updated = [...prev];
      updated[currentQuestionIndex] = {
        ...updated[currentQuestionIndex],
        selectedAnswer: answer,
      };
      saveResponseMutation.mutate(updated);
      return updated;
    });
  }, [currentQuestionIndex]);

  const handleMarkForReview = useCallback(() => {
    setResponses(prev => {
      const updated = [...prev];
      updated[currentQuestionIndex] = {
        ...updated[currentQuestionIndex],
        markedForReview: !updated[currentQuestionIndex].markedForReview,
      };
      return updated;
    });
  }, [currentQuestionIndex]);

  const handleSubmit = () => {
    if (confirm("Are you sure you want to submit the exam? This action cannot be undone.")) {
      submitMutation.mutate();
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">Invalid Session</h2>
            <p className="text-muted-foreground">
              No valid session token provided. Please contact the exam center administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <Monitor className="w-16 h-16 mx-auto text-blue-500 animate-pulse mb-4" />
          <p className="text-lg">Loading exam session...</p>
        </div>
      </div>
    );
  }

  if (error || !sessionData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">Session Error</h2>
            <p className="text-muted-foreground">
              Unable to load your exam session. Please contact the invigilator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (sessionData.session.status === "WAITING") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-indigo-900">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Monitor className="w-10 h-10 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Ready for Exam</CardTitle>
            <CardDescription>
              Your session is ready. Waiting for invigilator to start the exam.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Candidate:</span>
                <span className="font-medium">{sessionData.candidate?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Roll Number:</span>
                <span className="font-mono">{sessionData.candidate?.rollNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Exam:</span>
                <span className="font-medium">{sessionData.exam?.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Seat:</span>
                <span>{sessionData.session?.seatNumber || "Assigned"}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-yellow-600">
              <Clock className="w-5 h-5 animate-pulse" />
              <span>Waiting for exam to start...</span>
            </div>

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
              <p>Please wait for the invigilator to start your exam. Do not close this window.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (sessionData.session.status === "SUBMITTED") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="w-20 h-20 mx-auto text-green-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Exam Submitted</h2>
            <p className="text-muted-foreground mb-4">
              Your responses have been saved. You may close this window now.
            </p>
            <Badge className="bg-green-500">Submission Successful</Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentResponse = responses[currentQuestionIndex];
  const answeredCount = responses.filter(r => r.selectedAnswer).length;
  const markedCount = responses.filter(r => r.markedForReview).length;
  const progress = (answeredCount / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-blue-900 text-white p-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="bg-white/10 text-white border-white/20">
            <WifiOff className="w-3 h-3 mr-1" />
            Offline Mode
          </Badge>
          <span className="font-medium">{sessionData.exam?.title}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className={`px-4 py-2 rounded font-mono text-lg ${timeRemaining < 300 ? 'bg-red-500 animate-pulse' : 'bg-blue-700'}`}>
            <Clock className="w-4 h-4 inline mr-2" />
            {formatTime(timeRemaining)}
          </div>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
            data-testid="button-submit-exam"
          >
            <Send className="w-4 h-4 mr-2" />
            Submit Exam
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 p-6 overflow-y-auto">
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </CardTitle>
                <Button
                  variant={currentResponse?.markedForReview ? "default" : "outline"}
                  size="sm"
                  onClick={handleMarkForReview}
                  data-testid="button-mark-review"
                >
                  <Flag className="w-4 h-4 mr-1" />
                  {currentResponse?.markedForReview ? "Marked" : "Mark for Review"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-lg mb-6">{currentQuestion.questionText}</p>

              <RadioGroup
                value={currentResponse?.selectedAnswer || ""}
                onValueChange={handleAnswerChange}
                className="space-y-3"
              >
                {["A", "B", "C", "D"].map((option) => {
                  const optionValue = currentQuestion[`option${option}` as keyof Question];
                  if (!optionValue) return null;
                  return (
                    <div
                      key={option}
                      className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                        currentResponse?.selectedAnswer === option
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => handleAnswerChange(option)}
                    >
                      <RadioGroupItem value={option} id={`option-${option}`} />
                      <Label htmlFor={`option-${option}`} className="flex-1 cursor-pointer">
                        <span className="font-bold mr-2">({option})</span>
                        {optionValue as string}
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>

              <div className="flex items-center justify-between mt-6">
                <Button
                  variant="outline"
                  onClick={() => setCurrentQuestionIndex(i => Math.max(0, i - 1))}
                  disabled={currentQuestionIndex === 0}
                  data-testid="button-prev"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <Button
                  onClick={() => setCurrentQuestionIndex(i => Math.min(questions.length - 1, i + 1))}
                  disabled={currentQuestionIndex === questions.length - 1}
                  data-testid="button-next"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>

        <aside className="w-72 bg-white border-l p-4 overflow-y-auto">
          <div className="space-y-4">
            <div className="border-b pb-4">
              <div className="flex items-center gap-3 mb-3">
                {sessionData.candidate?.photoUrl ? (
                  <img 
                    src={sessionData.candidate.photoUrl} 
                    alt="Student Photo" 
                    className="w-16 h-16 rounded-full object-cover border-2 border-blue-500"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-500">
                    <span className="text-xl font-bold text-blue-600">
                      {sessionData.candidate?.name?.charAt(0) || "?"}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-medium text-sm">{sessionData.candidate?.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{sessionData.candidate?.rollNumber}</p>
                </div>
              </div>
              {sessionData.candidate?.signatureUrl && (
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-xs text-muted-foreground mb-1">Signature</p>
                  <img 
                    src={sessionData.candidate.signatureUrl} 
                    alt="Student Signature" 
                    className="h-8 object-contain"
                  />
                </div>
              )}
            </div>

            <div>
              <h3 className="font-medium mb-2">Progress</h3>
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground mt-1">
                {answeredCount} of {questions.length} answered
              </p>
            </div>

            <div className="flex gap-2 text-sm">
              <Badge variant="outline" className="gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                Answered: {answeredCount}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Flag className="w-3 h-3" />
                Review: {markedCount}
              </Badge>
            </div>

            <div>
              <h3 className="font-medium mb-2">Question Palette</h3>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, index) => {
                  const response = responses[index];
                  let bgClass = "bg-gray-200";
                  if (response?.selectedAnswer) bgClass = "bg-green-500 text-white";
                  if (response?.markedForReview) bgClass = "bg-yellow-500 text-white";
                  if (index === currentQuestionIndex) bgClass += " ring-2 ring-blue-500";

                  return (
                    <button
                      key={q.id}
                      className={`w-8 h-8 rounded text-sm font-medium ${bgClass}`}
                      onClick={() => setCurrentQuestionIndex(index)}
                      data-testid={`button-question-${index + 1}`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gray-200" />
                <span>Not Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-500" />
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-yellow-500" />
                <span>Marked for Review</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
