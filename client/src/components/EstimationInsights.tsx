import { motion } from 'framer-motion';
import { type Vote, type UserRole } from '../stores/roomStore';
import { Card, CardHeader, CardContent, Typography } from './ui';
import { cn } from '../lib/utils';

interface EstimationInsightsProps {
  votes: Vote[];
}

interface Statistic {
  label: string;
  value: string;
  index: number;
}

function calculateAverage(votes: Vote[]): number {
  const numericVotes = votes
    .map((v) => {
      const num = parseFloat(v.value);
      return isNaN(num) ? null : num;
    })
    .filter((v): v is number => v !== null);

  if (numericVotes.length === 0) return 0;
  return numericVotes.reduce((sum, val) => sum + val, 0) / numericVotes.length;
}

function calculateMedian(votes: Vote[]): number {
  const numericVotes = votes
    .map((v) => {
      const num = parseFloat(v.value);
      return isNaN(num) ? null : num;
    })
    .filter((v): v is number => v !== null)
    .sort((a, b) => a - b);

  if (numericVotes.length === 0) return 0;
  const mid = Math.floor(numericVotes.length / 2);
  return numericVotes.length % 2 === 0
    ? (numericVotes[mid - 1] + numericVotes[mid]) / 2
    : numericVotes[mid];
}

function findOutliers(votes: Vote[]): Vote[] {
  const numericVotes = votes
    .map((v) => {
      const num = parseFloat(v.value);
      return isNaN(num) ? null : { vote: v, value: num };
    })
    .filter((v): v is { vote: Vote; value: number } => v !== null);

  if (numericVotes.length < 4) return [];

  const sortedValues = [...numericVotes].sort((a, b) => a.value - b.value);
  const q1Index = Math.floor(sortedValues.length * 0.25);
  const q3Index = Math.floor(sortedValues.length * 0.75);
  
  const q1 = sortedValues[q1Index]?.value ?? 0;
  const q3 = sortedValues[q3Index]?.value ?? 0;
  const iqr = q3 - q1;
  
  if (iqr === 0) return [];

  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  return numericVotes
    .filter((v) => v.value < lowerBound || v.value > upperBound)
    .map((v) => v.vote);
}

function groupVotesByRole(votes: Vote[]): Record<UserRole, Vote[]> {
  const grouped: Record<UserRole, Vote[]> = {
    developer: [],
    qa: [],
    'product-owner': [],
  };

  votes.forEach((vote) => {
    if (vote.userRole in grouped) {
      grouped[vote.userRole].push(vote);
    }
  });

  return grouped;
}

function calculateRoleAverage(votes: Vote[]): number {
  if (votes.length === 0) return 0;
  const numericVotes = votes
    .map((v) => {
      const num = parseFloat(v.value);
      return isNaN(num) ? null : num;
    })
    .filter((v): v is number => v !== null);

  if (numericVotes.length === 0) return 0;
  return numericVotes.reduce((sum, val) => sum + val, 0) / numericVotes.length;
}

export function EstimationInsights({ votes }: EstimationInsightsProps) {
  if (votes.length === 0) return null;

  const average = calculateAverage(votes);
  const median = calculateMedian(votes);
  const outliers = findOutliers(votes);
  const groupedByRole = groupVotesByRole(votes);

  const devVotes = groupedByRole.developer;
  const qaVotes = groupedByRole.qa;

  const statistics: Statistic[] = [
    {
      label: 'Average',
      value: average > 0 ? average.toFixed(1) : '—',
      index: 0,
    },
    {
      label: 'Median',
      value: median > 0 ? median.toFixed(1) : '—',
      index: 1,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <Typography variant="h5">Estimation Insights</Typography>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Statistics */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {statistics.map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: stat.index * 0.1 }}
              className="text-center p-3 sm:p-4 rounded-lg bg-surface-50 dark:bg-surface-800/50"
            >
              <Typography variant="small" className="text-surface-600 dark:text-surface-400 mb-1">
                {stat.label}
              </Typography>
              <Typography variant="h3" className="text-xl sm:text-2xl md:text-3xl font-semibold text-surface-900 dark:text-surface-50">
                {stat.value}
              </Typography>
            </motion.div>
          ))}
        </div>

        {/* Role-based Averages */}
        {(devVotes.length > 0 || qaVotes.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="pt-4 border-t border-surface-200 dark:border-surface-700"
          >
            <Typography variant="small" className="text-surface-600 dark:text-surface-400 mb-3 font-medium">
              Average by Role
            </Typography>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {devVotes.length > 0 && (
                <div className="p-3 sm:p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <Typography variant="small" className="text-blue-700 dark:text-blue-300 mb-1 font-medium">
                    Developers
                  </Typography>
                  <Typography variant="h4" className="text-xl sm:text-2xl md:text-3xl font-semibold text-blue-900 dark:text-blue-100">
                    {calculateRoleAverage(devVotes).toFixed(1)}
                  </Typography>
                  <Typography variant="caption" className="text-blue-600 dark:text-blue-400">
                    {devVotes.length} {devVotes.length === 1 ? 'vote' : 'votes'}
                  </Typography>
                </div>
              )}
              {qaVotes.length > 0 && (
                <div className="p-3 sm:p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                  <Typography variant="small" className="text-purple-700 dark:text-purple-300 mb-1 font-medium">
                    QA
                  </Typography>
                  <Typography variant="h4" className="text-xl sm:text-2xl md:text-3xl font-semibold text-purple-900 dark:text-purple-100">
                    {calculateRoleAverage(qaVotes).toFixed(1)}
                  </Typography>
                  <Typography variant="caption" className="text-purple-600 dark:text-purple-400">
                    {qaVotes.length} {qaVotes.length === 1 ? 'vote' : 'votes'}
                  </Typography>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Outliers */}
        {outliers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="pt-4 border-t border-surface-200 dark:border-surface-700"
          >
            <Typography variant="small" className="text-surface-600 dark:text-surface-400 mb-3 font-medium">
              Outliers
            </Typography>
            <div className="flex flex-wrap gap-2">
              {outliers.map((vote) => {
                const roleColors = {
                  developer: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
                  qa: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
                  'product-owner': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
                };

                return (
                  <motion.div
                    key={vote.userId}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + outliers.indexOf(vote) * 0.05 }}
                    className={cn(
                      'px-3 py-1.5 rounded-lg border text-sm',
                      roleColors[vote.userRole]
                    )}
                  >
                    <span className="font-medium">{vote.userName}</span>
                    <span className="mx-1.5">·</span>
                    <span className="font-semibold">{vote.value}</span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
