import { useEffect, useState, useRef, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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

let youtubeApiPromise: Promise<void> | null = null;

const loadYouTubeApi = () => {
    if (window.YT && window.YT.Player) {
        return Promise.resolve();
    }

    if (!youtubeApiPromise) {
        youtubeApiPromise = new Promise((resolve) => {
            const previousReady = window.onYouTubeIframeAPIReady;
            window.onYouTubeIframeAPIReady = () => {
                previousReady?.();
                resolve();
            };
        });
    }

    return youtubeApiPromise;
};


export function TutorialDialog({ userType, onComplete }: TutorialDialogProps) {
    const { token, user, updateUser } = useAuth();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [videoEnded, setVideoEnded] = useState(false);
    const [videoError, setVideoError] = useState(false);
    const [videoLoading, setVideoLoading] = useState(false);
    const playerRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<number | null>(null);

    const initPlayer = useCallback(() => {
        if (!containerRef.current || playerRef.current) return;

        const videoId = VIDEO_IDS[userType];

        playerRef.current = new window.YT.Player(containerRef.current, {
            videoId: videoId,
            playerVars: {
                rel: 0,
                modestbranding: 1,
                enablejsapi: 1,
                origin: window.location.origin,
            },
            events: {
                onReady: () => {
                    setVideoLoading(false);
                    if (timeoutRef.current) {
                        window.clearTimeout(timeoutRef.current);
                    }
                },
                onStateChange: (event: any) => {
                    // State 0 = ended
                    if (event.data === 0) {
                        setVideoEnded(true);
                    }
                },
                onError: () => {
                    setVideoError(true);
                    setVideoLoading(false);
                }
            }
        });
    }, [userType]);

    // Load YouTube IFrame API
    useEffect(() => {
        if (!open) return;

        let isMounted = true;

        setVideoEnded(false);
        setVideoError(false);
        setVideoLoading(true);

        if (timeoutRef.current) {
            window.clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = window.setTimeout(() => {
            if (!playerRef.current) {
                setVideoError(true);
                setVideoLoading(false);
            }
        }, 5000);

        loadYouTubeApi()
            .then(() => {
                if (!isMounted) return;
                initPlayer();
            })
            .catch(() => {
                if (!isMounted) return;
                setVideoError(true);
                setVideoLoading(false);
            });

        return () => {
            isMounted = false;
            if (timeoutRef.current) {
                window.clearTimeout(timeoutRef.current);
            }
            if (playerRef.current) {
                playerRef.current.destroy();
                playerRef.current = null;
            }
        };
    }, [open, initPlayer]);

    useEffect(() => {
        // Show tutorial dialog if user hasn't watched it yet
        if (user && !user.hasWatchedTutorial) {
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

    const handleSkip = () => {
        // Just close the dialog without marking as watched
        // The dialog will appear again on next login
        if (playerRef.current) {
            playerRef.current.destroy();
            playerRef.current = null;
        }
        if (timeoutRef.current) {
            window.clearTimeout(timeoutRef.current);
        }
        setOpen(false);
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
                    <div className="aspect-video bg-muted rounded-lg overflow-hidden relative">
                        {videoLoading && !videoError ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6">
                                <Skeleton className="h-10 w-32" />
                                <Skeleton className="h-4 w-48" />
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="h-4 w-28" />
                            </div>
                        ) : null}
                        {videoError ? (
                            <div className="w-full h-full flex flex-col items-center justify-center text-center p-6">
                                <Video className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="font-semibold text-lg mb-2">Video Unavailable</h3>
                                <p className="text-muted-foreground text-sm mb-4">
                                    The tutorial video couldn't be loaded. This may be due to network issues or video availability.
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    You can click "Skip Tutorial" below to continue without watching.
                                </p>
                            </div>
                        ) : (
                            <div ref={containerRef} className="w-full h-full"></div>
                        )}
                    </div>
                </div>

                <div className="p-6 pt-4 flex justify-between items-center border-t mt-4">
                    <div className="flex items-center gap-2">
                        {videoError ? (
                            <span className="text-xs text-amber-600">
                                Video unavailable - you can skip the tutorial
                            </span>
                        ) : videoEnded ? (
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
                            {videoError ? 'Skip Tutorial' : 'Watch Later'}
                        </Button>
                        <Button
                            onClick={handleClose}
                            disabled={loading || (!videoEnded && !videoError)}
                        >
                            {loading ? 'Saving...' : 'Got It!'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
