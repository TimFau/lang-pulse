import { useState, useMemo, useContext } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  GET_ALL_DUE_SAVED_TERMS_FOR_REVIEW,
  GET_DUE_SAVED_TERMS_FOR_REVIEW_BY_LANGUAGE,
  UPDATE_SRS_DATA,
} from 'queries';
import { Term } from 'types/Term';
import AuthContext from 'context/auth-context';
import { applySm2 } from '../../../utils/srs';

interface UseReviewSessionProps {
  userId: string;
}

interface ReviewOptions {
  language: string; // 'all' or a specific language code like 'es'
  cardCount: number;
  direction: 'term_to_definition' | 'definition_to_term';
}

export const useReviewSession = ({ userId }: UseReviewSessionProps) => {
  const { userToken } = useContext(AuthContext);
  const [sessionState, setSessionState] = useState<'configuring' | 'active' | 'finished'>('configuring');
  const [options, setOptions] = useState<ReviewOptions>({
    language: 'all',
    cardCount: 25,
    direction: 'term_to_definition',
  });
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, 'hard' | 'okay' | 'easy'>>({});
  const [nextIntervals, setNextIntervals] = useState<number[]>([]);
  const [nextSessionInDays, setNextSessionInDays] = useState<number | null>(null);

  const { query, variables } = useMemo(() => {
    const baseVariables = {
      limit: options.cardCount,
    };
    const today = new Date().toISOString().split('T')[0];
    if (options.language === 'all') {
      return {
        query: GET_ALL_DUE_SAVED_TERMS_FOR_REVIEW,
        variables: { ...baseVariables, today },
      };
    }
    return {
      query: GET_DUE_SAVED_TERMS_FOR_REVIEW_BY_LANGUAGE,
      variables: { ...baseVariables, language: options.language, today },
    };
  }, [options]);

  const { data, loading, error, refetch } = useQuery(query, {
    variables,
    skip: false,
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
    context: {
      headers: {
        authorization: userToken ? `Bearer ${userToken}` : '',
      },
    },
  });

  const [updateSrsData] = useMutation(UPDATE_SRS_DATA, {
    context: {
      headers: {
        authorization: userToken ? `Bearer ${userToken}` : '',
      },
    },
  });

  const terms: Term[] = data?.saved_terms || [];
  const currentTerm = terms?.[currentCardIndex];

  const dueCount = terms.length;

  const startSession = () => {
    setCurrentCardIndex(0);
    setResponses({});
    setNextIntervals([]);
    setNextSessionInDays(null);
    setSessionState('active');
    refetch();
  };

  const endSession = () => {
    if (nextIntervals.length) {
      const min = Math.min(...nextIntervals);
      setNextSessionInDays(min);
    }
    setSessionState('finished');
  };

  const restartSession = () => {
    setSessionState('configuring');
  };

  const recordResponse = async (termId: string, rating: 'hard' | 'okay' | 'easy') => {
    setResponses(prev => ({ ...prev, [termId]: rating }));

    const qualityMap: Record<'hard' | 'okay' | 'easy', 0 | 3 | 5> = {
      hard: 0,
      okay: 3,
      easy: 5,
    };

    const term = terms.find(t => t.id === termId);
    const sm2Result = applySm2({
      interval: term?.interval ?? 0,
      easeFactor: term?.ease_factor ?? 2.5,
      repetition: term?.repetition ?? 0,
      rating: qualityMap[rating],
    });

    setNextIntervals(prev => [...prev, sm2Result.interval]);

    try {
      await updateSrsData({
        variables: {
          termId,
          data: {
            next_review_at: sm2Result.dueDate,
            interval: sm2Result.interval,
            ease_factor: sm2Result.easeFactor,
            repetition: sm2Result.repetition,
          },
        },
      });
    } catch (err) {
      console.error('Failed to update SRS data', err);
    }

    if (currentCardIndex < terms.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    } else {
      endSession();
    }
  };

  const updateOptions = (newOptions: Partial<ReviewOptions>) => {
    setOptions(prev => ({ ...prev, ...newOptions }));
  };

  return {
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
  };
}; 