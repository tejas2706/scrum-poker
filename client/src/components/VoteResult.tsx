import { motion } from 'framer-motion';
import { type Vote } from '../stores/roomStore';
import { Card, Typography } from './ui';
import { cn } from '../lib/utils';

interface VoteResultProps {
  vote: Vote;
  index: number;
}

export function VoteResult({ vote, index }: VoteResultProps) {
  const roleColors = {
    developer: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    qa: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    'product-owner': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, rotateY: -90 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      transition={{
        duration: 0.3,
        delay: index * 0.1,
        ease: [0.4, 0, 0.2, 1],
      }}
      style={{ perspective: '1000px' }}
    >
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Typography variant="h6" className="font-semibold">
              {vote.userName}
            </Typography>
            <span
              className={cn(
                'inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium',
                roleColors[vote.userRole]
              )}
            >
              {vote.userRole === 'product-owner'
                ? 'Product Owner'
                : vote.userRole === 'qa'
                  ? 'QA'
                  : 'Developer'}
            </span>
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.1 + 0.2, type: 'spring', stiffness: 200 }}
            className="ml-4 text-3xl font-bold text-surface-900 dark:text-surface-50"
          >
            {vote.value}
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
}
