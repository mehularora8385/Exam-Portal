import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield, UserPlus, Home, AlertCircle, CheckCircle, Phone, Mail } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import bgImage from "@assets/bg_1769739419861.jpg";

export default function Register() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const { register, isRegistering } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // OTP verification states
  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  const [mobileOtp, setMobileOtp] = useState("");
  const [mobileVerified, setMobileVerified] = useState(false);
  const [sendingMobileOtp, setSendingMobileOtp] = useState(false);
  const [verifyingMobileOtp, setVerifyingMobileOtp] = useState(false);
  
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [sendingEmailOtp, setSendingEmailOtp] = useState(false);
  const [verifyingEmailOtp, setVerifyingEmailOtp] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Reset verification if mobile/email changes
    if (name === "mobile") {
      setMobileOtpSent(false);
      setMobileVerified(false);
      setMobileOtp("");
    }
    if (name === "email") {
      setEmailOtpSent(false);
      setEmailVerified(false);
      setEmailOtp("");
    }
  };

  const sendMobileOtp = async () => {
    if (!formData.mobile || formData.mobile.length !== 10) {
      toast({ title: "Error", description: "Please enter a valid 10-digit mobile number", variant: "destructive" });
      return;
    }

    setSendingMobileOtp(true);
    try {
      const response = await apiRequest("POST", "/api/auth/otp/send", {
        target: formData.mobile,
        purpose: "REGISTRATION",
        isEmail: false
      });
      const data = await response.json();
      setMobileOtpSent(true);
      
      // Show OTP in toast for demo/testing mode
      if (data.demoMode && data.demoOtp) {
        toast({ 
          title: "Demo Mode - OTP", 
          description: `Your OTP is: ${data.demoOtp} (This is shown only in demo mode)`,
          duration: 30000
        });
      } else {
        toast({ title: "OTP Sent", description: "OTP has been sent to your mobile number" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to send OTP", variant: "destructive" });
    } finally {
      setSendingMobileOtp(false);
    }
  };

  const verifyMobileOtp = async () => {
    if (!mobileOtp || mobileOtp.length !== 6) {
      toast({ title: "Error", description: "Please enter a valid 6-digit OTP", variant: "destructive" });
      return;
    }

    setVerifyingMobileOtp(true);
    try {
      await apiRequest("POST", "/api/auth/otp/verify", {
        target: formData.mobile,
        otp: mobileOtp,
        purpose: "REGISTRATION",
        isEmail: false
      });
      setMobileVerified(true);
      toast({ title: "Verified", description: "Mobile number verified successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Invalid OTP", variant: "destructive" });
    } finally {
      setVerifyingMobileOtp(false);
    }
  };

  const sendEmailOtp = async () => {
    if (!formData.email || !formData.email.includes("@")) {
      toast({ title: "Error", description: "Please enter a valid email address", variant: "destructive" });
      return;
    }

    setSendingEmailOtp(true);
    try {
      const response = await apiRequest("POST", "/api/auth/otp/send", {
        target: formData.email,
        purpose: "REGISTRATION",
        isEmail: true
      });
      const data = await response.json();
      setEmailOtpSent(true);
      
      // Show OTP in toast for demo/testing mode
      if (data.demoMode && data.demoOtp) {
        toast({ 
          title: "Demo Mode - Email OTP", 
          description: `Your OTP is: ${data.demoOtp} (This is shown only in demo mode)`,
          duration: 30000
        });
      } else {
        toast({ title: "OTP Sent", description: "OTP has been sent to your email" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to send OTP", variant: "destructive" });
    } finally {
      setSendingEmailOtp(false);
    }
  };

  const verifyEmailOtp = async () => {
    if (!emailOtp || emailOtp.length !== 6) {
      toast({ title: "Error", description: "Please enter a valid 6-digit OTP", variant: "destructive" });
      return;
    }

    setVerifyingEmailOtp(true);
    try {
      await apiRequest("POST", "/api/auth/otp/verify", {
        target: formData.email,
        otp: emailOtp,
        purpose: "REGISTRATION",
        isEmail: true
      });
      setEmailVerified(true);
      toast({ title: "Verified", description: "Email verified successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Invalid OTP", variant: "destructive" });
    } finally {
      setVerifyingEmailOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!acceptTerms) {
      toast({ title: "Error", description: "Please accept the terms and conditions", variant: "destructive" });
      return;
    }

    if (!mobileVerified) {
      toast({ title: "Error", description: "Please verify your mobile number with OTP", variant: "destructive" });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }

    if (formData.password.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    try {
      await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
      });
      toast({ title: "Registration Successful", description: "Your account has been created. Please complete your profile." });
      setLocation("/profile/create");
    } catch (error: any) {
      toast({ 
        title: "Registration Failed", 
        description: error.message || "Could not create account", 
        variant: "destructive" 
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Header Bar */}
      <div className="bg-primary text-white py-2 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span>Government of India</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-1 hover:underline">
              <Home className="w-4 h-4" /> Home
            </Link>
            <Link href="/login" className="hover:underline">
              Login
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
            <p className="text-sm text-muted-foreground">Government of India - New Candidate Registration</p>
          </div>
        </div>
      </header>

      {/* Registration Section with Background */}
      <main className="flex-1 relative">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/80 to-blue-900/85" />
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 py-10">
          <Card className="shadow-2xl border-0">
            <CardHeader className="bg-gradient-to-r from-primary to-blue-700 text-white rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">New Candidate Registration</h3>
                  <p className="text-sm text-white/80">Create your account to apply for examinations</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 bg-white">
              {/* Important Notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <strong>Important:</strong> Please fill in your details carefully. 
                  The information provided during registration will be used for all future communications.
                  Make sure to use a valid email address and mobile number. <strong>OTP verification is required.</strong>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Details */}
                <div className="border-b pb-4">
                  <h4 className="font-semibold text-primary mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs">1</span>
                    Personal Details
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name <span className="text-destructive">*</span></Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        placeholder="Enter your first name"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                        className="h-11 border-slate-300"
                        data-testid="input-first-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name <span className="text-destructive">*</span></Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        placeholder="Enter your last name"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                        className="h-11 border-slate-300"
                        data-testid="input-last-name"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Details with OTP Verification */}
                <div className="border-b pb-4">
                  <h4 className="font-semibold text-primary mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs">2</span>
                    Contact Details & OTP Verification
                  </h4>
                  
                  {/* Mobile Number with OTP */}
                  <div className="space-y-3 mb-6">
                    <Label htmlFor="mobile">
                      Mobile Number <span className="text-destructive">*</span>
                      {mobileVerified && (
                        <span className="ml-2 text-green-600 text-xs font-normal inline-flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Verified
                        </span>
                      )}
                    </Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="mobile"
                          name="mobile"
                          type="tel"
                          placeholder="10-digit mobile number"
                          value={formData.mobile}
                          onChange={handleChange}
                          pattern="[0-9]{10}"
                          maxLength={10}
                          className="h-11 border-slate-300 pl-10"
                          data-testid="input-mobile"
                          disabled={mobileVerified}
                        />
                      </div>
                      {!mobileVerified && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={sendMobileOtp}
                          disabled={sendingMobileOtp || formData.mobile.length !== 10}
                          className="h-11 whitespace-nowrap"
                          data-testid="button-send-mobile-otp"
                        >
                          {sendingMobileOtp ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : mobileOtpSent ? (
                            "Resend OTP"
                          ) : (
                            "Send OTP"
                          )}
                        </Button>
                      )}
                    </div>
                    
                    {mobileOtpSent && !mobileVerified && (
                      <div className="flex gap-2 mt-2">
                        <Input
                          type="text"
                          placeholder="Enter 6-digit OTP"
                          value={mobileOtp}
                          onChange={(e) => setMobileOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          maxLength={6}
                          className="h-10 border-slate-300 w-40"
                          data-testid="input-mobile-otp"
                        />
                        <Button
                          type="button"
                          onClick={verifyMobileOtp}
                          disabled={verifyingMobileOtp || mobileOtp.length !== 6}
                          className="h-10"
                          data-testid="button-verify-mobile-otp"
                        >
                          {verifyingMobileOtp ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Verify"
                          )}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Email with OTP */}
                  <div className="space-y-3">
                    <Label htmlFor="email">
                      Email Address <span className="text-destructive">*</span>
                      {emailVerified && (
                        <span className="ml-2 text-green-600 text-xs font-normal inline-flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Verified
                        </span>
                      )}
                    </Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="example@email.com"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="h-11 border-slate-300 pl-10"
                          data-testid="input-email"
                          disabled={emailVerified}
                        />
                      </div>
                      {!emailVerified && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={sendEmailOtp}
                          disabled={sendingEmailOtp || !formData.email.includes("@")}
                          className="h-11 whitespace-nowrap"
                          data-testid="button-send-email-otp"
                        >
                          {sendingEmailOtp ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : emailOtpSent ? (
                            "Resend OTP"
                          ) : (
                            "Send OTP"
                          )}
                        </Button>
                      )}
                    </div>
                    
                    {emailOtpSent && !emailVerified && (
                      <div className="flex gap-2 mt-2">
                        <Input
                          type="text"
                          placeholder="Enter 6-digit OTP"
                          value={emailOtp}
                          onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          maxLength={6}
                          className="h-10 border-slate-300 w-40"
                          data-testid="input-email-otp"
                        />
                        <Button
                          type="button"
                          onClick={verifyEmailOtp}
                          disabled={verifyingEmailOtp || emailOtp.length !== 6}
                          className="h-10"
                          data-testid="button-verify-email-otp"
                        >
                          {verifyingEmailOtp ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Verify"
                          )}
                        </Button>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">This will be your login ID. Email OTP verification is optional.</p>
                  </div>
                </div>

                {/* Password Section */}
                <div className="border-b pb-4">
                  <h4 className="font-semibold text-primary mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs">3</span>
                    Create Password
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Password <span className="text-destructive">*</span></Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Minimum 6 characters"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        minLength={6}
                        className="h-11 border-slate-300"
                        data-testid="input-password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password <span className="text-destructive">*</span></Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        placeholder="Re-enter your password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        className="h-11 border-slate-300"
                        data-testid="input-confirm-password"
                      />
                    </div>
                  </div>
                  <div className="mt-3 bg-slate-50 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground font-medium mb-2">Password Requirements:</p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span>At least 6 characters</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span>Mix of letters and numbers</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="space-y-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <div className="flex items-start gap-3">
                    <Checkbox 
                      id="terms" 
                      checked={acceptTerms}
                      onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                      data-testid="checkbox-terms"
                      className="mt-1"
                    />
                    <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                      I hereby declare that all the information provided by me is true and correct to the best of my knowledge. 
                      I agree to the <a href="#" className="text-primary font-semibold hover:underline">Terms & Conditions</a> and 
                      <a href="#" className="text-primary font-semibold hover:underline"> Privacy Policy</a> of the portal.
                    </Label>
                  </div>
                </div>

                {/* Verification Status */}
                {!mobileVerified && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-sm text-red-700">
                    <AlertCircle className="w-4 h-4" />
                    Mobile number verification is required to complete registration
                  </div>
                )}

                {/* Submit Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button 
                    type="submit" 
                    className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-primary to-blue-700 hover:from-primary/90 hover:to-blue-700/90" 
                    disabled={isRegistering || !acceptTerms || !mobileVerified}
                    data-testid="button-register"
                  >
                    {isRegistering ? (
                      <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Creating Account...</>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-5 w-5" />
                        Create Account
                      </>
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1 h-12 border-slate-300"
                    onClick={() => {
                      setFormData({ firstName: "", lastName: "", email: "", mobile: "", password: "", confirmPassword: "" });
                      setMobileOtpSent(false);
                      setMobileVerified(false);
                      setMobileOtp("");
                      setEmailOtpSent(false);
                      setEmailVerified(false);
                      setEmailOtp("");
                    }}
                  >
                    Reset Form
                  </Button>
                </div>

                <div className="text-center pt-4 border-t">
                  <p className="text-muted-foreground">
                    Already have an account?{" "}
                    <Link href="/login" className="text-primary font-semibold hover:underline">
                      Sign In
                    </Link>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-primary text-white py-4 relative z-10">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm">
          <p>Examination Portal - Government of India</p>
          <p className="text-white/70 mt-1">All rights reserved. For official use only.</p>
        </div>
      </footer>
    </div>
  );
}
