import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { forgotPassword } from '@/api/auth';
import { UtensilsCrossed, Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await forgotPassword(email);

            if (response.success) {
                setIsSuccess(true);
            } else {
                setError(response.message || 'Failed to send reset email');
            }
        } catch (err) {
            setError('Unable to connect to server. Please try again.');
            console.error('Forgot password error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Success state
    if (isSuccess) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center lg:justify-end p-4 lg:pr-32">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: 'url("/login-bg.webp")' }}
                />
                <div className="absolute inset-0 bg-black/60 dark:bg-black/60" />

                <Card className="relative w-full max-w-md shadow-lg">
                    <CardContent className="pt-8 pb-8 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                                <CheckCircle className="h-8 w-8 text-green-600" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Check Your Email!</h2>
                        <p className="text-muted-foreground mb-4">
                            If an account exists for <span className="font-medium text-foreground">{email}</span>,
                            you'll receive a password reset link shortly.
                        </p>
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
                            <Mail className="h-4 w-4" />
                            <span>The link will expire in 1 hour</span>
                        </div>
                        <Button asChild variant="outline">
                            <Link to="/login">Back to Login</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center lg:justify-end p-4 lg:pr-32">
            {/* Background */}
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: 'url("/login-bg.webp")' }}
            />
            <div className="absolute inset-0 bg-black/60 dark:bg-black/60" />

            <Card className="relative w-full max-w-md shadow-lg">
                <CardHeader className="text-center">
                    <Link to="/" className="flex items-center justify-center gap-2 mb-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
                            <UtensilsCrossed className="h-6 w-6 text-primary-foreground" />
                        </div>
                    </Link>
                    <CardTitle className="text-2xl">Forgot Password?</CardTitle>
                    <CardDescription>
                        Enter your email and we'll send you a link to reset your password
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                'Send Reset Link'
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link
                            to="/login"
                            className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Login
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
