import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { submitSellerRequest } from '@/api/auth';
import { Store, Loader2, CheckCircle, Phone } from 'lucide-react';

interface SellerRequestDialogProps {
    trigger: React.ReactNode;
}

export function SellerRequestDialog({ trigger }: SellerRequestDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [market, setMarket] = useState('');
    const [stallName, setStallName] = useState('');
    const [stallNumber, setStallNumber] = useState('');
    const [message, setMessage] = useState('');

    // Format phone number: auto-add +63 and format as +639XXXXXXXXX
    const formatPhoneNumber = (value: string) => {
        let digits = value.replace(/\D/g, '');
        if (digits.startsWith('63')) digits = digits.slice(2);
        if (digits.startsWith('0')) digits = digits.slice(1);
        digits = digits.slice(0, 10);
        if (digits.length > 0) return `+63${digits}`;
        return '';
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPhone(formatPhoneNumber(e.target.value));
    };

    const resetForm = () => {
        setName('');
        setEmail('');
        setPhone('');
        setMarket('');
        setStallName('');
        setStallNumber('');
        setMessage('');
        setError('');
        setSuccess(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate phone
        const phoneRegex = /^\+639\d{9}$/;
        if (!phoneRegex.test(phone)) {
            setError('Please enter a valid Philippine mobile number');
            return;
        }

        if (!market) {
            setError('Please select your preferred market');
            return;
        }

        setLoading(true);
        try {
            const response = await submitSellerRequest({
                name,
                email,
                phone,
                preferredMarket: market,
                stallName: stallName || undefined,
                stallNumber: stallNumber || undefined,
                message: message || undefined,
            });

            if (response.success) {
                setSuccess(true);
            } else {
                setError(response.message || 'Failed to submit request');
            }
        } catch {
            setError('Unable to connect to server. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenChange = (open: boolean) => {
        setOpen(open);
        if (!open) {
            setTimeout(resetForm, 300);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                {success ? (
                    <div className="text-center py-8">
                        <div className="flex justify-center mb-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                                <CheckCircle className="h-8 w-8 text-green-600" />
                            </div>
                        </div>
                        <h2 className="text-xl font-bold mb-2">Request Submitted!</h2>
                        <p className="text-muted-foreground mb-4">
                            We've received your seller account request. Once approved, you'll receive an email with your login credentials.
                        </p>
                        <Button onClick={() => setOpen(false)}>Close</Button>
                    </div>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Store className="h-5 w-5 text-primary" />
                                Become a Seller
                            </DialogTitle>
                            <DialogDescription>
                                Fill out this form to request a seller account. We'll review your application and get back to you via email.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                            {error && (
                                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
                                    {error}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="seller-name">Full Name *</Label>
                                    <Input
                                        id="seller-name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Your full name"
                                        required
                                        disabled={loading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="seller-email">Email *</Label>
                                    <Input
                                        id="seller-email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="your@email.com"
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="seller-phone">Phone Number *</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="seller-phone"
                                        type="tel"
                                        value={phone}
                                        onChange={handlePhoneChange}
                                        placeholder="9171234567"
                                        required
                                        disabled={loading}
                                        className="pl-10"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Preferred Market *</Label>
                                <Select value={market} onValueChange={setMarket} disabled={loading}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a market" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="San Nicolas Market">San Nicolas Market</SelectItem>
                                        <SelectItem value="Pampang Public Market">Pampang Public Market</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="stall-name">Stall Name</Label>
                                    <Input
                                        id="stall-name"
                                        value={stallName}
                                        onChange={(e) => setStallName(e.target.value)}
                                        placeholder="(Optional)"
                                        disabled={loading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="stall-number">Stall Number</Label>
                                    <Input
                                        id="stall-number"
                                        value={stallNumber}
                                        onChange={(e) => setStallNumber(e.target.value)}
                                        placeholder="(Optional)"
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="seller-message">Additional Information</Label>
                                <Textarea
                                    id="seller-message"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Tell us about your business (optional)"
                                    disabled={loading}
                                    rows={3}
                                />
                            </div>

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    'Submit Request'
                                )}
                            </Button>
                        </form>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
