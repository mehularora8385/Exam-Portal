import { useState, useEffect } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, Shield, Monitor, Lock, Eye, EyeOff, Download, Copy, Plus, 
  Trash2, RefreshCw, Loader2, Settings, Server, Key, MapPin, Clock,
  Wifi, WifiOff, Camera, CameraOff, Mic, MicOff, Keyboard, AlertTriangle
} from "lucide-react";

interface SEBConfig {
  id?: number;
  examId: number;
  sebEnabled: boolean;
  sebConfigKey: string;
  sebVersion: string;
  allowedBrowsers: {
    seb?: boolean;
    chrome?: boolean;
    custom?: boolean;
    customBrowserName?: string;
    customBrowserAgent?: string;
  };
  lockdownSettings: {
    disableRightClick?: boolean;
    disableCopyPaste?: boolean;
    disablePrintScreen?: boolean;
    disableTaskSwitching?: boolean;
    disableWebcam?: boolean;
    enableWebcamProctoring?: boolean;
    disableMicrophone?: boolean;
    disableNetwork?: boolean;
    allowedUrls?: string[];
    blockedUrls?: string[];
    browserUserAgent?: string;
    fullScreenMode?: boolean;
    quitPassword?: string;
    adminPassword?: string;
  };
  sessionSettings: {
    maxAttempts?: number;
    sessionTimeout?: number;
    autoSubmitOnTimeout?: boolean;
    allowResume?: boolean;
    ipRestriction?: boolean;
    allowedIpRanges?: string[];
    requireCenterToken?: boolean;
    singleDeviceLogin?: boolean;
  };
  examWindow: {
    width?: number;
    height?: number;
    resizable?: boolean;
    toolbarVisible?: boolean;
    statusBarVisible?: boolean;
    allowZoom?: boolean;
  };
  isActive: boolean;
}

interface ExamCenterLink {
  id: number;
  examId: number;
  centerCode: string;
  centerName: string;
  centerAddress?: string;
  centerCity?: string;
  centerState?: string;
  accessToken: string;
  tokenExpiresAt?: string;
  labDetails?: {
    labNumber?: string;
    totalSeats?: number;
    ipRange?: string;
    labIncharge?: string;
    labInchargeContact?: string;
  };
  shiftDetails?: {
    shiftNumber?: number;
    shiftName?: string;
    reportingTime?: string;
    examStartTime?: string;
    examEndTime?: string;
    gateClosingTime?: string;
  };
  status: string;
  usageCount: number;
  maxUsage?: number;
}

export default function ManageSEBConfig() {
  const [match, params] = useRoute("/admin/exams/:examId/seb-config");
  const examId = Number(params?.examId);
  
  const { isAuthenticated, isAdmin, isLoading: authLoading } = useAuth();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [showPassword, setShowPassword] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [newCenterDialog, setNewCenterDialog] = useState(false);
  
  // SEB Config State
  const [config, setConfig] = useState<SEBConfig>({
    examId,
    sebEnabled: false,
    sebConfigKey: "",
    sebVersion: "3.0",
    allowedBrowsers: { seb: true },
    lockdownSettings: {
      disableRightClick: true,
      disableCopyPaste: true,
      disablePrintScreen: true,
      disableTaskSwitching: true,
      fullScreenMode: true,
    },
    sessionSettings: {
      maxAttempts: 1,
      sessionTimeout: 180,
      autoSubmitOnTimeout: true,
      singleDeviceLogin: true,
      requireCenterToken: true,
    },
    examWindow: {
      width: 1920,
      height: 1080,
      resizable: false,
      toolbarVisible: false,
      statusBarVisible: false,
      allowZoom: false,
    },
    isActive: true,
  });
  
  // New Center Form State
  const [newCenter, setNewCenter] = useState({
    centerCode: "",
    centerName: "",
    centerAddress: "",
    centerCity: "",
    centerState: "",
    labNumber: "",
    totalSeats: 30,
    ipRange: "",
    labIncharge: "",
    labInchargeContact: "",
    shiftNumber: 1,
    shiftName: "Morning",
    reportingTime: "08:00",
    examStartTime: "09:00",
    examEndTime: "12:00",
    gateClosingTime: "08:30",
  });

  const { data: exam, isLoading: examLoading } = useQuery<any>({
    queryKey: ["/api/exams", examId],
    enabled: !!examId
  });

  const { data: sebConfig, isLoading: configLoading } = useQuery<SEBConfig>({
    queryKey: ["/api/admin/seb-config", examId],
    enabled: !!examId
  });

  const { data: centerLinks, isLoading: linksLoading, refetch: refetchLinks } = useQuery<ExamCenterLink[]>({
    queryKey: ["/api/admin/exam-center-links", examId],
    enabled: !!examId
  });

  // Load existing config
  useEffect(() => {
    if (sebConfig) {
      setConfig({
        ...config,
        ...sebConfig,
        examId,
      });
    }
  }, [sebConfig, examId]);

  const saveSEBConfigMutation = useMutation({
    mutationFn: async (data: SEBConfig) => {
      const res = await apiRequest("POST", `/api/admin/seb-config/${examId}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "SEB configuration saved successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/seb-config", examId] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });

  const createCenterLinkMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/admin/exam-center-links`, {
        examId,
        ...data,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Center link created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/exam-center-links", examId] });
      setNewCenterDialog(false);
      resetNewCenterForm();
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });

  const deleteCenterLinkMutation = useMutation({
    mutationFn: async (linkId: number) => {
      const res = await apiRequest("DELETE", `/api/admin/exam-center-links/${linkId}`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Center link deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/exam-center-links", examId] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });

  const regenerateTokenMutation = useMutation({
    mutationFn: async (linkId: number) => {
      const res = await apiRequest("POST", `/api/admin/exam-center-links/${linkId}/regenerate-token`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Access token regenerated" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/exam-center-links", examId] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });

  const resetNewCenterForm = () => {
    setNewCenter({
      centerCode: "",
      centerName: "",
      centerAddress: "",
      centerCity: "",
      centerState: "",
      labNumber: "",
      totalSeats: 30,
      ipRange: "",
      labIncharge: "",
      labInchargeContact: "",
      shiftNumber: 1,
      shiftName: "Morning",
      reportingTime: "08:00",
      examStartTime: "09:00",
      examEndTime: "12:00",
      gateClosingTime: "08:30",
    });
  };

  const handleCreateCenter = () => {
    createCenterLinkMutation.mutate({
      centerCode: newCenter.centerCode,
      centerName: newCenter.centerName,
      centerAddress: newCenter.centerAddress,
      centerCity: newCenter.centerCity,
      centerState: newCenter.centerState,
      labDetails: {
        labNumber: newCenter.labNumber,
        totalSeats: newCenter.totalSeats,
        ipRange: newCenter.ipRange,
        labIncharge: newCenter.labIncharge,
        labInchargeContact: newCenter.labInchargeContact,
      },
      shiftDetails: {
        shiftNumber: newCenter.shiftNumber,
        shiftName: newCenter.shiftName,
        reportingTime: newCenter.reportingTime,
        examStartTime: newCenter.examStartTime,
        examEndTime: newCenter.examEndTime,
        gateClosingTime: newCenter.gateClosingTime,
      },
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Token copied to clipboard" });
  };

  const generateSEBConfigKey = () => {
    const key = `SEB-${exam?.code || 'EXAM'}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    setConfig({ ...config, sebConfigKey: key });
  };

  const downloadSEBConfig = () => {
    const sebFileContent = {
      originatorVersion: config.sebVersion,
      sebConfigPurpose: 0,
      allowQuit: false,
      quitURL: "",
      quitURLConfirm: true,
      hashedQuitPassword: config.lockdownSettings.quitPassword || "",
      exitKey1: 0,
      exitKey2: 0,
      exitKey3: 0,
      browserViewMode: 0,
      mainBrowserWindowWidth: config.examWindow?.width?.toString() || "100%",
      mainBrowserWindowHeight: config.examWindow?.height?.toString() || "100%",
      mainBrowserWindowPositioning: 1,
      enableBrowserWindowToolbar: config.examWindow?.toolbarVisible || false,
      hideBrowserWindowToolbar: !config.examWindow?.toolbarVisible,
      showMenuBar: false,
      showTaskBar: false,
      taskBarHeight: 0,
      enableZoomPage: config.examWindow?.allowZoom || false,
      zoomMode: 0,
      enableNavigationButtons: false,
      enableReloadButton: false,
      enableSingleAppMode: true,
      enablePrivateClipboard: !config.lockdownSettings.disableCopyPaste,
      enableRightMouse: !config.lockdownSettings.disableRightClick,
      enablePrintScreen: !config.lockdownSettings.disablePrintScreen,
      enableScreenCapture: !config.lockdownSettings.disablePrintScreen,
      startURL: `${window.location.origin}/exam-portal/launch?configKey=${config.sebConfigKey}`,
      startURLAppendQueryParameter: true,
      allowPreferencesWindow: false,
      allowVirtualMachine: false,
      allowUserAppFolderInstall: false,
      allowFlashFullscreen: false,
      allowPDFReaderToolbar: false,
      enableJavaScript: true,
      blockPopUpWindows: true,
      allowVideoCapture: config.lockdownSettings.enableWebcamProctoring || false,
      allowAudioCapture: !config.lockdownSettings.disableMicrophone,
      examSessionClearCookiesOnStart: true,
      examSessionClearCookiesOnEnd: true,
      useSystemProxies: false,
      sebServerURL: "",
      sebServerFallback: false,
      sebServerConfiguration: {
        institution: exam?.title || "Government Examination Portal",
        exam: exam?.code || "EXAM",
        configKey: config.sebConfigKey,
      },
    };
    
    const blob = new Blob([JSON.stringify(sebFileContent, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SEB-Config-${exam?.code || 'EXAM'}-${Date.now()}.seb`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded", description: "SEB configuration file downloaded" });
  };

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) {
      setLocation("/login");
    }
  }, [isAuthenticated, isAdmin, authLoading, setLocation]);

  if (authLoading || examLoading || configLoading) {
    return (
      <div className="min-h-screen bg-slate-100 p-8">
        <div className="max-w-7xl mx-auto space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="text-primary-foreground hover:bg-primary-foreground/10">
            <Link href="/admin/exams" data-testid="btn-back"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Shield className="w-6 h-6" />
              SEB Configuration
            </h1>
            <p className="text-sm opacity-80">{exam?.title} ({exam?.code})</p>
          </div>
          <Badge variant={config.sebEnabled ? "default" : "secondary"} className="text-sm">
            {config.sebEnabled ? "SEB Enabled" : "SEB Disabled"}
          </Badge>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="settings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="settings" data-testid="tab-settings">
              <Settings className="w-4 h-4 mr-2" /> SEB Settings
            </TabsTrigger>
            <TabsTrigger value="centers" data-testid="tab-centers">
              <MapPin className="w-4 h-4 mr-2" /> Exam Centers
            </TabsTrigger>
            <TabsTrigger value="sessions" data-testid="tab-sessions">
              <Monitor className="w-4 h-4 mr-2" /> Active Sessions
            </TabsTrigger>
          </TabsList>

          {/* SEB Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            {/* Master Enable/Disable */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  Safe Exam Browser (SEB)
                </CardTitle>
                <CardDescription>
                  Configure secure browser lockdown for exam center computers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <Label className="text-base font-semibold">Enable SEB for this Exam</Label>
                    <p className="text-sm text-gray-500">Candidates must use Safe Exam Browser to take the exam</p>
                  </div>
                  <Switch
                    checked={config.sebEnabled}
                    onCheckedChange={(checked) => setConfig({ ...config, sebEnabled: checked })}
                    data-testid="switch-seb-enabled"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>SEB Version</Label>
                    <Select value={config.sebVersion} onValueChange={(v) => setConfig({ ...config, sebVersion: v })}>
                      <SelectTrigger data-testid="select-seb-version">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3.0">SEB 3.0 (Recommended)</SelectItem>
                        <SelectItem value="3.1">SEB 3.1</SelectItem>
                        <SelectItem value="3.2">SEB 3.2</SelectItem>
                        <SelectItem value="3.3">SEB 3.3 (Latest)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Configuration Key</Label>
                    <div className="flex gap-2">
                      <Input
                        value={config.sebConfigKey}
                        onChange={(e) => setConfig({ ...config, sebConfigKey: e.target.value })}
                        placeholder="Generate or enter config key"
                        data-testid="input-config-key"
                      />
                      <Button variant="outline" onClick={generateSEBConfigKey} data-testid="btn-generate-key">
                        <Key className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Browser Lockdown Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-red-600" />
                  Lockdown Settings
                </CardTitle>
                <CardDescription>
                  Security restrictions for the exam environment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Keyboard className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Disable Right Click</span>
                    </div>
                    <Switch
                      checked={config.lockdownSettings.disableRightClick}
                      onCheckedChange={(c) => setConfig({
                        ...config,
                        lockdownSettings: { ...config.lockdownSettings, disableRightClick: c }
                      })}
                      data-testid="switch-right-click"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Copy className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Disable Copy/Paste</span>
                    </div>
                    <Switch
                      checked={config.lockdownSettings.disableCopyPaste}
                      onCheckedChange={(c) => setConfig({
                        ...config,
                        lockdownSettings: { ...config.lockdownSettings, disableCopyPaste: c }
                      })}
                      data-testid="switch-copy-paste"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Monitor className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Disable Print Screen</span>
                    </div>
                    <Switch
                      checked={config.lockdownSettings.disablePrintScreen}
                      onCheckedChange={(c) => setConfig({
                        ...config,
                        lockdownSettings: { ...config.lockdownSettings, disablePrintScreen: c }
                      })}
                      data-testid="switch-print-screen"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Disable Task Switching</span>
                    </div>
                    <Switch
                      checked={config.lockdownSettings.disableTaskSwitching}
                      onCheckedChange={(c) => setConfig({
                        ...config,
                        lockdownSettings: { ...config.lockdownSettings, disableTaskSwitching: c }
                      })}
                      data-testid="switch-task-switching"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Monitor className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Full Screen Mode</span>
                    </div>
                    <Switch
                      checked={config.lockdownSettings.fullScreenMode}
                      onCheckedChange={(c) => setConfig({
                        ...config,
                        lockdownSettings: { ...config.lockdownSettings, fullScreenMode: c }
                      })}
                      data-testid="switch-fullscreen"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Webcam Proctoring</span>
                    </div>
                    <Switch
                      checked={config.lockdownSettings.enableWebcamProctoring}
                      onCheckedChange={(c) => setConfig({
                        ...config,
                        lockdownSettings: { ...config.lockdownSettings, enableWebcamProctoring: c }
                      })}
                      data-testid="switch-webcam"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Mic className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Disable Microphone</span>
                    </div>
                    <Switch
                      checked={config.lockdownSettings.disableMicrophone}
                      onCheckedChange={(c) => setConfig({
                        ...config,
                        lockdownSettings: { ...config.lockdownSettings, disableMicrophone: c }
                      })}
                      data-testid="switch-microphone"
                    />
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Quit Password (for invigilators)</Label>
                    <div className="flex gap-2">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={config.lockdownSettings.quitPassword || ""}
                        onChange={(e) => setConfig({
                          ...config,
                          lockdownSettings: { ...config.lockdownSettings, quitPassword: e.target.value }
                        })}
                        placeholder="Password to exit SEB"
                        data-testid="input-quit-password"
                      />
                      <Button variant="outline" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label>Admin Password</Label>
                    <div className="flex gap-2">
                      <Input
                        type={showAdminPassword ? "text" : "password"}
                        value={config.lockdownSettings.adminPassword || ""}
                        onChange={(e) => setConfig({
                          ...config,
                          lockdownSettings: { ...config.lockdownSettings, adminPassword: e.target.value }
                        })}
                        placeholder="Admin password for settings"
                        data-testid="input-admin-password"
                      />
                      <Button variant="outline" onClick={() => setShowAdminPassword(!showAdminPassword)}>
                        {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Session Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-green-600" />
                  Session Settings
                </CardTitle>
                <CardDescription>
                  Configure exam session rules and restrictions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label>Max Attempts</Label>
                    <Input
                      type="number"
                      min="1"
                      value={config.sessionSettings.maxAttempts || 1}
                      onChange={(e) => setConfig({
                        ...config,
                        sessionSettings: { ...config.sessionSettings, maxAttempts: parseInt(e.target.value) }
                      })}
                      data-testid="input-max-attempts"
                    />
                  </div>
                  <div>
                    <Label>Session Timeout (minutes)</Label>
                    <Input
                      type="number"
                      min="30"
                      value={config.sessionSettings.sessionTimeout || 180}
                      onChange={(e) => setConfig({
                        ...config,
                        sessionSettings: { ...config.sessionSettings, sessionTimeout: parseInt(e.target.value) }
                      })}
                      data-testid="input-session-timeout"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">Auto Submit on Timeout</span>
                    <Switch
                      checked={config.sessionSettings.autoSubmitOnTimeout}
                      onCheckedChange={(c) => setConfig({
                        ...config,
                        sessionSettings: { ...config.sessionSettings, autoSubmitOnTimeout: c }
                      })}
                      data-testid="switch-auto-submit"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">Allow Resume (if disconnected)</span>
                    <Switch
                      checked={config.sessionSettings.allowResume}
                      onCheckedChange={(c) => setConfig({
                        ...config,
                        sessionSettings: { ...config.sessionSettings, allowResume: c }
                      })}
                      data-testid="switch-allow-resume"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">Single Device Login</span>
                    <Switch
                      checked={config.sessionSettings.singleDeviceLogin}
                      onCheckedChange={(c) => setConfig({
                        ...config,
                        sessionSettings: { ...config.sessionSettings, singleDeviceLogin: c }
                      })}
                      data-testid="switch-single-device"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">Require Center Token</span>
                    <Switch
                      checked={config.sessionSettings.requireCenterToken}
                      onCheckedChange={(c) => setConfig({
                        ...config,
                        sessionSettings: { ...config.sessionSettings, requireCenterToken: c }
                      })}
                      data-testid="switch-center-token"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">IP Restriction</span>
                    <Switch
                      checked={config.sessionSettings.ipRestriction}
                      onCheckedChange={(c) => setConfig({
                        ...config,
                        sessionSettings: { ...config.sessionSettings, ipRestriction: c }
                      })}
                      data-testid="switch-ip-restriction"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-between items-center">
              <Button variant="outline" onClick={downloadSEBConfig} disabled={!config.sebConfigKey} data-testid="btn-download-config">
                <Download className="w-4 h-4 mr-2" /> Download SEB Config File
              </Button>
              <Button 
                onClick={() => saveSEBConfigMutation.mutate(config)} 
                disabled={saveSEBConfigMutation.isPending}
                data-testid="btn-save-config"
              >
                {saveSEBConfigMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                ) : (
                  <>Save Configuration</>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Exam Centers Tab */}
          <TabsContent value="centers" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    Exam Center Links
                  </CardTitle>
                  <CardDescription>
                    Generate unique access tokens for each exam center
                  </CardDescription>
                </div>
                <Dialog open={newCenterDialog} onOpenChange={setNewCenterDialog}>
                  <DialogTrigger asChild>
                    <Button data-testid="btn-add-center">
                      <Plus className="w-4 h-4 mr-2" /> Add Center
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add Exam Center</DialogTitle>
                      <DialogDescription>
                        Create a new exam center link with unique access token
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Center Code *</Label>
                          <Input
                            value={newCenter.centerCode}
                            onChange={(e) => setNewCenter({ ...newCenter, centerCode: e.target.value.toUpperCase() })}
                            placeholder="e.g., DEL001"
                            data-testid="input-center-code"
                          />
                        </div>
                        <div>
                          <Label>Center Name *</Label>
                          <Input
                            value={newCenter.centerName}
                            onChange={(e) => setNewCenter({ ...newCenter, centerName: e.target.value })}
                            placeholder="e.g., Delhi Public School"
                            data-testid="input-center-name"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Address</Label>
                        <Input
                          value={newCenter.centerAddress}
                          onChange={(e) => setNewCenter({ ...newCenter, centerAddress: e.target.value })}
                          placeholder="Full address"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>City</Label>
                          <Input
                            value={newCenter.centerCity}
                            onChange={(e) => setNewCenter({ ...newCenter, centerCity: e.target.value })}
                            placeholder="City"
                          />
                        </div>
                        <div>
                          <Label>State</Label>
                          <Input
                            value={newCenter.centerState}
                            onChange={(e) => setNewCenter({ ...newCenter, centerState: e.target.value })}
                            placeholder="State"
                          />
                        </div>
                      </div>

                      <Separator />

                      <h4 className="font-semibold">Lab Details</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Lab Number</Label>
                          <Input
                            value={newCenter.labNumber}
                            onChange={(e) => setNewCenter({ ...newCenter, labNumber: e.target.value })}
                            placeholder="e.g., LAB-01"
                          />
                        </div>
                        <div>
                          <Label>Total Seats</Label>
                          <Input
                            type="number"
                            value={newCenter.totalSeats}
                            onChange={(e) => setNewCenter({ ...newCenter, totalSeats: parseInt(e.target.value) })}
                          />
                        </div>
                        <div>
                          <Label>IP Range (optional)</Label>
                          <Input
                            value={newCenter.ipRange}
                            onChange={(e) => setNewCenter({ ...newCenter, ipRange: e.target.value })}
                            placeholder="e.g., 192.168.1.0/24"
                          />
                        </div>
                        <div>
                          <Label>Lab Incharge</Label>
                          <Input
                            value={newCenter.labIncharge}
                            onChange={(e) => setNewCenter({ ...newCenter, labIncharge: e.target.value })}
                            placeholder="Incharge name"
                          />
                        </div>
                      </div>

                      <Separator />

                      <h4 className="font-semibold">Shift Details</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Shift Number</Label>
                          <Select 
                            value={newCenter.shiftNumber.toString()} 
                            onValueChange={(v) => setNewCenter({ ...newCenter, shiftNumber: parseInt(v) })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">Shift 1 (Morning)</SelectItem>
                              <SelectItem value="2">Shift 2 (Afternoon)</SelectItem>
                              <SelectItem value="3">Shift 3 (Evening)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Shift Name</Label>
                          <Input
                            value={newCenter.shiftName}
                            onChange={(e) => setNewCenter({ ...newCenter, shiftName: e.target.value })}
                            placeholder="e.g., Morning"
                          />
                        </div>
                        <div>
                          <Label>Reporting Time</Label>
                          <Input
                            type="time"
                            value={newCenter.reportingTime}
                            onChange={(e) => setNewCenter({ ...newCenter, reportingTime: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Exam Start Time</Label>
                          <Input
                            type="time"
                            value={newCenter.examStartTime}
                            onChange={(e) => setNewCenter({ ...newCenter, examStartTime: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Exam End Time</Label>
                          <Input
                            type="time"
                            value={newCenter.examEndTime}
                            onChange={(e) => setNewCenter({ ...newCenter, examEndTime: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Gate Closing Time</Label>
                          <Input
                            type="time"
                            value={newCenter.gateClosingTime}
                            onChange={(e) => setNewCenter({ ...newCenter, gateClosingTime: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setNewCenterDialog(false)}>Cancel</Button>
                      <Button 
                        onClick={handleCreateCenter}
                        disabled={!newCenter.centerCode || !newCenter.centerName || createCenterLinkMutation.isPending}
                        data-testid="btn-confirm-create-center"
                      >
                        {createCenterLinkMutation.isPending ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</>
                        ) : (
                          <>Create Center Link</>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {linksLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}
                  </div>
                ) : centerLinks && centerLinks.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Center</TableHead>
                        <TableHead>Lab / Shift</TableHead>
                        <TableHead>Access Token</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Usage</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {centerLinks.map((link) => (
                        <TableRow key={link.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{link.centerCode}</div>
                              <div className="text-sm text-gray-500">{link.centerName}</div>
                              <div className="text-xs text-gray-400">{link.centerCity}, {link.centerState}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>Lab: {link.labDetails?.labNumber || "-"}</div>
                              <div>Shift {link.shiftDetails?.shiftNumber}: {link.shiftDetails?.shiftName}</div>
                              <div className="text-xs text-gray-400">
                                {link.shiftDetails?.examStartTime} - {link.shiftDetails?.examEndTime}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                                {link.accessToken.substring(0, 16)}...
                              </code>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => copyToClipboard(link.accessToken)}
                                data-testid={`btn-copy-token-${link.id}`}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={link.status === "ACTIVE" ? "default" : "secondary"}>
                              {link.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{link.usageCount} / {link.maxUsage || "∞"}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => regenerateTokenMutation.mutate(link.id)}
                                disabled={regenerateTokenMutation.isPending}
                                data-testid={`btn-regenerate-${link.id}`}
                              >
                                <RefreshCw className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => deleteCenterLinkMutation.mutate(link.id)}
                                disabled={deleteCenterLinkMutation.isPending}
                                data-testid={`btn-delete-${link.id}`}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No exam centers configured yet</p>
                    <p className="text-sm">Click "Add Center" to create center links</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Active Sessions Tab */}
          <TabsContent value="sessions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-green-600" />
                  Active Exam Sessions
                </CardTitle>
                <CardDescription>
                  Monitor live exam sessions across all centers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <Monitor className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No active exam sessions</p>
                  <p className="text-sm">Sessions will appear here when candidates start their exams</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
