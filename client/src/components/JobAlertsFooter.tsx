import { Link } from "wouter";
import { Briefcase } from "lucide-react";
import { SiFacebook, SiX, SiTelegram, SiYoutube } from "react-icons/si";
import { usePortal } from "@/hooks/use-portal";
import { useQuery } from "@tanstack/react-query";

export function JobAlertsFooter() {
  const { jobBasePath } = usePortal();
  const base = jobBasePath;

  const { data: settings } = useQuery<Record<string, any>>({
    queryKey: ["/api/settings"],
  });

  const portalName = settings?.jobPortalName || "Rojgar Hub";
  const portalTagline = settings?.jobPortalTagline || "Jobs & Career Portal";

  return (
    <footer className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-orange-600 p-2 rounded-lg">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-white text-lg" data-testid="text-footer-portal-name">{portalName}</span>
                <p className="text-xs text-gray-400">{portalTagline}</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Your trusted source for latest government job notifications, results, admit cards, and answer keys.
            </p>
            <div className="flex gap-3">
              <a href="https://facebook.com/rojgarhub" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-500 transition-colors" data-testid="link-social-facebook">
                <SiFacebook className="w-4 h-4" />
              </a>
              <a href="https://x.com/rojgarhub" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors" data-testid="link-social-x">
                <SiX className="w-4 h-4" />
              </a>
              <a href="https://t.me/rojgarhub" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-400 transition-colors" data-testid="link-social-telegram">
                <SiTelegram className="w-4 h-4" />
              </a>
              <a href="https://youtube.com/@rojgarhub" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-500 transition-colors" data-testid="link-social-youtube">
                <SiYoutube className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href={base} className="hover:text-orange-400 transition-colors">All Updates</Link></li>
              <li><Link href={`${base}?category=LATEST_JOB`} className="hover:text-orange-400 transition-colors">Latest Jobs</Link></li>
              <li><Link href={`${base}?category=RESULT`} className="hover:text-orange-400 transition-colors">Results</Link></li>
              <li><Link href={`${base}?category=ADMIT_CARD`} className="hover:text-orange-400 transition-colors">Admit Cards</Link></li>
              <li><Link href={`${base}?category=ANSWER_KEY`} className="hover:text-orange-400 transition-colors">Answer Keys</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-white mb-4">Categories</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href={`${base}?category=SYLLABUS`} className="hover:text-orange-400 transition-colors">Syllabus</Link></li>
              <li><Link href={`${base}?category=ADMISSION`} className="hover:text-orange-400 transition-colors">Admissions</Link></li>
              <li><Link href={`${base}?category=IMPORTANT`} className="hover:text-orange-400 transition-colors">Important Updates</Link></li>
              <li>
                <a href="https://examinationportal.com" target="_blank" rel="noopener noreferrer" className="hover:text-orange-400 transition-colors" data-testid="link-exam-portal-footer">
                  Examination Portal
                </a>
              </li>
              <li><a href="#" className="hover:text-orange-400 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-orange-400 transition-colors">Terms of Service</a></li>
            </ul>
          </div>

          </div>
      </div>
      
      <div className="border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-2 text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} {portalName}. All Rights Reserved.</p>
          <p>Your Gateway to Government Jobs</p>
        </div>
      </div>
    </footer>
  );
}
