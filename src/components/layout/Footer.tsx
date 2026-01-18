import { Link } from 'react-router-dom';
import { UtensilsCrossed } from 'lucide-react';
import { LegalDialog } from '@/components/LegalDialog';

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <UtensilsCrossed className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">Meal Choice</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              AI-powered meal planning and budget management for Angeles City markets.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#users" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  For Users
                </a>
              </li>
            </ul>
          </div>

          {/* Markets */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Markets</h4>
            <ul className="space-y-2">
              <li className="text-sm text-muted-foreground">San Nicolas Market</li>
              <li className="text-sm text-muted-foreground">Pampang Public Market</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Contact</h4>
            <ul className="space-y-2">
              <li className="text-sm text-muted-foreground">Angeles City, Pampanga</li>
              <li className="text-sm text-muted-foreground">mealchoice2025@gmail.com</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Meal Choice. All rights reserved.
          </p>
          <div className="flex gap-6">
            <LegalDialog
              type="privacy"
              trigger={
                <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </button>
              }
            />
            <LegalDialog
              type="terms"
              trigger={
                <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </button>
              }
            />
          </div>
        </div>
      </div>
    </footer>
  );
}

