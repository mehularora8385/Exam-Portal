import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CreditCard, IndianRupee } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { JobAlertsHeader } from "@/components/JobAlertsHeader";
import { JobAlertsFooter } from "@/components/JobAlertsFooter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { 
  Clock, ChevronLeft, ChevronRight, Flag, CheckCircle, XCircle, 
  AlertTriangle, BookmarkPlus, Bookmark, Send, RotateCcw, Eye,
  FileText, Award, Timer, Users, ArrowLeft, Play, Loader2
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Question {
  id: number;
  paragraph?: string;
  paragraphImage?: string;
  questionText: string;
  questionImage?: string;
  optionA: string;
  optionB: string;
  optionC?: string;
  optionD?: string;
  optionAImage?: string;
  optionBImage?: string;
  optionCImage?: string;
  optionDImage?: string;
  section?: string;
  marks?: number;
  questionOrder?: number;
  correctAnswer?: string;
  explanation?: string;
  userAnswer?: string | null;
  isCorrect?: boolean;
}

interface TestData {
  id: number;
  title: string;
  duration: number;
  totalQuestions: number;
  totalMarks: number;
  negativeMarking: string;
  sections?: { name: string; questions: number; marks: number }[];
  instructions?: string;
}

interface TestResult {
  totalQuestions: number;
  attempted: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  marksObtained: number;
  totalMarks: number;
  percentage: string;
  timeSpent: number;
  sectionResults?: { section: string; attempted: number; correct: number; incorrect: number; marks: number }[];
}

type TestStage = "info" | "payment" | "instructions" | "test" | "result";

export default function TakeTest() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  
  // Fetch test info
  const { data: test, isLoading: testLoading } = useQuery<any>({
    queryKey: ["/api/test-series", id],
    enabled: !!id,
  });
  
  const [stage, setStage] = useState<TestStage>("info");
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [candidateMobile, setCandidateMobile] = useState("");
  
  // Payment state
  const [paymentId, setPaymentId] = useState<number | null>(null);
  const [orderId, setOrderId] = useState<string>("");
  const [hasPaid, setHasPaid] = useState(false);
  const [paymentMode, setPaymentMode] = useState<"RAZORPAY" | "DEMO">("DEMO");
  const [razorpayKeyId, setRazorpayKeyId] = useState<string>("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [testData, setTestData] = useState<TestData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [bookmarks, setBookmarks] = useState<Set<number>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  
  const [result, setResult] = useState<TestResult | null>(null);
  const [resultQuestions, setResultQuestions] = useState<Question[]>([]);
  const [showReview, setShowReview] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startTestMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/test-series/${id}/start`, {
        sessionId: `guest-${Date.now()}`,
        candidateName,
        candidateEmail,
        candidateMobile,
        paymentId, // Required for paid tests
      });
      return response.json();
    },
    onSuccess: (data) => {
      setAttemptId(data.attemptId);
      setSessionId(data.sessionId);
      setTestData(data.test);
      setQuestions(data.questions);
      setTimeRemaining(data.test.duration * 60);
      setStage("test");
    },
    onError: (error: any) => {
      alert(error.message || "Failed to start test");
    },
  });

  const saveAnswerMutation = useMutation({
    mutationFn: async ({ questionId, answer, bookmarked }: { questionId: number; answer: string | null; bookmarked?: boolean }) => {
      await apiRequest("PATCH", `/api/test-attempts/${attemptId}/answer`, {
        questionId,
        answer,
        bookmarked,
        timeSpent,
      });
    },
  });

  const submitTestMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/test-attempts/${attemptId}/submit`, {
        timeSpent,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setResult(data.result);
      setResultQuestions(data.questions);
      setStage("result");
      setIsSubmitting(false);
    },
    onError: (error: any) => {
      alert(error.message || "Failed to submit test");
      setIsSubmitting(false);
    },
  });

  // Payment mutations
  const createPaymentMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/test-series/${id}/payment/create`, {
        name: candidateName,
        email: candidateEmail,
        mobile: candidateMobile,
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.isFree) {
        setHasPaid(true);
        setStage("instructions");
        return;
      }
      
      setPaymentId(data.paymentId);
      setOrderId(data.orderId);
      setPaymentMode(data.mode === "RAZORPAY" ? "RAZORPAY" : "DEMO");
      if (data.razorpayKeyId) {
        setRazorpayKeyId(data.razorpayKeyId);
      }
      setStage("payment");
    },
    onError: (error: any) => {
      alert(error.message || "Failed to create payment");
    },
  });

  const simulatePaymentMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/test-series/${id}/payment/simulate`, {
        paymentId,
      });
      return response.json();
    },
    onSuccess: () => {
      setHasPaid(true);
      setStage("instructions");
    },
    onError: (error: any) => {
      alert(error.message || "Payment simulation failed");
    },
  });

  // Handle Razorpay payment
  const handleRazorpayPayment = () => {
    const testInfo = test;
    if (!testInfo || !razorpayKeyId) return;

    setIsProcessingPayment(true);

    const options = {
      key: razorpayKeyId,
      amount: (testInfo.price || 0) * 100,
      currency: "INR",
      name: "RojgarHub Test Series",
      description: testInfo.title,
      order_id: orderId,
      handler: async function (response: any) {
        try {
          const verifyResponse = await apiRequest("POST", `/api/test-series/${id}/payment/verify`, {
            paymentId,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
          });
          const result = await verifyResponse.json();
          if (result.success) {
            setHasPaid(true);
            setStage("instructions");
          }
        } catch (error) {
          alert("Payment verification failed. Please contact support.");
        }
        setIsProcessingPayment(false);
      },
      prefill: {
        name: candidateName,
        email: candidateEmail,
        contact: candidateMobile,
      },
      theme: {
        color: "#f97316",
      },
    };

    const razorpay = new (window as any).Razorpay(options);
    razorpay.on("payment.failed", function () {
      alert("Payment failed. Please try again.");
      setIsProcessingPayment(false);
    });
    razorpay.open();
  };

  useEffect(() => {
    if (stage !== "test" || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
      setTimeSpent((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [stage, timeRemaining]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSelectAnswer = useCallback((option: string) => {
    const questionId = questions[currentIndex].id;
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
    saveAnswerMutation.mutate({ questionId, answer: option });
  }, [currentIndex, questions]);

  const handleClearAnswer = useCallback(() => {
    const questionId = questions[currentIndex].id;
    setAnswers((prev) => {
      const newAnswers = { ...prev };
      delete newAnswers[questionId];
      return newAnswers;
    });
    saveAnswerMutation.mutate({ questionId, answer: null });
  }, [currentIndex, questions]);

  const handleToggleBookmark = useCallback(() => {
    const questionId = questions[currentIndex].id;
    const isBookmarked = bookmarks.has(questionId);
    setBookmarks((prev) => {
      const newSet = new Set(prev);
      if (isBookmarked) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
    saveAnswerMutation.mutate({ 
      questionId, 
      answer: answers[questionId] || null, 
      bookmarked: !isBookmarked 
    });
  }, [currentIndex, questions, bookmarks, answers]);

  const handleSubmitTest = () => {
    setIsSubmitting(true);
    submitTestMutation.mutate();
  };

  const getQuestionStatus = (questionId: number) => {
    const isAnswered = answers[questionId] !== undefined;
    const isBookmarked = bookmarks.has(questionId);
    if (isAnswered && isBookmarked) return "answered-bookmarked";
    if (isAnswered) return "answered";
    if (isBookmarked) return "bookmarked";
    return "unanswered";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "answered": return "bg-green-500 text-white";
      case "answered-bookmarked": return "bg-purple-500 text-white";
      case "bookmarked": return "bg-orange-500 text-white";
      default: return "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300";
    }
  };

  const answeredCount = Object.keys(answers).length;
  const unansweredCount = questions.length - answeredCount;
  const bookmarkedCount = bookmarks.size;

  if (stage === "info") {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-orange-50 to-white dark:from-gray-900 dark:to-gray-800">
        <JobAlertsHeader />
        <main className="flex-1 py-8">
          <div className="max-w-2xl mx-auto px-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/job-alerts/test-series")}
              className="mb-4"
              data-testid="btn-back-tests"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Test Series
            </Button>
            
            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-orange-600" />
                </div>
                <CardTitle className="text-2xl">Start Your Test</CardTitle>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Enter your details to begin the mock test
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Test info banner */}
                {test && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
                    <h3 className="font-semibold text-lg">{test.title}</h3>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Timer className="w-4 h-4" /> {test.duration} mins
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-4 h-4" /> {test.totalQuestions} Questions
                      </span>
                      {!test.isFree && (
                        <span className="flex items-center gap-1 text-green-600 font-semibold">
                          <IndianRupee className="w-4 h-4" /> {test.price}
                        </span>
                      )}
                      {test.isFree && (
                        <Badge className="bg-green-500">FREE</Badge>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="name">Your Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    data-testid="input-candidate-name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email {!test?.isFree && "*"}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={candidateEmail}
                    onChange={(e) => setCandidateEmail(e.target.value)}
                    data-testid="input-candidate-email"
                  />
                </div>
                {!test?.isFree && (
                  <div>
                    <Label htmlFor="mobile">Mobile Number *</Label>
                    <Input
                      id="mobile"
                      type="tel"
                      placeholder="Enter your mobile number"
                      value={candidateMobile}
                      onChange={(e) => setCandidateMobile(e.target.value)}
                      data-testid="input-candidate-mobile"
                    />
                  </div>
                )}
                
                <Button
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  size="lg"
                  onClick={() => {
                    if (test?.isFree) {
                      setStage("instructions");
                    } else {
                      createPaymentMutation.mutate();
                    }
                  }}
                  disabled={
                    !candidateName.trim() || 
                    createPaymentMutation.isPending ||
                    (!test?.isFree && (!candidateEmail.trim() || !candidateMobile.trim()))
                  }
                  data-testid="btn-continue-instructions"
                >
                  {createPaymentMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                  ) : test?.isFree ? (
                    <>Continue <ChevronRight className="w-4 h-4 ml-2" /></>
                  ) : (
                    <>Proceed to Payment <CreditCard className="w-4 h-4 ml-2" /></>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <JobAlertsFooter />
      </div>
    );
  }

  if (stage === "payment") {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-orange-50 to-white dark:from-gray-900 dark:to-gray-800">
        <JobAlertsHeader />
        <main className="flex-1 py-8">
          <div className="max-w-lg mx-auto px-4">
            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl">Complete Payment</CardTitle>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Pay to access this premium test
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Test Summary */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">{test?.title}</h3>
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span>{test?.duration} minutes</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Questions:</span>
                      <span>{test?.totalQuestions}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between text-lg font-bold text-green-600">
                      <span>Amount:</span>
                      <span>₹{test?.price}</span>
                    </div>
                  </div>
                </div>

                {/* Candidate Info */}
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p><strong>Name:</strong> {candidateName}</p>
                  <p><strong>Email:</strong> {candidateEmail}</p>
                  <p><strong>Mobile:</strong> {candidateMobile}</p>
                </div>

                {paymentMode === "RAZORPAY" ? (
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    size="lg"
                    onClick={handleRazorpayPayment}
                    disabled={isProcessingPayment}
                    data-testid="btn-pay-razorpay"
                  >
                    {isProcessingPayment ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                    ) : (
                      <>Pay ₹{test?.price} with Razorpay</>
                    )}
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg text-sm text-yellow-700 dark:text-yellow-400">
                      <strong>Demo Mode:</strong> Razorpay is not configured. Click below to simulate payment.
                    </div>
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      size="lg"
                      onClick={() => simulatePaymentMutation.mutate()}
                      disabled={simulatePaymentMutation.isPending}
                      data-testid="btn-simulate-payment"
                    >
                      {simulatePaymentMutation.isPending ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                      ) : (
                        <>Simulate Payment (Demo)</>
                      )}
                    </Button>
                  </div>
                )}

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setStage("info")}
                  data-testid="btn-back-to-info"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <JobAlertsFooter />
      </div>
    );
  }

  if (stage === "instructions") {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-orange-50 to-white dark:from-gray-900 dark:to-gray-800">
        <JobAlertsHeader />
        <main className="flex-1 py-8">
          <div className="max-w-3xl mx-auto px-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-orange-500" />
                  Test Instructions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg space-y-2">
                  <h3 className="font-semibold text-orange-800 dark:text-orange-300">Important Guidelines:</h3>
                  <ul className="text-sm text-orange-700 dark:text-orange-400 space-y-1 list-disc pl-5">
                    <li>The test will start immediately after you click "Start Test"</li>
                    <li>Timer will begin counting down as soon as the test starts</li>
                    <li>You can navigate between questions using the navigation panel</li>
                    <li>Use the bookmark feature to mark questions for review</li>
                    <li>Negative marking applies for incorrect answers</li>
                    <li>Test will auto-submit when time expires</li>
                    <li>Do not refresh the page during the test</li>
                    <li>Once submitted, you cannot modify your answers</li>
                  </ul>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-center gap-1 text-green-500">
                      <div className="w-4 h-4 rounded-full bg-green-500"></div>
                    </div>
                    <p className="text-xs mt-1">Answered</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-center gap-1 text-gray-400">
                      <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                    </div>
                    <p className="text-xs mt-1">Not Answered</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-center gap-1 text-orange-500">
                      <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                    </div>
                    <p className="text-xs mt-1">Marked for Review</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-center gap-1 text-purple-500">
                      <div className="w-4 h-4 rounded-full bg-purple-500"></div>
                    </div>
                    <p className="text-xs mt-1">Answered & Marked</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setStage("info")}
                    data-testid="btn-back-info"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    size="lg"
                    onClick={() => startTestMutation.mutate()}
                    disabled={startTestMutation.isPending}
                    data-testid="btn-start-test"
                  >
                    {startTestMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4 mr-2" />
                    )}
                    Start Test
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        <JobAlertsFooter />
      </div>
    );
  }

  if (stage === "test" && testData && questions.length > 0) {
    const currentQuestion = questions[currentIndex];
    const isLowTime = timeRemaining <= 300;

    return (
      <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
        <header className="bg-white dark:bg-gray-800 border-b sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="font-bold text-lg truncate max-w-[200px] md:max-w-none">{testData.title}</h1>
              <Badge variant="outline">{candidateName}</Badge>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-bold ${isLowTime ? "bg-red-100 text-red-600 animate-pulse" : "bg-orange-100 text-orange-600"}`}>
              <Clock className="w-5 h-5" />
              {formatTime(timeRemaining)}
            </div>
          </div>
        </header>

        <div className="flex-1 flex">
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <Card className="mb-4">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Badge>{currentQuestion.section || "General"}</Badge>
                    <span className="text-sm text-gray-500">
                      Question {currentIndex + 1} of {questions.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">{currentQuestion.marks || 2} marks</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleToggleBookmark}
                      data-testid="btn-bookmark"
                    >
                      {bookmarks.has(currentQuestion.id) ? (
                        <Bookmark className="w-5 h-5 text-orange-500 fill-orange-500" />
                      ) : (
                        <BookmarkPlus className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Paragraph/Passage Section */}
                {currentQuestion.paragraph && (
                  <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-2 text-blue-700 dark:text-blue-300 font-semibold text-sm">
                      <FileText className="w-4 h-4" />
                      Passage
                    </div>
                    <div className="prose dark:prose-invert max-w-none text-sm">
                      <p dangerouslySetInnerHTML={{ __html: currentQuestion.paragraph }} />
                    </div>
                    {currentQuestion.paragraphImage && (
                      <img src={currentQuestion.paragraphImage} alt="Passage" className="mt-3 max-w-full rounded-lg" />
                    )}
                  </div>
                )}

                <div className="prose dark:prose-invert max-w-none mb-6">
                  <p className="text-lg font-medium" dangerouslySetInnerHTML={{ __html: currentQuestion.questionText }} />
                </div>

                {currentQuestion.questionImage && (
                  <div className="mb-6">
                    <img src={currentQuestion.questionImage} alt="Question" className="max-w-full rounded-lg" />
                  </div>
                )}

                <div className="space-y-3">
                  {["A", "B", "C", "D"].map((option) => {
                    const optionKey = `option${option}` as keyof Question;
                    const optionImageKey = `option${option}Image` as keyof Question;
                    const optionText = currentQuestion[optionKey];
                    const optionImage = currentQuestion[optionImageKey] as string | undefined;
                    if (!optionText) return null;
                    
                    const isSelected = answers[currentQuestion.id] === option;
                    
                    return (
                      <button
                        key={option}
                        onClick={() => handleSelectAnswer(option)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                          isSelected
                            ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                            : "border-gray-200 dark:border-gray-700 hover:border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/10"
                        }`}
                        data-testid={`option-${option.toLowerCase()}`}
                      >
                        <div className="flex items-start gap-3">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                            isSelected
                              ? "bg-green-500 text-white"
                              : "bg-gray-200 dark:bg-gray-700"
                          }`}>
                            {option}
                          </span>
                          <div className="flex-1">
                            <span dangerouslySetInnerHTML={{ __html: optionText as string }} />
                            {optionImage && (
                              <img src={optionImage} alt={`Option ${option}`} className="mt-2 max-w-xs rounded-lg" />
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={handleClearAnswer}
                    disabled={!answers[currentQuestion.id]}
                    data-testid="btn-clear-answer"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" /> Clear
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                      disabled={currentIndex === 0}
                      data-testid="btn-prev-question"
                    >
                      <ChevronLeft className="w-4 h-4" /> Previous
                    </Button>
                    <Button
                      onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                      disabled={currentIndex === questions.length - 1}
                      data-testid="btn-next-question"
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </main>

          <aside className="w-64 bg-white dark:bg-gray-800 border-l p-4 hidden lg:block overflow-auto">
            <h3 className="font-semibold mb-3">Question Palette</h3>
            
            <div className="grid grid-cols-5 gap-2 mb-4">
              {questions.map((q, index) => {
                const status = getQuestionStatus(q.id);
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${getStatusColor(status)} ${
                      index === currentIndex ? "ring-2 ring-offset-2 ring-blue-500" : ""
                    }`}
                    data-testid={`question-nav-${index + 1}`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>

            <Separator className="my-4" />

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-500"></div>
                  Answered
                </span>
                <span className="font-bold">{answeredCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-gray-300 dark:bg-gray-600"></div>
                  Unanswered
                </span>
                <span className="font-bold">{unansweredCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-orange-500"></div>
                  Marked
                </span>
                <span className="font-bold">{bookmarkedCount}</span>
              </div>
            </div>

            <Button
              className="w-full mt-6 bg-red-600 hover:bg-red-700"
              onClick={() => setShowSubmitDialog(true)}
              data-testid="btn-submit-test"
            >
              <Send className="w-4 h-4 mr-2" /> Submit Test
            </Button>
          </aside>
        </div>

        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t p-3 flex items-center justify-between">
          <div className="flex gap-2 text-xs">
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500"></div>
              {answeredCount}
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-gray-300"></div>
              {unansweredCount}
            </span>
          </div>
          <Button
            size="sm"
            className="bg-red-600 hover:bg-red-700"
            onClick={() => setShowSubmitDialog(true)}
          >
            <Send className="w-4 h-4 mr-1" /> Submit
          </Button>
        </div>

        <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit Test?</DialogTitle>
              <DialogDescription>
                Are you sure you want to submit your test?
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-2">
              <div className="flex justify-between">
                <span>Total Questions:</span>
                <span className="font-bold">{questions.length}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Answered:</span>
                <span className="font-bold">{answeredCount}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Unanswered:</span>
                <span className="font-bold">{unansweredCount}</span>
              </div>
              <div className="flex justify-between text-orange-500">
                <span>Marked for Review:</span>
                <span className="font-bold">{bookmarkedCount}</span>
              </div>
            </div>
            {unansweredCount > 0 && (
              <div className="text-amber-600 text-sm bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                <AlertTriangle className="w-4 h-4 inline mr-1" />
                You have {unansweredCount} unanswered questions.
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
                Cancel
              </Button>
              <Button 
                className="bg-green-600 hover:bg-green-700"
                onClick={() => {
                  setShowSubmitDialog(false);
                  handleSubmitTest();
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Confirm Submit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  if (stage === "result" && result) {
    const isPassed = parseFloat(result.percentage) >= 40;

    if (showReview) {
      const currentQ = resultQuestions[reviewIndex];
      return (
        <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
          <header className="bg-white dark:bg-gray-800 border-b sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
              <Button variant="ghost" onClick={() => setShowReview(false)}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Results
              </Button>
              <span className="font-semibold">
                Review: {reviewIndex + 1} / {resultQuestions.length}
              </span>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  {currentQ.isCorrect ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : currentQ.userAnswer ? (
                    <XCircle className="w-6 h-6 text-red-500" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-gray-400" />
                  )}
                  <Badge variant={currentQ.isCorrect ? "default" : "destructive"}>
                    {currentQ.isCorrect ? "Correct" : currentQ.userAnswer ? "Incorrect" : "Unanswered"}
                  </Badge>
                </div>

                {/* Paragraph in Results */}
                {currentQ.paragraph && (
                  <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-2 text-blue-700 dark:text-blue-300 font-semibold text-sm">
                      <FileText className="w-4 h-4" />
                      Passage
                    </div>
                    <div className="prose dark:prose-invert max-w-none text-sm">
                      <p dangerouslySetInnerHTML={{ __html: currentQ.paragraph }} />
                    </div>
                    {currentQ.paragraphImage && (
                      <img src={currentQ.paragraphImage} alt="Passage" className="mt-3 max-w-full rounded-lg" />
                    )}
                  </div>
                )}

                <div className="prose dark:prose-invert max-w-none mb-6">
                  <p className="text-lg font-medium" dangerouslySetInnerHTML={{ __html: currentQ.questionText }} />
                </div>

                {currentQ.questionImage && (
                  <div className="mb-6">
                    <img src={currentQ.questionImage} alt="Question" className="max-w-full rounded-lg" />
                  </div>
                )}

                <div className="space-y-3 mb-6">
                  {["A", "B", "C", "D"].map((option) => {
                    const optionKey = `option${option}` as keyof Question;
                    const optionImageKey = `option${option}Image` as keyof Question;
                    const optionText = currentQ[optionKey];
                    const optionImage = currentQ[optionImageKey] as string | undefined;
                    if (!optionText) return null;
                    
                    const isCorrect = currentQ.correctAnswer === option;
                    const isUserAnswer = currentQ.userAnswer === option;
                    
                    let bgClass = "border-gray-200 dark:border-gray-700";
                    if (isCorrect) bgClass = "border-green-500 bg-green-50 dark:bg-green-900/20";
                    else if (isUserAnswer) bgClass = "border-red-500 bg-red-50 dark:bg-red-900/20";
                    
                    return (
                      <div key={option} className={`p-4 rounded-lg border-2 ${bgClass}`}>
                        <div className="flex items-start gap-3">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                            isCorrect ? "bg-green-500 text-white" : isUserAnswer ? "bg-red-500 text-white" : "bg-gray-200 dark:bg-gray-700"
                          }`}>
                            {option}
                          </span>
                          <div className="flex-1">
                            <span dangerouslySetInnerHTML={{ __html: optionText as string }} />
                            {optionImage && (
                              <img src={optionImage} alt={`Option ${option}`} className="mt-2 max-w-xs rounded-lg" />
                            )}
                          </div>
                          {isCorrect && <CheckCircle className="w-5 h-5 text-green-500 ml-auto shrink-0" />}
                          {isUserAnswer && !isCorrect && <XCircle className="w-5 h-5 text-red-500 ml-auto shrink-0" />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {currentQ.explanation && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Explanation:</h4>
                    <p className="text-blue-700 dark:text-blue-400" dangerouslySetInnerHTML={{ __html: currentQ.explanation }} />
                  </div>
                )}

                <div className="flex justify-between mt-6 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setReviewIndex((prev) => Math.max(0, prev - 1))}
                    disabled={reviewIndex === 0}
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </Button>
                  <Button
                    onClick={() => setReviewIndex((prev) => Math.min(resultQuestions.length - 1, prev + 1))}
                    disabled={reviewIndex === resultQuestions.length - 1}
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-orange-50 to-white dark:from-gray-900 dark:to-gray-800">
        <JobAlertsHeader />
        <main className="flex-1 py-8">
          <div className="max-w-3xl mx-auto px-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <Card className="mb-6">
                <CardContent className="p-8 text-center">
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    isPassed ? "bg-green-100 dark:bg-green-900" : "bg-red-100 dark:bg-red-900"
                  }`}>
                    <Award className={`w-12 h-12 ${isPassed ? "text-green-600" : "text-red-600"}`} />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">
                    {isPassed ? "Congratulations!" : "Keep Practicing!"}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    {candidateName}, you scored
                  </p>
                  <div className="text-5xl font-bold mt-4 mb-2">
                    {result.marksObtained} / {result.totalMarks}
                  </div>
                  <Badge className={isPassed ? "bg-green-500" : "bg-red-500"} >
                    {result.percentage}%
                  </Badge>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{result.correct}</div>
                    <div className="text-sm text-gray-500">Correct</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">{result.incorrect}</div>
                    <div className="text-sm text-gray-500">Incorrect</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-gray-500">{result.unanswered}</div>
                    <div className="text-sm text-gray-500">Unanswered</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{formatTime(result.timeSpent || 0)}</div>
                    <div className="text-sm text-gray-500">Time Taken</div>
                  </CardContent>
                </Card>
              </div>

              {result.sectionResults && result.sectionResults.length > 0 && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Section-wise Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {result.sectionResults.map((section, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="font-medium">{section.section}</span>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-green-600">{section.correct} correct</span>
                            <span className="text-red-600">{section.incorrect} wrong</span>
                            <span className="font-bold">{section.marks.toFixed(1)} marks</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowReview(true)}
                  data-testid="btn-review-answers"
                >
                  <Eye className="w-4 h-4 mr-2" /> Review Answers
                </Button>
                <Button
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                  onClick={() => navigate("/job-alerts/test-series")}
                  data-testid="btn-more-tests"
                >
                  More Tests <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          </div>
        </main>
        <JobAlertsFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
    </div>
  );
}
