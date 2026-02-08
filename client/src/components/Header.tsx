import { Link, useLocation } from "wouter";
import { ShieldCheck, User, LogOut, Menu, X, Bell } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const { data: profile } = useProfile();
  const { data: settings } = useQuery<Record<string, any>>({
    queryKey: ["/api/settings"],
  });
  
  const logoUrl = settings?.logoUrl;
  const portalName = settings?.portalName || "Examination Portal";

  const jobAlertsLink = { label: "Job Alerts", href: "/job-alerts", external: false };

  const navItems = [
    { label: "Home", href: "/", external: false },
    { label: "Notices", href: "/notices", external: false },
    { label: "Live Exams", href: "/exams", external: false },
    { label: "Results", href: "/results", external: false },
    jobAlertsLink,
    { label: "Contact", href: "/contact", external: false },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-border shadow-sm">
      <div className="container-custom h-16 md:h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 md:gap-3 group">
          {logoUrl ? (
            <img src={logoUrl} alt={portalName} className="h-10 md:h-12 object-contain" />
          ) : (
            <>
              <div className="bg-primary/10 p-1.5 md:p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
                <ShieldCheck className="w-6 h-6 md:w-8 md:h-8 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-bold text-base md:text-lg leading-tight text-primary">
                  EXAMINATION
                </span>
                <span className="text-[10px] md:text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Portal
                </span>
              </div>
            </>
          )}
        </Link>

        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
          {navItems.map((item) =>
            item.external ? (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium transition-colors hover:text-primary text-muted-foreground"
                data-testid={`link-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location === item.href ? "text-primary font-bold" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </Link>
            )
          )}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full bg-primary/5 hover:bg-primary/10">
                  {profile?.photoUrl ? (
                    <img src={profile.photoUrl} alt="User" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    <User className="h-5 w-5 text-primary" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{profile?.fullName || user?.firstName || "User"}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {profile?.registrationNumber || user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="cursor-pointer w-full">Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile/edit" className="cursor-pointer w-full">Edit Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()} className="text-destructive cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" className="text-primary hover:text-primary/80" asChild>
                <Link href="/login">Log In</Link>
              </Button>
              <Button className="bg-primary hover:bg-primary/90" asChild>
                <Link href="/register">Register</Link>
              </Button>
            </div>
          )}
        </div>

        <button
          className="md:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          data-testid="button-mobile-menu"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-white">
          <div className="container-custom py-2 space-y-1">
            {navItems.map((item) =>
              item.external ? (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-sm font-medium min-h-[44px] px-2 rounded-md text-foreground"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center text-sm font-medium min-h-[44px] px-2 rounded-md ${
                    location === item.href ? "text-primary bg-primary/5 font-bold" : "text-foreground"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              )
            )}
            <div className="pt-2 border-t border-border">
              {isAuthenticated ? (
                <>
                  <Link href="/dashboard" className="flex items-center min-h-[44px] px-2 font-medium text-primary" onClick={() => setIsMobileMenuOpen(false)}>
                    Dashboard
                  </Link>
                  <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="flex items-center min-h-[44px] px-2 text-destructive w-full text-left">
                    Log out
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2 px-2 py-2">
                  <Button className="w-full bg-primary" asChild>
                    <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>Log In</Link>
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>Register</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
