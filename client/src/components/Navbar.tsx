import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Typography, ThemeToggle } from './ui';

export function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-surface-200/50 dark:border-surface-800/50 bg-white/80 dark:bg-surface-900/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Link to="/" className="flex items-center gap-2">
            <Typography variant="h5" className="font-semibold">
              Scrum Poker Pro
            </Typography>
          </Link>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          <ThemeToggle />
        </motion.div>
      </nav>
    </header>
  );
}
