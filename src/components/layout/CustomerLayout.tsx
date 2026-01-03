import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  UtensilsCrossed,
  LayoutDashboard,
  ShoppingCart,
  Package,
  Wallet,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  MessageSquare,
  Sparkles,
  Calendar,
  User,
  Store,
  ClipboardList,
  Video,
  RotateCcw
} from 'lucide-react';
import { useState } from 'react';

interface CustomerLayoutProps {
  children: React.ReactNode;
  noPadding?: boolean;
}

const navItems = [
  { href: '/customer', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/customer/browse', label: 'Market', icon: Store },
  { href: '/customer/generate-meals', label: 'Generate Meal', icon: Sparkles },
  { href: '/customer/meal-planner', label: 'Meal Plan', icon: Calendar },
  { href: '/customer/groceries', label: 'Check List', icon: ClipboardList },
  { href: '/customer/cart', label: 'My Carts', icon: ShoppingCart },
  { href: '/customer/orders', label: 'My Orders', icon: Package },
  { href: '/customer/messages', label: 'Messages', icon: MessageSquare },
  { href: '/customer/budget', label: 'Budget', icon: Wallet },
  { href: '/customer/settings', label: 'Setting', icon: Settings },
  { href: '/customer/tutorial', label: 'Tutorial Video', icon: Video },
];

export function CustomerLayout({ children, noPadding = false }: CustomerLayoutProps) {
  const { user, logout, updateUser } = useAuth();
  const { totalUnreadCount } = useChat();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleResetOnboarding = () => {
    updateUser({ hasCompletedOnboarding: false });
    navigate('/customer/onboarding');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="flex h-14 items-center justify-between px-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md hover:bg-accent transition-colors"
          >
            <Menu className="h-5 w-5 text-foreground" />
          </button>
          <Link to="/customer" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm">
              <UtensilsCrossed className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">Meal Choice</span>
          </Link>
          <div className="w-9" />
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-border
          shadow-lg lg:shadow-none
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between h-14 px-4 border-b border-border bg-card">
            <Link to="/customer" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary shadow-sm">
                <UtensilsCrossed className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg text-card-foreground">Meal Choice</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-md text-card-foreground hover:bg-accent transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3 p-2 rounded-lg bg-accent/30">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-card-foreground truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground">Customer</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              const isMessages = item.href === '/customer/messages';
              const showBadge = isMessages && totalUnreadCount > 0;

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                    ${isActive
                      ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                      : 'text-card-foreground hover:bg-accent hover:text-accent-foreground'
                    }
                  `}
                >
                  <Icon className={`h-5 w-5 ${isActive ? '' : 'text-muted-foreground'}`} />
                  <span className="flex-1">{item.label}</span>
                  {showBadge && (
                    <Badge
                      variant={isActive ? "secondary" : "default"}
                      className="rounded-full h-5 min-w-5 flex items-center justify-center text-xs"
                    >
                      {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                    </Badge>
                  )}
                  {isActive && !showBadge && <ChevronRight className="h-4 w-4 opacity-70" />}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-3 border-t border-border space-y-1">
            <Button
              variant="ghost"
              onClick={handleResetOnboarding}
              className="w-full justify-start gap-3 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <RotateCcw className="h-5 w-5" />
              Reset Onboarding
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-card-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  Logout
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You will be redirected to the home page. Any unsaved changes will be lost.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Logout
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-64 min-h-screen">
        <div className={noPadding ? '' : 'p-4 lg:p-6'}>
          {children}
        </div>
      </main>
    </div>
  );
}
