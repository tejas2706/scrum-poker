import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { socket } from '../lib/socket';
import { type FeatureHistoryEntry, type UserRole, useRoomStore } from '../stores/roomStore';
import { Card, CardHeader, CardContent, Typography, Button, LoadingSpinner, EmptyState, Input } from '../components/ui';
import { VotingCard } from '../components/VotingCard';
import { VoteResult } from '../components/VoteResult';
import { EstimationInsights } from '../components/EstimationInsights';
import { useConnectionStore } from '../stores/connectionStore';

const FIBONACCI_SEQUENCE = ['1', '2', '3', '5', '8', '13', '21', '34', '55', '89', '?'];
const SEQUENTIAL_SEQUENCE = ['0.5', '1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5', '?'];
type CardScale = 'fibonacci' | 'sequential';
const ROLE_ORDER: UserRole[] = ['developer', 'qa', 'product-owner'];
const ROLE_LABELS: Record<UserRole, string> = {
  developer: 'Developer',
  qa: 'QA',
  'product-owner': 'Product Owner',
};

function formatNumber(value: number | null) {
  if (value === null) return '—';
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function getCurrentFeatureSummary(featureHistory: FeatureHistoryEntry[], featureNumber: string | null) {
  if (!featureNumber) return undefined;

  for (let index = featureHistory.length - 1; index >= 0; index -= 1) {
    const entry = featureHistory[index];
    if (entry?.featureNumber === featureNumber) {
      return entry;
    }
  }

  return undefined;
}

function getVotingSequence(cardScale: CardScale) {
  return cardScale === 'sequential' ? SEQUENTIAL_SEQUENCE : FIBONACCI_SEQUENCE;
}

export function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { currentRoom, currentUser } = useRoomStore();
  const connectionStatus = useConnectionStore((s) => s.status);
  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const [cardScale, setCardScale] = useState<CardScale>('fibonacci');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [isRevoting, setIsRevoting] = useState(false);
  const [featureNumber, setFeatureNumber] = useState('');
  const [featureError, setFeatureError] = useState('');
  const [isStartingFeature, setIsStartingFeature] = useState(false);
  const [decisionInputs, setDecisionInputs] = useState<Record<UserRole, string>>({
    developer: '',
    qa: '',
    'product-owner': '',
  });
  const [decisionError, setDecisionError] = useState('');
  const [isSavingDecisions, setIsSavingDecisions] = useState(false);

  useEffect(() => {
    if (!currentRoom || !currentUser) {
      navigate('/');
      return;
    }

    // Find user's existing vote
    const userVote = currentRoom.votes.find((v) => v.userId === currentUser.id);
    if (userVote && !currentRoom.isRevealed) {
      setSelectedVote(userVote.value);
    } else {
      setSelectedVote(null);
    }
  }, [currentRoom, currentUser, navigate]);

  useEffect(() => {
    if (currentRoom?.currentFeatureNumber) {
      setFeatureNumber(currentRoom.currentFeatureNumber);
      setFeatureError('');
      return;
    }

    if (currentRoom?.isRevealed) {
      setFeatureNumber('');
    }
  }, [currentRoom?.currentFeatureNumber, currentRoom?.isRevealed]);

  const currentFeatureSummary = currentRoom
    ? getCurrentFeatureSummary(currentRoom.featureHistory, currentRoom.currentFeatureNumber)
    : undefined;

  useEffect(() => {
    if (!currentFeatureSummary) {
      setDecisionInputs({
        developer: '',
        qa: '',
        'product-owner': '',
      });
      setDecisionError('');
      return;
    }

    setDecisionInputs({
      developer: currentFeatureSummary.roleSummaries.developer.finalDecision?.toString() ?? '',
      qa: currentFeatureSummary.roleSummaries.qa.finalDecision?.toString() ?? '',
      'product-owner': currentFeatureSummary.roleSummaries['product-owner'].finalDecision?.toString() ?? '',
    });
    setDecisionError('');
  }, [currentFeatureSummary]);

  // Loading state
  if (!currentRoom || !currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <Typography variant="body" className="text-surface-600 dark:text-surface-400">
            Loading room...
          </Typography>
        </div>
      </div>
    );
  }

  // Connection check
  if (connectionStatus === 'disconnected') {
    return (
      <div className="mx-auto max-w-4xl px-6 pt-24 pb-20">
        <EmptyState
          title="Connection Lost"
          description="Please check your internet connection and try again."
          action={
            <Button variant="primary" onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          }
        />
      </div>
    );
  }

  const userVote = currentRoom.votes.find((v) => v.userId === currentUser.id);
  const hasVoted = !!userVote;
  const voteCount = currentRoom.votes.length;
  const totalUsers = currentRoom.users.length;
  const isCreator = currentRoom.createdBySocketId 
    ? currentUser.id === currentRoom.createdBySocketId 
    : currentRoom.createdBy === currentUser.name; // Fallback for backward compatibility
  const canReveal = isCreator && voteCount > 0 && !currentRoom.isRevealed;
  const canVoteAgain = isCreator && currentRoom.isRevealed;
  const hasActiveFeature = !!currentRoom.currentFeatureNumber;
  const canStartFeature = isCreator && (!hasActiveFeature || currentRoom.isRevealed);
  const votingSequence = getVotingSequence(cardScale);

  const handleVote = (value: string) => {
    if (currentRoom.isRevealed || isSubmitting || !hasActiveFeature) return;
    setSelectedVote(value);
  };

  const handleStartFeatureVoting = () => {
    if (!roomId || !canStartFeature || isStartingFeature) return;

    const trimmedFeatureNumber = featureNumber.trim();
    if (!trimmedFeatureNumber) {
      setFeatureError('Feature number is required to start voting.');
      return;
    }

    setIsStartingFeature(true);
    setFeatureError('');

    socket.emit(
      'start-feature-voting',
      { roomId, featureNumber: trimmedFeatureNumber },
      (response: { success: boolean; room?: any; error?: string }) => {
        setIsStartingFeature(false);
        if (!response.success) {
          setFeatureError(response.error || 'Failed to start feature voting');
        }
      }
    );
  };

  const handleSubmitVote = async () => {
    if (!selectedVote || !roomId || currentRoom.isRevealed || isSubmitting || !hasActiveFeature) return;

    setIsSubmitting(true);

    socket.emit(
      'submit-vote',
      { roomId, voteValue: selectedVote },
      (response: { success: boolean; room?: any; error?: string }) => {
        setIsSubmitting(false);
        if (!response.success) {
          console.error('Failed to submit vote:', response.error);
        }
      }
    );
  };

  const handleSaveDecisions = () => {
    if (!roomId || !isCreator || !currentRoom.isRevealed || !currentFeatureSummary || isSavingDecisions) {
      return;
    }

    const decisions = {} as Record<UserRole, number | null>;

    for (const role of ROLE_ORDER) {
      const rawValue = decisionInputs[role].trim();
      if (!rawValue) {
        decisions[role] = null;
        continue;
      }

      const parsed = Number(rawValue);
      if (!Number.isFinite(parsed)) {
        setDecisionError(`Enter a valid numeric decision for ${ROLE_LABELS[role]}.`);
        return;
      }

      decisions[role] = parsed;
    }

    setIsSavingDecisions(true);
    setDecisionError('');

    socket.emit(
      'save-feature-decisions',
      { roomId, decisions },
      (response: { success: boolean; room?: unknown; error?: string }) => {
        setIsSavingDecisions(false);
        if (!response.success) {
          setDecisionError(response.error || 'Failed to save final decisions');
        }
      }
    );
  };

  const handleReveal = async () => {
    if (!roomId || !canReveal || isRevealing) return;

    setIsRevealing(true);

    socket.emit(
      'reveal-votes',
      { roomId },
      (response: { success: boolean; room?: any; error?: string }) => {
        setIsRevealing(false);
        if (!response.success) {
          console.error('Failed to reveal votes:', response.error);
        }
      }
    );
  };

  const handleVoteAgain = async () => {
    if (!roomId || !canVoteAgain || isRevoting) return;

    setIsRevoting(true);

    socket.emit(
      'revote',
      { roomId },
      (response: { success: boolean; room?: any; error?: string }) => {
        setIsRevoting(false);
        if (!response.success) {
          console.error('Failed to start new vote:', response.error);
          // Show error to user
          alert(response.error || 'Failed to start new vote');
        }
      }
    );
  };

  // Keyboard navigation for voting cards
  useEffect(() => {
    if (currentRoom.isRevealed) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      
      const index = votingSequence.indexOf(selectedVote || '');
      if (e.key === 'ArrowRight' && index < votingSequence.length - 1) {
        handleVote(votingSequence[index + 1]);
      } else if (e.key === 'ArrowLeft' && index > 0) {
        handleVote(votingSequence[index - 1]);
      } else if (e.key === 'Enter' && selectedVote && !hasVoted) {
        handleSubmitVote();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVote, hasVoted, currentRoom.isRevealed, cardScale]);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-20 sm:pt-24 pb-12 sm:pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div className="min-w-0 flex-1">
            <Typography variant="h1" className="mb-1 text-2xl sm:text-3xl md:text-4xl break-words">
              {currentRoom.name}
            </Typography>
            <Typography variant="small" className="text-surface-500 dark:text-surface-400">
              Room ID: {roomId}
            </Typography>
            <Typography variant="small" className="mt-1 text-surface-600 dark:text-surface-300">
              {currentRoom.currentFeatureNumber
                ? `Current Feature: ${currentRoom.currentFeatureNumber}`
                : 'No feature is active yet'}
            </Typography>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
            {canReveal && (
              <Button variant="primary" onClick={handleReveal} disabled={isRevealing} className="w-full sm:w-auto">
                {isRevealing ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Revealing...
                  </>
                ) : (
                  'Reveal Votes'
                )}
              </Button>
            )}
            {canVoteAgain && (
              <Button variant="primary" onClick={handleVoteAgain} disabled={isRevoting} className="w-full sm:w-auto">
                {isRevoting ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Starting...
                  </>
                ) : (
                  'Vote Again'
                )}
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Voting Status */}
      {!currentRoom.isRevealed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="mb-6 sm:mb-8">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <Typography variant="h5" className="mb-1">
                      {hasActiveFeature ? 'Voting in Progress' : 'Start Voting'}
                    </Typography>
                    <Typography variant="small" className="text-surface-600 dark:text-surface-400">
                      {hasActiveFeature
                        ? `${voteCount} of ${totalUsers} participants have voted`
                        : isCreator
                          ? 'Enter a feature number to open the next voting round.'
                          : 'Waiting for the room owner to start voting for a feature.'}
                    </Typography>
                  </div>
                  {hasActiveFeature && (
                    <div className="text-left sm:text-right">
                      <div className="text-2xl font-semibold text-surface-900 dark:text-surface-50">
                        {voteCount}/{totalUsers}
                      </div>
                    </div>
                  )}
                </div>

                {canStartFeature && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input
                      label="Feature Number"
                      placeholder="e.g., FEAT-123"
                      value={featureNumber}
                      onChange={(e) => {
                        setFeatureNumber(e.target.value);
                        if (featureError) {
                          setFeatureError('');
                        }
                      }}
                      error={featureError}
                      disabled={isStartingFeature}
                    />
                    <div className="sm:self-end">
                      <Button
                        variant="primary"
                        onClick={handleStartFeatureVoting}
                        disabled={isStartingFeature}
                        className="w-full sm:w-auto"
                      >
                        {isStartingFeature ? (
                          <>
                            <LoadingSpinner size="sm" />
                            Starting...
                          </>
                        ) : hasActiveFeature ? (
                          'Start Next Feature'
                        ) : (
                          'Start Voting'
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Results View */}
      {currentRoom.isRevealed && (
        <>
          {currentRoom.votes.length > 0 ? (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="mb-6 sm:mb-8"
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Typography variant="h5">
                        Voting Results{currentRoom.currentFeatureNumber ? ` • ${currentRoom.currentFeatureNumber}` : ''}
                      </Typography>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleVoteAgain}
                        disabled={isRevoting}
                        className="text-sm"
                      >
                        {isRevoting ? (
                          <>
                            <LoadingSpinner size="sm" />
                            Starting...
                          </>
                        ) : (
                          'Vote Again'
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {currentRoom.votes.map((vote, index) => (
                      <VoteResult key={vote.userId} vote={vote} index={index} />
                    ))}
                  </CardContent>
                </Card>
              </motion.div>

              {isCreator && currentFeatureSummary && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="mb-6 sm:mb-8"
                >
                  <Card>
                    <CardHeader>
                      <Typography variant="h5">Final Decisions by Role</Typography>
                      <Typography variant="small" className="text-surface-600 dark:text-surface-400">
                        Save the final numeric estimate for each role for feature {currentFeatureSummary.featureNumber}.
                      </Typography>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {ROLE_ORDER.map((role) => (
                          <Input
                            key={role}
                            label={ROLE_LABELS[role]}
                            type="number"
                            step="any"
                            placeholder="e.g., 8"
                            value={decisionInputs[role]}
                            onChange={(e) => {
                              setDecisionInputs((prev) => ({ ...prev, [role]: e.target.value }));
                              if (decisionError) {
                                setDecisionError('');
                              }
                            }}
                            disabled={isSavingDecisions}
                          />
                        ))}
                      </div>
                      {decisionError && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
                          <Typography variant="small" className="text-red-600 dark:text-red-400">
                            {decisionError}
                          </Typography>
                        </div>
                      )}
                      <div className="flex justify-end">
                        <Button
                          variant="primary"
                          onClick={handleSaveDecisions}
                          disabled={isSavingDecisions}
                          className="w-full sm:w-auto"
                        >
                          {isSavingDecisions ? (
                            <>
                              <LoadingSpinner size="sm" />
                              Saving...
                            </>
                          ) : (
                            'Save Final Decisions'
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Estimation Insights */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="mb-6 sm:mb-8"
              >
                <EstimationInsights votes={currentRoom.votes} />
              </motion.div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="mb-6 sm:mb-8"
            >
              <EmptyState
                title="No Votes Yet"
                description="Votes will appear here once participants submit their estimates."
              />
            </motion.div>
          )}
        </>
      )}

      {/* Voting Cards */}
      {!currentRoom.isRevealed && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Typography variant="h5">Select Your Estimate</Typography>
                <div className="rounded-lg border border-surface-200 p-1 dark:border-surface-700">
                  <div className="flex items-center gap-1">
                    {(['fibonacci', 'sequential'] as CardScale[]).map((scale) => (
                      <button
                        key={scale}
                        type="button"
                        onClick={() => setCardScale(scale)}
                        className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                          cardScale === scale
                            ? 'bg-surface-900 text-surface-50 dark:bg-surface-50 dark:text-surface-900'
                            : 'text-surface-600 dark:text-surface-300'
                        }`}
                      >
                        {scale === 'fibonacci' ? 'Fibonacci' : 'Sequential'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {currentRoom.currentFeatureNumber && (
                <Typography variant="small" className="mt-1 text-surface-600 dark:text-surface-400">
                  Voting for feature {currentRoom.currentFeatureNumber}
                </Typography>
              )}
              {hasVoted && (
                <Typography variant="small" className="text-emerald-600 dark:text-emerald-400 mt-1">
                  ✓ You voted: {userVote?.value}
                </Typography>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3 sm:gap-4 justify-center py-4">
                {votingSequence.map((value) => (
                  <VotingCard
                    key={value}
                    value={value}
                    isSelected={selectedVote === value}
                    onClick={() => handleVote(value)}
                    disabled={isSubmitting || !hasActiveFeature}
                  />
                ))}
              </div>
              {selectedVote && !hasVoted && (
                <div className="mt-6 flex justify-center">
                  <Button
                    variant="primary"
                    onClick={handleSubmitVote}
                    disabled={isSubmitting}
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    {isSubmitting ? (
                      <>
                        <LoadingSpinner size="sm" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Vote'
                    )}
                  </Button>
                </div>
              )}
              {hasVoted && (
                <div className="mt-4 text-center">
                  <Typography variant="small" className="text-surface-500 dark:text-surface-400">
                    Waiting for others to vote...
                  </Typography>
                </div>
              )}
              {!hasActiveFeature && (
                <div className="mt-4 text-center">
                  <Typography variant="small" className="text-surface-500 dark:text-surface-400">
                    Voting cards unlock once the room owner starts a feature.
                  </Typography>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Participants List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-8"
      >
        <Card>
          <CardHeader>
            <Typography variant="h5">Participants ({currentRoom.users.length})</Typography>
          </CardHeader>
          <CardContent>
            {currentRoom.users.length === 0 ? (
              <EmptyState
                title="No Participants"
                description="Participants will appear here once they join the room."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {currentRoom.users.map((user) => {
                const hasVoted = currentRoom.votes.some((v) => v.userId === user.id);
                const roleColors = {
                  developer: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
                  qa: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
                  'product-owner': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
                };

                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-surface-50 dark:bg-surface-800/50"
                  >
                    <div className="flex-1">
                      <Typography variant="body" className="font-medium">
                        {user.name}
                        {user.id === currentUser.id && ' (You)'}
                      </Typography>
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                          roleColors[user.role]
                        }`}
                      >
                        {user.role === 'product-owner'
                          ? 'Product Owner'
                          : user.role === 'qa'
                            ? 'QA'
                            : 'Developer'}
                      </span>
                    </div>
                    {!currentRoom.isRevealed && (
                      <div className="ml-2">
                        {hasVoted ? (
                          <span className="text-emerald-600 dark:text-emerald-400">✓</span>
                        ) : (
                          <span className="text-surface-400 dark:text-surface-600">○</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="mt-8"
      >
          <Card>
            <CardHeader>
              <Typography variant="h5">Session Features</Typography>
            </CardHeader>
          <CardContent>
            {currentRoom.featureHistory.length === 0 ? (
              <EmptyState
                title="No Features Yet"
                description="Started feature numbers will be listed here throughout the session."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-200 text-left dark:border-surface-700">
                      <th className="px-3 py-2 font-medium text-surface-600 dark:text-surface-300">Feature</th>
                      <th className="px-3 py-2 font-medium text-surface-600 dark:text-surface-300">Avg (All Users)</th>
                      <th className="px-3 py-2 font-medium text-surface-600 dark:text-surface-300">Dev Mode</th>
                      <th className="px-3 py-2 font-medium text-surface-600 dark:text-surface-300">Dev Decision</th>
                      <th className="px-3 py-2 font-medium text-surface-600 dark:text-surface-300">QA Mode</th>
                      <th className="px-3 py-2 font-medium text-surface-600 dark:text-surface-300">QA Decision</th>
                      <th className="px-3 py-2 font-medium text-surface-600 dark:text-surface-300">PO Mode</th>
                      <th className="px-3 py-2 font-medium text-surface-600 dark:text-surface-300">PO Decision</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRoom.featureHistory.map((feature) => (
                      <tr
                        key={`${feature.featureNumber}-${feature.overallAverage ?? 'pending'}`}
                        className="border-b border-surface-100 dark:border-surface-800"
                      >
                        <td className="px-3 py-3 font-medium text-surface-900 dark:text-surface-50">
                          {feature.featureNumber}
                        </td>
                        <td className="px-3 py-3 text-surface-700 dark:text-surface-300">
                          {formatNumber(feature.overallAverage)}
                        </td>
                        <td className="px-3 py-3 text-surface-700 dark:text-surface-300">
                          {feature.roleSummaries.developer.mode ?? '—'}
                        </td>
                        <td className="px-3 py-3 text-surface-700 dark:text-surface-300">
                          {formatNumber(feature.roleSummaries.developer.finalDecision)}
                        </td>
                        <td className="px-3 py-3 text-surface-700 dark:text-surface-300">
                          {feature.roleSummaries.qa.mode ?? '—'}
                        </td>
                        <td className="px-3 py-3 text-surface-700 dark:text-surface-300">
                          {formatNumber(feature.roleSummaries.qa.finalDecision)}
                        </td>
                        <td className="px-3 py-3 text-surface-700 dark:text-surface-300">
                          {feature.roleSummaries['product-owner'].mode ?? '—'}
                        </td>
                        <td className="px-3 py-3 text-surface-700 dark:text-surface-300">
                          {formatNumber(feature.roleSummaries['product-owner'].finalDecision)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
