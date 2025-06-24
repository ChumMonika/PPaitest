import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut, Crown, UserCog, Presentation, Users, GraduationCap } from "lucide-react";

interface DashboardHeaderProps {
  role: string;
  title: string;
  subtitle?: string;
}

const roleIcons = {
  head: Crown,
  admin: UserCog,
  mazer: Presentation,
  assistant: Users,
  teacher: GraduationCap,
  staff: GraduationCap,
};

const roleColors = {
  head: "bg-primary text-white",
  admin: "bg-purple-600 text-white",
  mazer: "bg-green-600 text-white",
  assistant: "bg-orange-600 text-white",
  teacher: "bg-indigo-600 text-white",
  staff: "bg-indigo-600 text-white",
};

export function DashboardHeader({ role, title, subtitle }: DashboardHeaderProps) {
  const { user, logout } = useAuth();
  const Icon = roleIcons[role as keyof typeof roleIcons] || GraduationCap;
  const colorClass = roleColors[role as keyof typeof roleColors] || "bg-indigo-600 text-white";

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className={`${colorClass} shadow-lg`}>
      <div className="px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Icon className="text-2xl w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">{title}</h1>
              <p className="opacity-90">
                {user?.name} - {subtitle || user?.department}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm opacity-90">{today}</span>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
