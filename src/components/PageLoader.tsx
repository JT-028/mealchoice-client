import { motion } from 'framer-motion';
import Lottie from 'lottie-react';
import foodChooseAnimation from '@/assets/food-choose.json';

interface PageLoaderProps {
    message?: string;
}

export function PageLoader({ message = 'Loading...' }: PageLoaderProps) {
    return (
        <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{
                opacity: 0,
                transition: { duration: 0.6, ease: [0.43, 0.13, 0.23, 0.96] }
            }}
            style={{
                willChange: 'opacity',
                backfaceVisibility: 'hidden',
                transform: 'translateZ(0)'
            }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background pointer-events-auto"
        >
            <div className="w-64 h-64 md:w-80 md:h-80">
                <Lottie
                    animationData={foodChooseAnimation}
                    loop={true}
                    autoplay={true}
                    rendererSettings={{
                        preserveAspectRatio: 'xMidYMid slice',
                        progressiveLoad: true, // Performance optimization
                    }}
                    style={{ width: '100%', height: '100%' }}
                />
            </div>
            <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="mt-4 text-lg font-medium text-foreground/80 text-center px-4"
            >
                {message}
            </motion.p>
        </motion.div>
    );
}

export default PageLoader;
