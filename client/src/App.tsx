import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { usePortal } from "@/hooks/use-portal";
import { useEffect } from "react";

function SkipLink() {
  return (
    <a 
      href="#main-content" 
      className="skip-link"
      aria-label="Skip to main content"
    >
      Skip to Main Content
    </a>
  );
}

// Page Imports
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import CreateProfile from "@/pages/CreateProfile";
import ExamList from "@/pages/ExamList";
import ExamDetails from "@/pages/ExamDetails";
import Applications from "@/pages/Applications";
import AdmitCard from "@/pages/AdmitCard";
import Results from "@/pages/Results";
import MeritList from "@/pages/MeritList";
import Notices from "@/pages/Notices";
import Contact from "@/pages/Contact";
import CandidateDashboard from "@/pages/CandidateDashboard";
import MyResult from "@/pages/MyResult";
import Revaluation from "@/pages/Revaluation";

// Admin Pages
import AdminDashboard from "@/pages/admin/AdminDashboard";
import ManageExams from "@/pages/admin/ManageExams";
import ManageNotices from "@/pages/admin/ManageNotices";
import NoticeForm from "@/pages/admin/NoticeForm";
import ViewApplications from "@/pages/admin/ViewApplications";
import CenterAllocation from "@/pages/admin/CenterAllocation";
import SiteSettings from "@/pages/admin/SiteSettings";
import SubdomainConfig from "@/pages/admin/SubdomainConfig";
import ManageAnswerKeys from "@/pages/admin/ManageAnswerKeys";
import ManageResults from "@/pages/admin/ManageResults";
import ManageAdmitCards from "@/pages/admin/ManageAdmitCards";
import ManageTemplates from "@/pages/admin/ManageTemplates";
import ManageRevaluations from "@/pages/admin/ManageRevaluations";
import ManageCertificates from "@/pages/admin/ManageCertificates";
import Certificates from "@/pages/Certificates";
import CertificateView from "@/pages/CertificateView";
import VerifyCertificate from "@/pages/VerifyCertificate";
import VerifyCompanyCertificate from "@/pages/VerifyCompanyCertificate";
import Reports from "@/pages/admin/Reports";
import ManageCompanyCertificates from "@/pages/admin/ManageCompanyCertificates";
import JobAlerts from "@/pages/JobAlerts";
import JobAlertDetail from "@/pages/JobAlertDetail";
import RojgarHubHome from "@/pages/RojgarHubHome";
import ManageJobAlerts from "@/pages/admin/ManageJobAlerts";
import TestSeries from "@/pages/TestSeries";
import TakeTest from "@/pages/TakeTest";
import ManageTestSeries from "@/pages/admin/ManageTestSeries";
import ManageTestQuestions from "@/pages/admin/ManageTestQuestions";
import ManageSEBConfig from "@/pages/admin/ManageSEBConfig";
import ManageExamData from "@/pages/admin/ManageExamData";
import SecureExamLaunch from "@/pages/SecureExamLaunch";
import ManageExamCenters from "@/pages/admin/ManageExamCenters";

// Center Admin Pages
import CenterAdminLogin from "@/pages/center-admin/CenterAdminLogin";
import CenterAdminDashboard from "@/pages/center-admin/CenterAdminDashboard";

// Student Exam Pages
import StudentExamPanel from "@/pages/student-exam/StudentExamPanel";
import ExamComplete from "@/pages/student-exam/ExamComplete";

// SEB Admin Pages
import SEBAdminLogin from "@/pages/seb-admin/SEBAdminLogin";
import SEBAdminDashboard from "@/pages/seb-admin/SEBAdminDashboard";

function AdminRoutes() {
  return (
    <>
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/exams" component={ManageExams} />
      <Route path="/admin/exams/new" component={ManageExams} />
      <Route path="/admin/exams/:id/edit" component={ManageExams} />
      <Route path="/admin/notices" component={ManageNotices} />
      <Route path="/admin/notices/new" component={NoticeForm} />
      <Route path="/admin/notices/:id/edit" component={NoticeForm} />
      <Route path="/admin/applications" component={ViewApplications} />
      <Route path="/admin/exams/:examId/centers" component={CenterAllocation} />
      <Route path="/admin/exams/:examId/seb-config" component={ManageSEBConfig} />
      <Route path="/admin/exams/:examId/data" component={ManageExamData} />
      <Route path="/admin/settings" component={SiteSettings} />
      <Route path="/admin/subdomain" component={SubdomainConfig} />
      <Route path="/admin/answer-keys" component={ManageAnswerKeys} />
      <Route path="/admin/results" component={ManageResults} />
      <Route path="/admin/results/:examId" component={ManageResults} />
      <Route path="/admin/admit-cards" component={ManageAdmitCards} />
      <Route path="/admin/templates" component={ManageTemplates} />
      <Route path="/admin/revaluations" component={ManageRevaluations} />
      <Route path="/admin/certificates" component={ManageCertificates} />
      <Route path="/admin/company-certificates" component={ManageCompanyCertificates} />
      <Route path="/admin/job-alerts" component={ManageJobAlerts} />
      <Route path="/admin/test-series" component={ManageTestSeries} />
      <Route path="/admin/test-series/:testId/questions" component={ManageTestQuestions} />
      <Route path="/admin/exam-centers" component={ManageExamCenters} />
      <Route path="/admin/reports" component={Reports} />
    </>
  );
}


function Router() {
  const { isDedicatedDomain } = usePortal();

  if (isDedicatedDomain) {
    return (
      <Switch>
        <Route path="/" component={RojgarHubHome} />
        <Route path="/jobs" component={JobAlerts} />
        <Route path="/jobs/test-series" component={TestSeries} />
        <Route path="/jobs/test-series/:id/take" component={TakeTest} />
        <Route path="/jobs/:id" component={JobAlertDetail} />
        <Route path="/test-series" component={TestSeries} />
        <Route path="/test-series/:id/take" component={TakeTest} />
        <Route path="/contact" component={Contact} />

        {/* Backward compatibility for /job-alerts paths */}
        <Route path="/job-alerts" component={JobAlerts} />
        <Route path="/job-alerts/test-series" component={TestSeries} />
        <Route path="/job-alerts/test-series/:id/take" component={TakeTest} />
        <Route path="/job-alerts/:id" component={JobAlertDetail} />

        <Route path="/login" component={Login} />
        <AdminRoutes />
        <Route component={NotFound} />
      </Switch>
    );
  }
  
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/exams" component={ExamList} />
      <Route path="/exams/:id" component={ExamDetails} />
      <Route path="/results" component={Results} />
      <Route path="/results/:examId/merit-list" component={MeritList} />
      <Route path="/notices" component={Notices} />
      <Route path="/job-alerts" component={JobAlerts} />
      <Route path="/job-alerts/test-series" component={TestSeries} />
      <Route path="/job-alerts/test-series/:id/take" component={TakeTest} />
      <Route path="/job-alerts/:id" component={JobAlertDetail} />
      <Route path="/contact" component={Contact} />
      
      {/* Secure Exam Launch */}
      <Route path="/secure-exam/:token" component={SecureExamLaunch} />
      
      {/* Center Admin Routes */}
      <Route path="/center-admin/login" component={CenterAdminLogin} />
      <Route path="/center-admin/dashboard" component={CenterAdminDashboard} />
      
      {/* Student Exam Routes (LAN Connected) */}
      <Route path="/student-exam/take" component={StudentExamPanel} />
      <Route path="/student-exam/complete" component={ExamComplete} />
      
      {/* SEB Admin Routes (Separate from Registration Portal) */}
      <Route path="/seb-admin/login" component={SEBAdminLogin} />
      <Route path="/seb-admin/dashboard" component={SEBAdminDashboard} />
      
      {/* Candidate Routes */}
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/candidate-dashboard" component={CandidateDashboard} />
      <Route path="/profile/create" component={CreateProfile} />
      <Route path="/profile/edit" component={CreateProfile} />
      <Route path="/applications" component={Applications} />
      <Route path="/admit-card/:applicationId" component={AdmitCard} />
      <Route path="/my-result/:applicationId" component={MyResult} />
      <Route path="/revaluation" component={Revaluation} />
      <Route path="/certificates" component={Certificates} />
      <Route path="/certificate/:id" component={CertificateView} />
      <Route path="/verify" component={VerifyCertificate} />
      <Route path="/verify-company-certificate" component={VerifyCompanyCertificate} />
      
      <AdminRoutes />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SkipLink />
        <div id="main-content">
          <Router />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
