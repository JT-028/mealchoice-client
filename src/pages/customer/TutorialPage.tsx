import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Video } from 'lucide-react';

export function TutorialPage() {
  return (
    <CustomerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tutorial Video</h1>
          <p className="text-muted-foreground">Learn how to use Meal Choice effectively</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              How It Works (Customer Side)
            </CardTitle>
            <CardDescription>
              Watch this quick guide to get started with meal planning, ordering, and more.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center min-h-[400px] bg-muted/20 rounded-lg">
            <div className="text-center p-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Video className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Video Coming Soon</h3>
              <p className="text-muted-foreground max-w-sm">
                We are currently producing a comprehensive tutorial video to help you get the most out of Meal Choice. Please check back later!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </CustomerLayout>
  );
}
