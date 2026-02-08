import { Bell } from "lucide-react";
import { Link } from "wouter";
import { useNotices } from "@/hooks/use-notices";

export function NewsTicker() {
  const { data: notices } = useNotices();
  
  // Filter for 'new' notices or recent ones
  const activeNotices = notices?.filter(n => n.isNew) || [];
  
  if (activeNotices.length === 0) return null;

  return (
    <div className="bg-primary text-primary-foreground py-2 overflow-hidden relative flex items-center shadow-md z-40">
      <div className="absolute left-0 bg-primary px-4 z-10 h-full flex items-center font-bold text-sm shadow-[4px_0_8px_rgba(0,0,0,0.1)]">
        <Bell className="w-4 h-4 mr-2 text-secondary animate-pulse" />
        LATEST UPDATES
      </div>
      
      <div className="whitespace-nowrap flex animate-ticker pl-40 hover:[animation-play-state:paused]">
        {activeNotices.map((notice, idx) => (
          <div key={notice.id} className="inline-flex items-center mx-8">
            <span className="text-sm font-medium mr-2">{notice.title}</span>
            <span className="bg-secondary text-secondary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded">NEW</span>
            {idx !== activeNotices.length - 1 && (
              <span className="mx-4 text-primary-foreground/40">|</span>
            )}
          </div>
        ))}
        {/* Duplicate for infinite scroll illusion if needed, or simple CSS loop */}
      </div>
    </div>
  );
}
