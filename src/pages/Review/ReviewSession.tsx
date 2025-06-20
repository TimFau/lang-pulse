import React, { useState, useEffect } from 'react';
import { useAuth } from 'hooks/useAuth';
import { useReviewSession } from './hooks/useReviewSession';
import { useAppDispatch, useAppSelector } from 'hooks';
import {
  Button,
  Select,
  MenuItem,
  CircularProgress,
  Box,
  Typography,
} from '@mui/material';
import StackedFlashCard from '../../components/StackedFlashCard';
import AutoSpeakToggle from '../../components/AutoSpeakToggle';
import ProgressBar from '../Deck/components/ProgressBar';
import { speak } from '../../utils/speech';

const ReviewSession = () => {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const deckStarted = useAppSelector(state => state.deckStarted);
  const {
    sessionState,
    options,
    terms,
    currentTerm,
    currentCardIndex,
    loading,
    error,
    dueCount,
    nextSessionInDays,
    startSession,
    restartSession,
    recordResponse,
    updateOptions,
  } = useReviewSession({ userId: user?.id || '' });

  const [isFlipped, setIsFlipped] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState<boolean>(() => {
    const stored = sessionStorage.getItem('autoSpeakReview');
    return stored ? stored === 'true' : false;
  });

  // Persist autoSpeak preference for session
  useEffect(() => {
    sessionStorage.setItem('autoSpeakReview', autoSpeak.toString());
  }, [autoSpeak]);

  // Sync global deckStarted flag to hide nav and show exit button during review
  useEffect(() => {
    dispatch({ type: 'deck/setDeckStarted', value: sessionState === 'active' });
    // Cleanup on unmount
    return () => {
      dispatch({ type: 'deck/setDeckStarted', value: false });
    };
  }, [sessionState, dispatch]);

  // When the global flag is cleared (e.g., via Exit Review), reset the local session
  useEffect(() => {
    if (!deckStarted && sessionState === 'active') {
      restartSession();
      setIsFlipped(false);
    }
  }, [deckStarted]);

  // Determine what appears on each side of the flashcard based on the selected review direction
  const getCardTexts = () => {
    if (!currentTerm) return { front: '', back: '' };
    return options.direction === 'term_to_definition'
      ? { front: currentTerm.term, back: currentTerm.definition }
      : { front: currentTerm.definition, back: currentTerm.term };
  };

  // Auto-speak question when card loads
  useEffect(() => {
    if (!currentTerm || isFlipped || !autoSpeak) return;
    const { front } = getCardTexts();
    const langCode = options.direction === 'term_to_definition' ? currentTerm.language : 'en';
    speak(front, langCode);
  }, [currentTerm?.id, isFlipped, autoSpeak, options.direction]);

  const handleReveal = () => {
    if (sessionState === 'active') {
      setIsFlipped(!isFlipped);
    }
  };

  const handleSpeak = () => {
    if (!currentTerm) return;
    const { front } = getCardTexts();
    const langCode = options.direction === 'term_to_definition' ? currentTerm.language : 'en';
    speak(front, langCode);
  };

  const handleResponse = (rating: 'hard' | 'okay' | 'easy') => {
    if (currentTerm) {
      recordResponse(currentTerm.id, rating);
      setIsFlipped(false);
    }
  };

  // Build content based on session state
  let content: React.ReactNode = null;

  if (!user) {
    content = <Typography>Please log in to start a review session.</Typography>;
  } else if (sessionState === 'configuring') {
    content = (
      <Box className="review-config">
        <Typography variant="h4">Setup Review</Typography>
        <Typography variant="subtitle1">{dueCount} terms Due Today</Typography>
        <Select value={options.language} onChange={(e) => updateOptions({ language: e.target.value })}>
          <MenuItem value="all">All Languages</MenuItem>
          {/* TODO: Populate with user's languages */}
        </Select>
        <Select
          value={options.cardCount}
          onChange={(e) => updateOptions({ cardCount: Number(e.target.value) })}
        >
          <MenuItem value={10}>10 Cards</MenuItem>
          <MenuItem value={25}>25 Cards</MenuItem>
          <MenuItem value={50}>50 Cards</MenuItem>
        </Select>
        <Select
          value={options.direction}
          onChange={(e) =>
            updateOptions({ direction: e.target.value as 'term_to_definition' | 'definition_to_term' })
          }
        >
          <MenuItem value="term_to_definition">English → Translation</MenuItem>
          <MenuItem value="definition_to_term">Translation → English</MenuItem>
        </Select>
        <Button variant="contained" onClick={startSession} disabled={dueCount === 0}>
          Start Review
        </Button>
        {dueCount === 0 && (
          <Typography variant="body2" sx={{ mt: 2 }}>
            No terms are due right now. You can come back later or enable extra review.
          </Typography>
        )}
      </Box>
    );
  } else if (loading) {
    content = <CircularProgress />;
  } else if (error) {
    content = <Typography color="error">Error: {error.message}</Typography>;
  } else if (sessionState === 'finished') {
    content = (
      <Box className="review-summary">
        <Typography variant="h4">Session Complete!</Typography>
        <Typography>You reviewed {terms.length} terms.</Typography>
        {nextSessionInDays !== null && (
          <Typography sx={{ mt: 1 }}>
            Next session available in {nextSessionInDays} {nextSessionInDays === 1 ? 'day' : 'days'}.
          </Typography>
        )}
        <Button variant="contained" onClick={restartSession}>
          Review Again
        </Button>
      </Box>
    );
  } else if (sessionState === 'active' && currentTerm) {
    const { front, back } = getCardTexts();
    content = (
      <>
        <ProgressBar initialCount={terms.length} langOneArrLength={terms.length - currentCardIndex} />
        <form id="mainApp">
          <AutoSpeakToggle value={autoSpeak} onChange={setAutoSpeak} />
          <StackedFlashCard
            showAnswer={isFlipped}
            question={front}
            answer={back}
            onReveal={handleReveal}
            onSpeak={handleSpeak}
          />
          <Box className="btn-container flash-card-button-row">
            {isFlipped ? (
              <>
                <Button variant="contained" color="primary" onClick={() => handleResponse('hard')}>
                  Hard
                </Button>
                <Button variant="contained" color="warning" onClick={() => handleResponse('okay')}>
                  Okay
                </Button>
                <Button variant="contained" color="success" onClick={() => handleResponse('easy')}>
                  Easy
                </Button>
              </>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={handleReveal}
                data-testid="show-answer-button"
              >
                See Answer
              </Button>
            )}
          </Box>
        </form>
      </>
    );
  } else {
    content = (
      <Box className="review-empty">
        <Typography variant="h5">No terms found for this review session.</Typography>
        <Typography>Try adjusting your filters or adding more words to your Word Bank.</Typography>
        <Button variant="contained" onClick={restartSession}>
          Back to Setup
        </Button>
      </Box>
    );
  }

  return (
    <div className="container page-container Flashcard">
      <div className="wrapper">{content}</div>
    </div>
  );
};

export default ReviewSession; 