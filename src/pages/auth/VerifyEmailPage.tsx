import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '@/config/api';

export function VerifyEmailPage() {
    const { token } = useParams<{ token: string }>();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');
    const hasVerified = useRef(false);

    useEffect(() => {
        const verifyEmail = async () => {
            // Prevent double execution in React Strict Mode
            if (hasVerified.current) return;
            hasVerified.current = true;

            if (!token) {
                setStatus('error');
                setMessage('Invalid verification link');
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/auth/verify/${token}`);
                const data = await response.json();

                if (data.success) {
                    setStatus('success');
                    setMessage(data.message || 'Email verified successfully!');
                } else {
                    setStatus('error');
                    setMessage(data.message || 'Verification failed');
                }
            } catch (error) {
                setStatus('error');
                setMessage('An error occurred during verification');
            }
        };

        verifyEmail();
    }, [token]);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle>Email Verification</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                    {status === 'loading' && (
                        <>
                            <Loader2 className="h-16 w-16 text-primary animate-spin" />
                            <p className="text-muted-foreground">Verifying your email...</p>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <CheckCircle className="h-16 w-16 text-green-500" />
                            <p className="text-center">{message}</p>
                            <p className="text-sm text-muted-foreground text-center">
                                You can now log in with your temporary password.
                                Please change your password after logging in.
                            </p>
                            <Button asChild className="mt-4">
                                <Link to="/login">Go to Login</Link>
                            </Button>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <XCircle className="h-16 w-16 text-destructive" />
                            <p className="text-center text-destructive">{message}</p>
                            <p className="text-sm text-muted-foreground text-center">
                                This link may have expired or is invalid.
                                Please contact support if you need assistance.
                            </p>
                            <Button asChild variant="outline" className="mt-4">
                                <Link to="/">Go to Home</Link>
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
