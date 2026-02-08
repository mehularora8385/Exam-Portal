import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Globe, MessageSquare, Phone, Link as LinkIcon, Image, Upload, DollarSign } from "lucide-react";

export default function SiteSettings() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery<Record<string, any>>({
    queryKey: ["/api/settings"],
  });

  const [formData, setFormData] = useState({
    portalName: "",
    portalTagline: "",
    portalDescription: "",
    logoUrl: "",
    heroBgUrl: "",
    heroTitle: "",
    heroSubtitle: "",
    marqueeText: "",
    contactEmail: "",
    contactPhone: "",
    contactAddress: "",
    footerText: "",
    adsEnabled: "false",
    adSensePublisherId: "",
    adSlotHeader: "",
    adSlotSidebar1: "",
    adSlotSidebar2: "",
    adSlotInfeed: "",
    adSlotFooter: "",
    adContactEmail: "",
    jobPortalDomain: "",
    jobPortalName: "RojgarHub",
    jobPortalTagline: "Jobs & Career Portal",
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        portalName: settings.portalName || "",
        portalTagline: settings.portalTagline || "",
        portalDescription: settings.portalDescription || "",
        logoUrl: settings.logoUrl || "",
        heroBgUrl: settings.heroBgUrl || "",
        heroTitle: settings.heroTitle || "",
        heroSubtitle: settings.heroSubtitle || "",
        marqueeText: settings.marqueeText || "",
        contactEmail: settings.contactEmail || "",
        contactPhone: settings.contactPhone || "",
        contactAddress: settings.contactAddress || "",
        footerText: settings.footerText || "",
        adsEnabled: settings.adsEnabled || "false",
        adSensePublisherId: settings.adSensePublisherId || "",
        adSlotHeader: settings.adSlotHeader || "",
        adSlotSidebar1: settings.adSlotSidebar1 || "",
        adSlotSidebar2: settings.adSlotSidebar2 || "",
        adSlotInfeed: settings.adSlotInfeed || "",
        adSlotFooter: settings.adSlotFooter || "",
        adContactEmail: settings.adContactEmail || "",
        jobPortalDomain: settings.jobPortalDomain || "",
        jobPortalName: settings.jobPortalName || "RojgarHub",
        jobPortalTagline: settings.jobPortalTagline || "Jobs & Career Portal",
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PUT", "/api/settings", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Settings saved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to save settings", variant: "destructive" });
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/admin")} data-testid="button-back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Site Settings</h1>
      </div>

      <div className="space-y-6">
        {/* Portal Identity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" /> Portal Identity
            </CardTitle>
            <CardDescription>Configure the portal name and branding</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="portalName">Portal Name</Label>
                <Input
                  id="portalName"
                  name="portalName"
                  placeholder="e.g., Examination Portal"
                  value={formData.portalName}
                  onChange={handleChange}
                  data-testid="input-portal-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="portalTagline">Tagline</Label>
                <Input
                  id="portalTagline"
                  name="portalTagline"
                  placeholder="e.g., Government of India"
                  value={formData.portalTagline}
                  onChange={handleChange}
                  data-testid="input-portal-tagline"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="portalDescription">Portal Description</Label>
              <Textarea
                id="portalDescription"
                name="portalDescription"
                placeholder="Brief description of the portal"
                rows={2}
                value={formData.portalDescription}
                onChange={handleChange}
                data-testid="input-portal-description"
              />
            </div>
          </CardContent>
        </Card>

        {/* Branding & Media */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="w-5 h-5" /> Branding & Media
            </CardTitle>
            <CardDescription>Configure portal logo and background images (use AWS S3 URLs or any public image URL)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input
                id="logoUrl"
                name="logoUrl"
                placeholder="https://your-s3-bucket.s3.amazonaws.com/logo.png"
                value={formData.logoUrl}
                onChange={handleChange}
                data-testid="input-logo-url"
              />
              {formData.logoUrl && (
                <div className="mt-2 p-2 border rounded bg-slate-50">
                  <img src={formData.logoUrl} alt="Logo preview" className="h-12 object-contain" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="heroBgUrl">Hero Background Image URL</Label>
              <Input
                id="heroBgUrl"
                name="heroBgUrl"
                placeholder="https://your-s3-bucket.s3.amazonaws.com/hero-bg.jpg"
                value={formData.heroBgUrl}
                onChange={handleChange}
                data-testid="input-hero-bg-url"
              />
              {formData.heroBgUrl && (
                <div className="mt-2 p-2 border rounded bg-slate-50">
                  <img src={formData.heroBgUrl} alt="Background preview" className="h-24 w-full object-cover rounded" />
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              For AWS S3 storage: Upload images to your S3 bucket and paste the public URL here. 
              Recommended sizes: Logo (200x50px), Background (1920x1080px).
            </p>
          </CardContent>
        </Card>

        {/* Homepage Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" /> Homepage Content
            </CardTitle>
            <CardDescription>Configure the main homepage hero section</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="heroTitle">Hero Title</Label>
              <Input
                id="heroTitle"
                name="heroTitle"
                placeholder="e.g., Welcome to Examination Portal"
                value={formData.heroTitle}
                onChange={handleChange}
                data-testid="input-hero-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="heroSubtitle">Hero Subtitle</Label>
              <Input
                id="heroSubtitle"
                name="heroSubtitle"
                placeholder="e.g., Apply for Government Examinations Online"
                value={formData.heroSubtitle}
                onChange={handleChange}
                data-testid="input-hero-subtitle"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="marqueeText">News Ticker / Marquee Text</Label>
              <Textarea
                id="marqueeText"
                name="marqueeText"
                placeholder="Scrolling announcement text..."
                rows={2}
                value={formData.marqueeText}
                onChange={handleChange}
                data-testid="input-marquee"
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" /> Contact Information
            </CardTitle>
            <CardDescription>Displayed in footer and contact sections</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  name="contactEmail"
                  type="email"
                  placeholder="support@portal.gov.in"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  data-testid="input-contact-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  name="contactPhone"
                  placeholder="1800-XXX-XXXX"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  data-testid="input-contact-phone"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactAddress">Contact Address</Label>
              <Textarea
                id="contactAddress"
                name="contactAddress"
                placeholder="Block C, CGO Complex, Lodhi Road, New Delhi - 110003"
                rows={2}
                value={formData.contactAddress}
                onChange={handleChange}
                data-testid="input-contact-address"
              />
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="w-5 h-5" /> Footer Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="footerText">Footer Text</Label>
              <Input
                id="footerText"
                name="footerText"
                placeholder="e.g., Government of India - All Rights Reserved"
                value={formData.footerText}
                onChange={handleChange}
                data-testid="input-footer-text"
              />
            </div>
          </CardContent>
        </Card>

        {/* Job Portal (RojgarHub) Domain Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" /> Job Portal Domain
            </CardTitle>
            <CardDescription>Configure a separate domain for your job alerts portal (RojgarHub)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="jobPortalDomain">Job Portal Domain</Label>
              <Input
                id="jobPortalDomain"
                name="jobPortalDomain"
                placeholder="e.g., rojgar-hub.com"
                value={formData.jobPortalDomain}
                onChange={handleChange}
                data-testid="input-job-portal-domain"
              />
              <p className="text-xs text-muted-foreground">
                When visitors come from this domain, they'll see the job alerts portal instead of the examination portal. Leave empty if not using a separate domain.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jobPortalName">Portal Name</Label>
                <Input
                  id="jobPortalName"
                  name="jobPortalName"
                  placeholder="e.g., Rojgar Hub"
                  value={formData.jobPortalName}
                  onChange={handleChange}
                  data-testid="input-job-portal-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jobPortalTagline">Portal Tagline</Label>
                <Input
                  id="jobPortalTagline"
                  name="jobPortalTagline"
                  placeholder="e.g., Jobs & Career Portal"
                  value={formData.jobPortalTagline}
                  onChange={handleChange}
                  data-testid="input-job-portal-tagline"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Advertising & Monetization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" /> Advertising & Monetization
            </CardTitle>
            <CardDescription>Configure Google AdSense to start earning from your site traffic</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border">
              <div>
                <Label className="text-base font-semibold">Enable Ads</Label>
                <p className="text-sm text-muted-foreground">Show Google AdSense ads on your site</p>
              </div>
              <Switch
                checked={formData.adsEnabled === "true"}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, adsEnabled: checked ? "true" : "false" })
                }
                data-testid="switch-ads-enabled"
              />
            </div>

            {formData.adsEnabled === "true" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="adSensePublisherId">AdSense Publisher ID</Label>
                  <Input
                    id="adSensePublisherId"
                    name="adSensePublisherId"
                    placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                    value={formData.adSensePublisherId}
                    onChange={handleChange}
                    data-testid="input-adsense-pub-id"
                  />
                  <p className="text-xs text-muted-foreground">
                    Find this in your Google AdSense account under Account &gt; Account Information
                  </p>
                </div>

                <div className="border-t pt-4">
                  <Label className="text-sm font-semibold mb-3 block">Ad Slot IDs</Label>
                  <p className="text-xs text-muted-foreground mb-4">
                    Create ad units in Google AdSense and paste the slot IDs here. Each slot ID is a number like "1234567890".
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="adSlotHeader">Header Banner (top of page)</Label>
                      <Input
                        id="adSlotHeader"
                        name="adSlotHeader"
                        placeholder="e.g., 1234567890"
                        value={formData.adSlotHeader}
                        onChange={handleChange}
                        data-testid="input-ad-slot-header"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="adSlotFooter">Footer Banner (bottom of page)</Label>
                      <Input
                        id="adSlotFooter"
                        name="adSlotFooter"
                        placeholder="e.g., 1234567891"
                        value={formData.adSlotFooter}
                        onChange={handleChange}
                        data-testid="input-ad-slot-footer"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="adSlotSidebar1">Sidebar Ad 1</Label>
                      <Input
                        id="adSlotSidebar1"
                        name="adSlotSidebar1"
                        placeholder="e.g., 1234567892"
                        value={formData.adSlotSidebar1}
                        onChange={handleChange}
                        data-testid="input-ad-slot-sidebar1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="adSlotSidebar2">Sidebar Ad 2</Label>
                      <Input
                        id="adSlotSidebar2"
                        name="adSlotSidebar2"
                        placeholder="e.g., 1234567893"
                        value={formData.adSlotSidebar2}
                        onChange={handleChange}
                        data-testid="input-ad-slot-sidebar2"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="adSlotInfeed">In-Feed Ad (between job listings)</Label>
                      <Input
                        id="adSlotInfeed"
                        name="adSlotInfeed"
                        placeholder="e.g., 1234567894"
                        value={formData.adSlotInfeed}
                        onChange={handleChange}
                        data-testid="input-ad-slot-infeed"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="adContactEmail">Advertising Contact Email</Label>
                      <Input
                        id="adContactEmail"
                        name="adContactEmail"
                        type="email"
                        placeholder="advertise@yoursite.com"
                        value={formData.adContactEmail}
                        onChange={handleChange}
                        data-testid="input-ad-contact-email"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} data-testid="button-save">
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}
