import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  ArrowRightLeft,
  Shield,
  LogOut,
  User,
  Send,
  Menu,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "New Transfer", icon: Send, path: "/transfer" },
  { label: "Transactions", icon: ArrowRightLeft, path: "/transactions" },
  { label: "Verification", icon: Shield, path: "/verification" },
];

const SidebarContent = ({
  user,
  signOut,
  location,
  onNavigate,
}: {
  user: any;
  signOut: () => void;
  location: any;
  onNavigate?: () => void;
}) => (
  <div className="flex flex-col h-full">
    <div className="p-6">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
          <Shield className="w-4 h-4 text-sidebar-primary-foreground" />
        </div>
        <span className="text-lg font-bold">TransferGo</span>
      </div>
    </div>

    <nav className="flex-1 px-3 space-y-1">
      {navItems.map((item) => {
        const active = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            }`}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>

    <div className="p-4 border-t border-sidebar-border">
      <div className="flex items-center gap-3 mb-3 px-2">
        <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center">
          <User className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">{user?.email}</p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={signOut}
        className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Sign Out
      </Button>
    </div>
  </div>
);

const AppLayout = ({ children }: { children: ReactNode }) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile header */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-sidebar text-sidebar-foreground flex items-center gap-3 px-4 py-3">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-sidebar-foreground">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 bg-sidebar text-sidebar-foreground border-none">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SidebarContent
                user={user}
                signOut={signOut}
                location={location}
                onNavigate={() => setOpen(false)}
              />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-sidebar-primary-foreground" />
            </div>
            <span className="text-base font-bold">TransferGo</span>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      {!isMobile && (
        <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col shrink-0 fixed inset-y-0 left-0">
          <SidebarContent user={user} signOut={signOut} location={location} />
        </aside>
      )}

      {/* Main content */}
      <main className={`flex-1 overflow-auto ${isMobile ? "pt-14" : "ml-64"}`}>
        <div className="p-6 md:p-8 max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
};

export default AppLayout;
