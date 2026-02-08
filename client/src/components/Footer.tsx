import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, Facebook, Twitter, Linkedin, Mail, MapPin, Phone } from "lucide-react";

export function Footer() {
  const { data: settings } = useQuery<Record<string, any>>({
    queryKey: ["/api/settings"],
  });

  const portalName = settings?.portalName || "Examination Portal";
  const portalDescription = settings?.portalDescription || "The official portal for examinations, results, and recruitment notices.";
  const footerText = settings?.footerText || "© 2024 Examination Portal. All rights reserved.";
  const contactEmail = settings?.contactEmail || "helpdesk@portal.gov.in";
  const contactPhone = settings?.contactPhone || "+91-11-2436-1234";
  const contactAddress = settings?.contactAddress || "Block C, CGO Complex, Lodhi Road, New Delhi - 110003";

  return (
    <footer className="bg-[#0f172a] text-slate-300 py-8 md:py-12 border-t border-slate-800 mt-auto">
      <div className="container-custom grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-white">
            <ShieldCheck className="w-6 h-6" />
            <span className="font-display font-bold text-base md:text-lg">{portalName}</span>
          </div>
          <p className="text-sm leading-relaxed text-slate-400">
            {portalDescription}
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-white font-serif font-bold">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/" className="hover:text-white transition-colors inline-block min-h-[44px] md:min-h-0 flex items-center">Home</Link></li>
            <li><Link href="/exams" className="hover:text-white transition-colors inline-block min-h-[44px] md:min-h-0 flex items-center">Active Exams</Link></li>
            <li><Link href="/notices" className="hover:text-white transition-colors inline-block min-h-[44px] md:min-h-0 flex items-center">Notices & Circulars</Link></li>
            <li><Link href="/results" className="hover:text-white transition-colors inline-block min-h-[44px] md:min-h-0 flex items-center">Results</Link></li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-white font-serif font-bold">Contact Us</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <MapPin className="w-4 h-4 mt-1 text-primary-foreground/70 flex-shrink-0" />
              <span className="whitespace-pre-line">{contactAddress}</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-primary-foreground/70 flex-shrink-0" />
              <span>{contactPhone}</span>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-primary-foreground/70 flex-shrink-0" />
              <span className="break-all">{contactEmail}</span>
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-white font-serif font-bold">Follow Us</h3>
          <div className="flex gap-4">
            <a href="#" className="p-2 bg-slate-800 rounded-full hover:bg-primary transition-colors text-white min-h-[44px] min-w-[44px] flex items-center justify-center">
              <Facebook className="w-4 h-4" />
            </a>
            <a href="#" className="p-2 bg-slate-800 rounded-full hover:bg-primary transition-colors text-white min-h-[44px] min-w-[44px] flex items-center justify-center">
              <Twitter className="w-4 h-4" />
            </a>
            <a href="#" className="p-2 bg-slate-800 rounded-full hover:bg-primary transition-colors text-white min-h-[44px] min-w-[44px] flex items-center justify-center">
              <Linkedin className="w-4 h-4" />
            </a>
          </div>
          <div className="pt-4">
            <p className="text-xs text-slate-500">
              {footerText}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
