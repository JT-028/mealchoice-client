import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Shield, FileText } from 'lucide-react';

interface LegalDialogProps {
    type: 'privacy' | 'terms';
    trigger: React.ReactNode;
}

export function LegalDialog({ type, trigger }: LegalDialogProps) {
    const [open, setOpen] = useState(false);

    const isPrivacy = type === 'privacy';
    const title = isPrivacy ? 'Privacy Policy' : 'Terms of Service';
    const Icon = isPrivacy ? Shield : FileText;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] p-0">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="flex items-center gap-2">
                        <Icon className="h-5 w-5 text-primary" />
                        {title}
                    </DialogTitle>
                    <DialogDescription>Last updated: January 2026</DialogDescription>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto px-6 pb-6">
                    {isPrivacy ? <PrivacyContent /> : <TermsContent />}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function PrivacyContent() {
    return (
        <div className="prose prose-sm prose-gray dark:prose-invert max-w-none">
            <h3>1. Introduction</h3>
            <p>
                Welcome to MealChoice. We respect your privacy and are committed to protecting your personal data.
                This policy explains how we collect, use, and safeguard your information.
            </p>

            <h3>2. Information We Collect</h3>
            <ul>
                <li>Name, email, and phone number</li>
                <li>Delivery addresses</li>
                <li>Payment information (via secure partners)</li>
                <li>Order history and preferences</li>
                <li>Device and usage data</li>
            </ul>

            <h3>3. How We Use Your Information</h3>
            <ul>
                <li>Process and fulfill your orders</li>
                <li>Communicate about orders and account</li>
                <li>Provide personalized recommendations</li>
                <li>Improve our services</li>
                <li>Ensure platform security</li>
            </ul>

            <h3>4. Information Sharing</h3>
            <p>We share your information only with:</p>
            <ul>
                <li><strong>Market sellers:</strong> To fulfill orders</li>
                <li><strong>Payment processors:</strong> For secure transactions</li>
                <li><strong>Service providers:</strong> Who help operate our platform</li>
            </ul>
            <p>We never sell your personal information.</p>

            <h3>5. Data Security</h3>
            <p>
                We implement encryption, secure password hashing, regular security audits, and access controls.
            </p>

            <h3>6. Your Rights</h3>
            <p>You can access, correct, delete your data, or opt out of marketing at any time.</p>

            <h3>7. Contact Us</h3>
            <p>Email: mealchoice2025@gmail.com</p>
        </div>
    );
}

function TermsContent() {
    return (
        <div className="prose prose-sm prose-gray dark:prose-invert max-w-none">
            <h3>1. Acceptance of Terms</h3>
            <p>
                By using MealChoice, you agree to these Terms of Service. If you don't agree, please don't use our platform.
            </p>

            <h3>2. Description of Service</h3>
            <p>
                MealChoice is an AI-powered meal planning and market ordering platform connecting customers
                with local market sellers in Angeles City, Pampanga.
            </p>

            <h3>3. User Accounts</h3>
            <p>
                You must provide accurate information during registration and maintain your account security.
                You're responsible for all activities under your account.
            </p>

            <h3>4. User Conduct</h3>
            <p>You agree not to:</p>
            <ul>
                <li>Use the platform for unlawful purposes</li>
                <li>Impersonate others or disrupt the platform</li>
                <li>Attempt unauthorized access</li>
                <li>Harass other users or sellers</li>
            </ul>

            <h3>5. Orders and Payments</h3>
            <ul>
                <li>Orders are subject to availability and seller acceptance</li>
                <li>Prices are set by sellers (in ₱)</li>
                <li>We accept QR payments and cash on delivery</li>
                <li>Cancellations possible before order confirmation</li>
            </ul>

            <h3>6. Seller Obligations</h3>
            <p>Sellers must provide accurate info, maintain quality standards, and fulfill orders timely.</p>

            <h3>7. Disclaimer</h3>
            <p>
                The platform is provided "as is" without warranties. We're not liable for indirect damages.
            </p>

            <h3>8. Contact</h3>
            <p>Email: mealchoice2025@gmail.com | Angeles City, Pampanga</p>
        </div>
    );
}
