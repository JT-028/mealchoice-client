import { useEffect, useState, useRef, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Video, X, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { markTutorialWatched } from '@/api/auth';

interface TutorialDialogProps {
    userType: 'customer' | 'seller';
    onComplete?: () => void;
}

// YouTube video IDs for each user type
const VIDEO_IDS = {
    customer: 'Az081QBjPag',
    seller: 'hX2Pw3t5gzU'
};

// Extend Window interface to include YouTube API
declare global {
    interface Window {
        YT: any;
        onYouTubeIframeAPIReady: () => void;
    }
}

export function TutorialDialog({ userType, onComplete }: TutorialDialogProps) {
    const { token, user, updateUser } = useAuth();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [videoEnded, setVideoEnded] = useState(false);
    const playerRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Load YouTube IFrame API
    useEffect(() => {
        if (!open) return;

        // Check if API is already loaded
        if (window.YT && window.YT.Player) {
            initPlayer();
            return;
        }

        // Load the YouTube IFrame API script
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

        // Set up callback for when API is ready
        window.onYouTubeIframeAPIReady = () => {
            initPlayer();
        };

        return () => {
            if (playerRef.current) {
                playerRef.current.destroy();
                playerRef.current = null;
            }
        };
    }, [open]);

    const initPlayer = useCallback(() => {
        if (!containerRef.current || playerRef.current) return;

        const videoId = VIDEO_IDS[userType];

        playerRef.current = new window.YT.Player(containerRef.current, {
            videoId: videoId,
            playerVars: {
                rel: 0,
                modestbranding: 1,
                enablejsapi: 1,
            },
            events: {
                onStateChange: (event: any) => {
                    // State 0 = ended
                    if (event.data === 0) {
                        setVideoEnded(true);
                    }
                }
            }
        });
    }, [userType]);

    useEffect(() => {
        // Show tutorial dialog if user hasn't watched it yet
        if (user && !user.hasWatchedTutorial) {
            // For customers, only show after onboarding is completed
            if (userType === 'customer' && !user.hasCompletedOnboarding) {
                return;
            }
            // Show the tutorial dialog
            setOpen(true);
        }
    }, [user, userType]);

    const handleClose = async () => {
        if (!token) return;

        setLoading(true);
        try {
            const response = await markTutorialWatched(token);
            if (response.success) {
                // Update local user state
                updateUser?.({ hasWatchedTutorial: true });
                setOpen(false);
                onComplete?.();
            }
        } catch (error) {
            console.error('Error marking tutorial as watched:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = async () => {
        await handleClose();
    };

    const title = userType === 'seller'
        ? 'Welcome to MealChoice!'
        : 'Getting Started with MealChoice';

    const description = userType === 'seller'
        ? 'Watch this quick tutorial to learn how to manage your store, products, and orders.'
        : 'Watch this tutorial to learn how to find great deals, plan meals, and order from local markets.';

    return (
        <Dialog open={open} onOpenChange={() => { }}>
            <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden [&>button]:hidden">
                <DialogHeader className="p-6 pb-4">
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Video className="h-5 w-5 text-primary" />
                        {title}
                    </DialogTitle>
                    <DialogDescription>
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <div className="px-6">
                    {/* YouTube Player Container */}
                    <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                        <div ref={containerRef} className="w-full h-full"></div>
                    </div>
                </div>

                <div className="p-6 pt-4 flex justify-between items-center border-t mt-4">
                    <div className="flex items-center gap-2">
                        {videoEnded ? (
                            <span className="text-xs text-green-600 flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Video completed!
                            </span>
                        ) : (
                            <span className="text-xs text-muted-foreground">
                                Watch the full video to enable "Got It!"
                            </span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={handleSkip}
                            disabled={loading}
                        >
                            <X className="h-4 w-4 mr-1" />
                            {loading ? 'Saving...' : 'Skip for Now'}
                        </Button>
                        <Button
                            onClick={handleClose}
                            disabled={loading || !videoEnded}
                        >
                            {loading ? 'Saving...' : 'Got It!'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
