import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button, Typography } from '../components/ui';

export function LandingPage() {
  const navigate = useNavigate();

  const handleCreateRoom = () => {
    navigate('/create');
  };

  const handleJoinRoom = () => {
    navigate('/join');
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-surface-50 via-white to-surface-100/50 dark:from-surface-950 dark:via-surface-900 dark:to-surface-950" />
      
      {/* Subtle noise texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col">
        <main className="flex flex-1 items-center justify-center px-4 sm:px-6 py-12 sm:py-20">
          <div className="mx-auto max-w-4xl text-center">
            {/* Hero Headline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            >
              <Typography
                variant="h1"
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight text-surface-900 dark:text-surface-50"
              >
                Estimate Together.
                <br />
                <span className="text-surface-600 dark:text-surface-400">Clearly.</span>
              </Typography>
            </motion.div>

            {/* Subtext */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1], delay: 0.1 }}
              className="mt-4 sm:mt-6"
            >
              <Typography
                variant="body"
                className="text-base sm:text-lg md:text-xl text-surface-600 dark:text-surface-400"
              >
                Real-time Scrum Poker for developers and QA teams.
              </Typography>
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1], delay: 0.2 }}
              className="mt-8 sm:mt-12 flex flex-col items-center justify-center gap-3 sm:gap-4 sm:flex-row"
            >
              <Button
                variant="primary"
                size="lg"
                onClick={handleCreateRoom}
                className="w-full sm:w-auto min-w-[160px]"
              >
                Create Room
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={handleJoinRoom}
                className="w-full sm:w-auto min-w-[160px]"
              >
                Join Room
              </Button>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
