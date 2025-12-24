import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { UtensilsCrossed, Menu, X, LogOut, User } from 'lucide-react';
import { useState, useCallback } from 'react';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Smooth scroll to section
  const scrollToSection = useCallback((e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      const headerHeight = 64; // Height of the sticky header
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - headerHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
    setMobileMenuOpen(false);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <UtensilsCrossed className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">Meal Choice</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <a 
            href="#features" 
            onClick={(e) => scrollToSection(e, 'features')}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Features
          </a>
          <a 
            href="#how-it-works"
            onClick={(e) => scrollToSection(e, 'how-it-works')}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            How It Works
          </a>
          <a 
            href="#users"
            onClick={(e) => scrollToSection(e, 'users')}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            For Users
          </a>
        </nav>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated && user ? (
            <>
              <div className="flex items-center gap-2 text-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <span className="font-medium text-foreground">{user.name}</span>
                <span className="text-xs text-muted-foreground capitalize">({user.role})</span>
              </div>
              <Button variant="ghost" asChild>
                <Link to="/dashboard" className="text-foreground">Dashboard</Link>
              </Button>
              <Button variant="outline" onClick={handleLogout} className="gap-2 text-muted-foreground">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to="/login" className="text-foreground">Log In</Link>
              </Button>
              <Button asChild>
                <Link to="/register" className="text-foreground">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6 text-foreground" />
          ) : (
            <Menu className="h-6 w-6 text-foreground" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="flex flex-col p-4 gap-4">
            <a 
              href="#features" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
              onClick={(e) => scrollToSection(e, 'features')}
            >
              Features
            </a>
            <a 
              href="#how-it-works" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
              onClick={(e) => scrollToSection(e, 'how-it-works')}
            >
              How It Works
            </a>
            <a 
              href="#users" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
              onClick={(e) => scrollToSection(e, 'users')}
            >
              For Users
            </a>
            <div className="flex flex-col gap-2 pt-4 border-t border-border">
              {isAuthenticated && user ? (
                <>
                  <div className="flex items-center gap-2 text-sm pb-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium">{user.name}</span>
                  </div>
                  <Button variant="outline" asChild className="w-full">
                    <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
                  </Button>
                  <Button variant="outline" onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="w-full gap-2">
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" asChild className="w-full">
                    <Link to="/login">Log In</Link>
                  </Button>
                  <Button asChild className="w-full">
                    <Link to="/register">Get Started</Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
