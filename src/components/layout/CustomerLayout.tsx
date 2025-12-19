import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { Badge } from '@/components/ui/badge';
import {
  UtensilsCrossed,
  LayoutDashboard,
  ShoppingBag,
  ShoppingCart,
  Package,
  Wallet,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import { useState } from 'react';

interface CustomerLayoutProps {
  children: React.ReactNode;
  noPadding?: boolean;
}

const navItems = [
  { href: '/customer', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/customer/browse', label: 'Browse Products', icon: ShoppingBag },
  { href: '/customer/cart', label: 'Cart', icon: ShoppingCart },
  { href: '/customer/orders', label: 'My Orders', icon: Package },
  { href: '/customer/messages', label: 'Messages', icon: MessageSquare },
  { href: '/customer/budget', label: 'Budget', icon: Wallet },
  { href: '/customer/settings', label: 'Settings', icon: Settings },
];

export function CustomerLayout({ children, noPadding = false }: CustomerLayoutProps) {
  const { user, logout } = useAuth();
  const { totalUnreadCount } = useChat();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
        <div className="flex h-16 items-center justify-between px-4">
          <button onClick={() => setSidebarOpen(true)} className="p-2">
            <Menu className="h-6 w-6" />
          </button>
          <Link to="/customer" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <UtensilsCrossed className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold">Meal Choice</span>
          </Link>
          <div className="w-10" />
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-sidebar border-r border-sidebar-border
          transform transition-transform duration-200 ease-in-out
          lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
            <Link to="/customer" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <UtensilsCrossed className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-sidebar-foreground">Meal Choice</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 text-sidebar-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-primary/20">
                <UtensilsCrossed className="h-5 w-5 text-sidebar-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sidebar-foreground truncate">{user?.name}</p>
                <p className="text-xs text-sidebar-foreground/60">Customer</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
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
                    flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                    ${isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                  {showBadge && (
                    <Badge variant="default" className="ml-auto rounded-full h-5 min-w-5 flex items-center justify-center">
                      {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                    </Badge>
                  )}
                  {isActive && !showBadge && <ChevronRight className="h-4 w-4 ml-auto" />}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-sidebar-border">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent/50"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-64">
        <div className={noPadding ? '' : 'p-4 lg:p-8'}>
          {children}
        </div>
      </main>
    </div>
  );
}
