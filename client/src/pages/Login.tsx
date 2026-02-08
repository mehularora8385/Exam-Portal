import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Shield, Lock, Mail, HelpCircle, Home, Smartphone } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobileOrEmail, setMobileOrEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const { login, isLoggingIn } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = await login({ email, password });
      toast({ title: "Login Successful", description: `Welcome back, ${user.firstName}!` });
      if (user.role === "admin") {
        setLocation("/admin");
      } else {
        setLocation("/dashboard");
      }
    } catch (error: any) {
      toast({ 
        title: "Login Failed", 
        description: error.message || "Invalid credentials", 
        variant: "destructive" 
      });
    }
  };

  const isEmail = mobileOrEmail.includes("@");

  const handleSendOtp = async () => {
    if (!mobileOrEmail) {
      toast({ title: "Please enter email or mobile number", variant: "destructive" });
      return;
    }
    setSendingOtp(true);
    try {
      await apiRequest("POST", "/api/auth/otp/login", { target: mobileOrEmail, isEmail });
      setOtpSent(true);
      toast({ title: "OTP Sent", description: `Check your ${isEmail ? "email" : "mobile"} for the OTP` });
    } catch (error: any) {
      toast({ title: "Failed to send OTP", description: error.message, variant: "destructive" });
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      toast({ title: "Please enter a valid 6-digit OTP", variant: "destructive" });
      return;
    }
    setVerifyingOtp(true);
    try {
      const result = await apiRequest("POST", "/api/auth/otp/verify", { 
        target: mobileOrEmail, 
        otp, 
        purpose: "LOGIN",
        isEmail 
      });
      const data = await result.json();
      if (data.verified && data.user) {
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        toast({ title: "Login Successful", description: `Welcome back, ${data.user.firstName}!` });
        if (data.user.role === "admin") {
          setLocation("/admin");
        } else {
          setLocation("/dashboard");
        }
      }
    } catch (error: any) {
      toast({ title: "OTP Verification Failed", description: error.message, variant: "destructive" });
    } finally {
      setVerifyingOtp(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Top Header Bar */}
      <div className="bg-primary text-white py-2 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span>Examination Portal</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-1 hover:underline">
              <Home className="w-4 h-4" /> Home
            </Link>
            <Link href="/register" className="hover:underline">
              New Registration
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white shadow-sm border-b-4 border-secondary py-4">
        <div className="max-w-6xl mx-auto px-4 flex items-center gap-4">
          <div className="flex items-center justify-center w-16 h-16 bg-primary rounded-full">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary">Examination Portal</h1>
            <p className="text-sm text-muted-foreground">Official Examination Portal</p>
          </div>
        </div>
      </header>

      {/* Login Section */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Left - Information */}
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-primary mb-4">Candidate Login</h2>
              <p className="text-muted-foreground">
                Access your account to apply for examinations, download admit cards, 
                and view your application status.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 space-y-4">
              <h3 className="font-semibold text-primary flex items-center gap-2">
                <HelpCircle className="w-5 h-5" /> Important Instructions
              </h3>
              <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                <li>Use your registered email address to login</li>
                <li>Password is case-sensitive</li>
                <li>Do not share your login credentials with anyone</li>
                <li>For password reset, contact support</li>
                <li>Session will expire after 30 minutes of inactivity</li>
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                <strong>Notice:</strong> Applications are being accepted for various examinations. 
                Please check the latest notifications on the home page.
              </p>
            </div>
          </div>

          {/* Right - Login Form */}
          <Card className="shadow-xl border-t-4 border-t-primary">
            <CardHeader className="bg-primary text-white rounded-t-sm">
              <div className="flex items-center gap-3">
                <Lock className="w-6 h-6" />
                <div>
                  <h3 className="text-lg font-semibold">Secure Login</h3>
                  <p className="text-sm text-white/80">Choose your preferred login method</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <Tabs defaultValue="password" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="password" data-testid="tab-password-login">
                    <Lock className="w-4 h-4 mr-2" /> Password
                  </TabsTrigger>
                  <TabsTrigger value="otp" data-testid="tab-otp-login">
                    <Smartphone className="w-4 h-4 mr-2" /> OTP
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="password">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        Email Address / User ID
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your registered email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-11"
                        data-testid="input-email"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password" className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-muted-foreground" />
                        Password
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-11"
                        data-testid="input-password"
                      />
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="rounded border-gray-300" />
                        <span className="text-muted-foreground">Remember me</span>
                      </label>
                      <a href="#" className="text-primary hover:underline">Forgot Password?</a>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-11 text-base font-semibold" 
                      disabled={isLoggingIn}
                      data-testid="button-login"
                    >
                      {isLoggingIn ? (
                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Signing in...</>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="otp">
                  <div className="space-y-5">
                    {!otpSent ? (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="mobileOrEmail" className="flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-muted-foreground" />
                            Email or Mobile Number
                          </Label>
                          <Input
                            id="mobileOrEmail"
                            type="text"
                            placeholder="Enter registered email or mobile"
                            value={mobileOrEmail}
                            onChange={(e) => setMobileOrEmail(e.target.value)}
                            className="h-11"
                            data-testid="input-mobile-email"
                          />
                          <p className="text-xs text-muted-foreground">
                            OTP will be sent to your registered {isEmail ? "email" : "mobile number"}
                          </p>
                        </div>

                        <Button 
                          type="button"
                          onClick={handleSendOtp}
                          className="w-full h-11 text-base font-semibold" 
                          disabled={sendingOtp || !mobileOrEmail}
                          data-testid="button-send-otp"
                        >
                          {sendingOtp ? (
                            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Sending OTP...</>
                          ) : (
                            "Send OTP"
                          )}
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                          <p className="text-green-800 text-sm">
                            OTP sent to <strong>{mobileOrEmail}</strong>
                          </p>
                          <button 
                            type="button"
                            onClick={() => { setOtpSent(false); setOtp(""); }}
                            className="text-primary text-xs hover:underline mt-1"
                          >
                            Change number/email
                          </button>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="otp" className="flex items-center gap-2">
                            <Lock className="w-4 h-4 text-muted-foreground" />
                            Enter OTP
                          </Label>
                          <Input
                            id="otp"
                            type="text"
                            maxLength={6}
                            placeholder="Enter 6-digit OTP"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                            className="h-11 text-center text-lg tracking-widest"
                            data-testid="input-otp"
                          />
                        </div>

                        <Button 
                          type="button"
                          onClick={handleVerifyOtp}
                          className="w-full h-11 text-base font-semibold" 
                          disabled={verifyingOtp || otp.length !== 6}
                          data-testid="button-verify-otp"
                        >
                          {verifyingOtp ? (
                            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Verifying...</>
                          ) : (
                            "Verify & Login"
                          )}
                        </Button>

                        <div className="text-center">
                          <button 
                            type="button"
                            onClick={handleSendOtp}
                            disabled={sendingOtp}
                            className="text-primary text-sm hover:underline"
                          >
                            Resend OTP
                          </button>
                        </div>
                      </>
                    )}

                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-800">
                      <p>In demo mode, OTP is logged to the server console. Check the server logs to see the OTP.</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="text-center pt-4 border-t mt-4">
                <p className="text-muted-foreground">
                  Don't have an account?{" "}
                  <Link href="/register" className="text-primary font-semibold hover:underline">
                    Register Now
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-primary text-white py-4 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm">
          <p>Examination Portal - Government of India</p>
          <p className="text-white/70 mt-1">All rights reserved. For official use only.</p>
        </div>
      </footer>
    </div>
  );
}
