import { Card, CardContent } from '@/components/ui/card';
import { Clock } from 'lucide-react';

interface PendingVerificationProps {
  message?: string;
  showSteps?: boolean;
}

export function PendingVerification({ 
  message = "Your seller account is awaiting admin approval. You'll be able to access seller features once verified.",
  showSteps = true 
}: PendingVerificationProps) {
  return (
    <div className="max-w-md mx-auto text-center py-16">
      <div className="h-20 w-20 mx-auto bg-yellow-100 rounded-full flex items-center justify-center mb-6">
        <Clock className="h-10 w-10 text-yellow-600" />
      </div>
      <h1 className="text-2xl font-bold mb-2">Pending Verification</h1>
      <p className="text-muted-foreground mb-6">{message}</p>
      
      {showSteps && (
        <Card className="text-left">
          <CardContent>
            <h3 className="font-semibold mb-2">What happens next?</h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• An admin will review your registration</li>
              <li>• You'll be assigned a market location</li>
              <li>• Once approved, you can start adding products</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
