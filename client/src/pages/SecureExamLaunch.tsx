import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Monitor,
  Lock,
  Camera,
  Maximize2,
  RefreshCw,
  PlayCircle
} from "lucide-react";

interface BrowserCheck {
  name: string;
  status: 'checking' | 'passed' | 'failed' | 'warning';
  message: string;
  icon: React.ReactNode;
}

export default function SecureExamLaunch() {
  const { token } = useParams<{ token: string }>();
  const [, setLocation] = useLocation();
  const [candidateId, setCandidateId] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [browserChecks, setBrowserChecks] = useState<BrowserCheck[]>([]);
  const [allChecksPassed, setAllChecksPassed] = useState(false);
  const [examStarted, setExamStarted] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const { data: centerLink, isLoading: linkLoading, error: linkError } = useQuery<any>({
    queryKey: [`/api/secure-exam/validate-token/${token}`],
    enabled: !!token,
    retry: false
  });

  const startSessionMutation = useMutation({
    mutationFn: async (data: { accessToken: string; candidateId: string; rollNumber: string }) => {
      const res = await apiRequest("POST", "/api/secure-exam/start-session", data);
      return res.json();
    },
    onSuccess: (data) => {
      setSessionId(data.sessionId);
      setExamStarted(true);
    }
  });

  // Heartbeat mechanism to keep session alive
  useEffect(() => {
    if (!examStarted || !sessionId) return;

    const sendHeartbeat = async () => {
      try {
        await apiRequest("POST", "/api/secure-exam/heartbeat", { sessionId });
      } catch (error) {
        console.error("Heartbeat failed:", error);
      }
    };

    // Send initial heartbeat
    sendHeartbeat();

    // Send heartbeat every 30 seconds
    const heartbeatInterval = setInterval(sendHeartbeat, 30000);

    // Handle page unload/visibility change
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Warn the user before leaving
      e.preventDefault();
      e.returnValue = 'Your exam session will be ended if you leave this page.';
      return e.returnValue;
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Send beacon to end session on page hide
        navigator.sendBeacon('/api/secure-exam/end-session', JSON.stringify({ sessionId }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(heartbeatInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Attempt to end session on cleanup
      navigator.sendBeacon('/api/secure-exam/end-session', JSON.stringify({ sessionId }));
    };
  }, [examStarted, sessionId]);

  const detectSEB = useCallback((): boolean => {
    const userAgent = navigator.userAgent.toLowerCase();
    return userAgent.includes('seb') || userAgent.includes('safe exam browser');
  }, []);

  const checkFullScreen = useCallback((): boolean => {
    return !!(document.fullscreenElement || 
              (document as any).webkitFullscreenElement || 
              (document as any).msFullscreenElement);
  }, []);

  const requestFullScreen = useCallback(async () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if ((elem as any).webkitRequestFullscreen) {
        await (elem as any).webkitRequestFullscreen();
      } else if ((elem as any).msRequestFullscreen) {
        await (elem as any).msRequestFullscreen();
      }
      return true;
    } catch (e) {
      return false;
    }
  }, []);

  const runBrowserChecks = useCallback(async () => {
    const checks: BrowserCheck[] = [];

    const isSEB = detectSEB();
    checks.push({
      name: "Safe Exam Browser",
      status: isSEB ? 'passed' : 'warning',
      message: isSEB ? "SEB detected" : "Using standard browser (SEB recommended)",
      icon: <Monitor className="w-5 h-5" />
    });

    checks.push({
      name: "JavaScript Enabled",
      status: 'passed',
      message: "JavaScript is enabled",
      icon: <CheckCircle className="w-5 h-5" />
    });

    const cookiesEnabled = navigator.cookieEnabled;
    checks.push({
      name: "Cookies Enabled",
      status: cookiesEnabled ? 'passed' : 'failed',
      message: cookiesEnabled ? "Cookies are enabled" : "Enable cookies to continue",
      icon: <Lock className="w-5 h-5" />
    });

    checks.push({
      name: "Screen Resolution",
      status: window.screen.width >= 1024 ? 'passed' : 'warning',
      message: `${window.screen.width}x${window.screen.height}`,
      icon: <Maximize2 className="w-5 h-5" />
    });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      checks.push({
        name: "Camera Access",
        status: 'passed',
        message: "Camera available for proctoring",
        icon: <Camera className="w-5 h-5" />
      });
    } catch (e) {
      checks.push({
        name: "Camera Access",
        status: centerLink?.sebConfig?.lockdownSettings?.enableWebcamProctoring ? 'failed' : 'warning',
        message: "Camera access required for proctoring",
        icon: <Camera className="w-5 h-5" />
      });
    }

    const isFullscreen = checkFullScreen();
    checks.push({
      name: "Fullscreen Mode",
      status: isFullscreen ? 'passed' : 'warning',
      message: isFullscreen ? "Running in fullscreen" : "Click to enable fullscreen",
      icon: <Maximize2 className="w-5 h-5" />
    });

    setBrowserChecks(checks);

    const criticalFailed = checks.some(c => c.status === 'failed');
    setAllChecksPassed(!criticalFailed);

    return !criticalFailed;
  }, [centerLink, detectSEB, checkFullScreen]);

  useEffect(() => {
    if (centerLink && !linkError) {
      runBrowserChecks();
    }
  }, [centerLink, linkError, runBrowserChecks]);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'p' || e.key === 'u')) {
        e.preventDefault();
      }
      if (e.key === 'PrintScreen' || e.key === 'F12') {
        e.preventDefault();
      }
      if (e.altKey && e.key === 'Tab') {
        e.preventDefault();
      }
    };

    if (examStarted && centerLink?.sebConfig?.lockdownSettings) {
      const settings = centerLink.sebConfig.lockdownSettings;
      if (settings.disableRightClick) {
        document.addEventListener('contextmenu', handleContextMenu);
      }
      if (settings.disableCopyPaste) {
        document.addEventListener('keydown', handleKeyDown);
      }
    }

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [examStarted, centerLink]);

  const handleStartExam = async () => {
    if (!candidateId.trim() || !rollNumber.trim()) {
      return;
    }

    const checksPass = await runBrowserChecks();
    if (!checksPass) {
      return;
    }

    if (centerLink?.sebConfig?.lockdownSettings?.fullScreenMode) {
      await requestFullScreen();
    }

    startSessionMutation.mutate({
      accessToken: token || "",
      candidateId: candidateId.trim(),
      rollNumber: rollNumber.trim()
    });
  };

  if (linkLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-primary" />
          <span className="text-lg">Validating access token...</span>
        </div>
      </div>
    );
  }

  if (linkError || !centerLink) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <XCircle className="w-6 h-6" />
              Invalid Access Link
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Access Denied</AlertTitle>
              <AlertDescription>
                This exam access link is invalid, expired, or has reached maximum usage.
                Contact your exam center administrator.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (examStarted && sessionId) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4 bg-card border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-semibold">{centerLink.exam?.title || "Secure Exam"}</span>
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
            <Lock className="w-3 h-3 mr-1" />
            Secure Session Active
          </Badge>
        </div>

        <div className="flex items-center justify-center min-h-[calc(100vh-100px)]">
          <Card className="max-w-lg w-full m-4">
            <CardHeader className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <CardTitle>Exam Session Started</CardTitle>
              <CardDescription>
                Your secure exam session has been initialized.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Session ID:</span>
                  <span className="font-mono">{sessionId.slice(0, 8)}...</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Center:</span>
                  <span>{centerLink.centerName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Roll Number:</span>
                  <span className="font-mono">{rollNumber}</span>
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  The exam interface will be loaded by your exam center administrator.
                  Do not close this window or refresh the page.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader className="text-center pb-4 border-b">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Shield className="w-10 h-10 text-primary" />
              <div>
                <CardTitle className="text-2xl">Secure Exam Portal</CardTitle>
                <CardDescription>Powered by Safe Exam Browser</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Monitor className="w-5 h-5" />
                  Exam Details
                </h3>
                <div className="bg-muted rounded-lg p-4 space-y-3">
                  <div>
                    <span className="text-sm text-muted-foreground">Exam:</span>
                    <p className="font-medium">{centerLink.exam?.title || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Center:</span>
                    <p className="font-medium">{centerLink.centerName}</p>
                    <p className="text-sm text-muted-foreground">{centerLink.centerAddress}</p>
                  </div>
                  {centerLink.shiftDetails && (
                    <div>
                      <span className="text-sm text-muted-foreground">Shift:</span>
                      <p className="font-medium">{centerLink.shiftDetails.shiftName || `Shift ${centerLink.shiftDetails.shiftNumber}`}</p>
                      <p className="text-sm text-muted-foreground">
                        {centerLink.shiftDetails.examStartTime} - {centerLink.shiftDetails.examEndTime}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  System Checks
                </h3>
                <div className="space-y-2">
                  {browserChecks.map((check, index) => (
                    <div 
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        check.status === 'passed' ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800' :
                        check.status === 'warning' ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-800' :
                        check.status === 'failed' ? 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800' :
                        'bg-muted border-muted-foreground/20'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={
                          check.status === 'passed' ? 'text-green-600 dark:text-green-400' :
                          check.status === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
                          check.status === 'failed' ? 'text-red-600 dark:text-red-400' :
                          'text-muted-foreground'
                        }>
                          {check.icon}
                        </span>
                        <div>
                          <p className="font-medium text-sm">{check.name}</p>
                          <p className="text-xs text-muted-foreground">{check.message}</p>
                        </div>
                      </div>
                      <Badge 
                        variant="outline"
                        className={
                          check.status === 'passed' ? 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/50 dark:text-green-300' :
                          check.status === 'warning' ? 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/50 dark:text-yellow-300' :
                          check.status === 'failed' ? 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/50 dark:text-red-300' :
                          ''
                        }
                      >
                        {check.status === 'passed' ? 'OK' : 
                         check.status === 'warning' ? 'WARN' : 
                         check.status === 'failed' ? 'FAIL' : 'CHECK'}
                      </Badge>
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-2"
                    onClick={runBrowserChecks}
                    data-testid="button-rerun-checks"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Re-run Checks
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Candidate Verification
            </CardTitle>
            <CardDescription>
              Enter your credentials to start the exam
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="candidateId">Candidate ID / Registration Number</Label>
                <Input
                  id="candidateId"
                  placeholder="Enter your registration number"
                  value={candidateId}
                  onChange={(e) => setCandidateId(e.target.value)}
                  data-testid="input-candidate-id"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rollNumber">Roll Number</Label>
                <Input
                  id="rollNumber"
                  placeholder="Enter your roll number"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  data-testid="input-roll-number"
                />
              </div>
            </div>

            <div className="mt-6">
              <Button 
                className="w-full" 
                size="lg"
                onClick={handleStartExam}
                disabled={!allChecksPassed || !candidateId.trim() || !rollNumber.trim() || startSessionMutation.isPending}
                data-testid="button-start-exam"
              >
                {startSessionMutation.isPending ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Starting Exam...
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-5 h-5 mr-2" />
                    Start Secure Exam
                  </>
                )}
              </Button>
              
              {!allChecksPassed && (
                <Alert variant="destructive" className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>System Check Failed</AlertTitle>
                  <AlertDescription>
                    Please resolve the failed system checks before starting the exam.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>Having issues? Contact your exam center administrator</p>
          <p className="mt-1">Center Code: {centerLink.centerCode}</p>
        </div>
      </div>
    </div>
  );
}
