import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { SAVE_MULTIPLE_TERMS, CHECK_SYNCED_DECK, CREATE_SYNCED_DECK, GET_SAVED_TERM_KEYS } from '../queries';
import { getLanguageCode } from '../utils/languageUtils';
import { SavedTermInput, DeckTerm, SyncedDeckResponse, SavedTermResponse } from '../types/SavedTerm';
import sheetService from '../services/sheetService';

interface UseTermBankProps {
  deckId: string;
  language: string;
  userToken: string;
  userId: string;
}

interface TermBankState {
  isSaving: boolean;
  progress: number;
  error: string | null;
  showConfirm: boolean;
}

export const useTermBank = ({ deckId, language, userToken, userId }: UseTermBankProps) => {
  const [state, setState] = useState<TermBankState>({
    isSaving: false,
    progress: 0,
    error: null,
    showConfirm: false
  });

  const { data: syncedDeckData } = useQuery<SyncedDeckResponse>(CHECK_SYNCED_DECK, {
    variables: { deckId },
    context: { headers: { authorization: `Bearer ${userToken}` } },
    skip: !userToken
  });

  const [saveMultipleTerms] = useMutation(SAVE_MULTIPLE_TERMS, {
    context: { headers: { authorization: `Bearer ${userToken}` } }
  });

  const [createSyncedDeck] = useMutation(CREATE_SYNCED_DECK, {
    context: { headers: { authorization: `Bearer ${userToken}` } }
  });

  const { data: savedTermKeysData, loading: savedTermsLoading, refetch: refetchSavedTermKeys } = 
    useQuery<SavedTermResponse>(GET_SAVED_TERM_KEYS, {
      variables: { deckId },
      context: { headers: { authorization: `Bearer ${userToken}` } },
      fetchPolicy: 'network-only',
      skip: !userToken
    });

  const updateState = (updates: Partial<TermBankState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const normalize = (term: string, lang: string) => 
    `${term.trim().toLowerCase()}||${lang.trim().toLowerCase()}`;

  const prepareTermsForSaving = async (sheetData: DeckTerm[], existingTerms: SavedTermResponse['saved_terms']) => {
    const existingKeys = new Set(existingTerms.map(t => t.source_term_key));
    const existingTermLang = new Set(
      existingTerms.map(t => normalize(t.term, t.language))
    );

    const termLanguageCode = getLanguageCode(language);
    // TODO: Update when we add support for more source languages
    const sourceLanguageCode = 'en';

    const isTermAlreadySaved = (item: DeckTerm) => {
      const term1 = item.Language1;
      const term2 = item.Language2;

      // Check for term in both directions
      const forward = normalize(term1, termLanguageCode);
      const backward = normalize(term2, termLanguageCode);
      
      const forward_alt = normalize(term1, sourceLanguageCode);
      const backward_alt = normalize(term2, sourceLanguageCode);

      return existingTermLang.has(forward) || 
        existingTermLang.has(backward) ||
        existingTermLang.has(forward_alt) ||
        existingTermLang.has(backward_alt);
    }

    return sheetData
      .filter(item => item.Language1 && item.Language2)
      .map((item, index): SavedTermInput | null => {
        const sourceKey = `${index + 1}`;
        if (existingKeys.has(sourceKey) || isTermAlreadySaved(item)) {
          return null;
        }
        return {
          term: item.Language1,
          definition: item.Language2,
          language: termLanguageCode,
          status: 'published',
          source_deck: {
            deck_name: deckId,
            deck_id: deckId,
            Language1: 'en',
            Language2: termLanguageCode,
            status: 'published'
          },
          source_term_key: sourceKey,
          source_definition: item.Language2
        };
      })
      .filter(Boolean) as SavedTermInput[];
  };

  const saveAllTerms = async () => {
    updateState({ isSaving: true, progress: 0, error: null });

    try {
      const refetchResult = await refetchSavedTermKeys();
      const currentSavedTerms = refetchResult.data?.saved_terms || savedTermKeysData?.saved_terms || [];

      const sheetData = await sheetService.getSheet(deckId);
      if (!sheetData?.length) {
        throw new Error('Failed to load deck terms');
      }

      const terms = await prepareTermsForSaving(sheetData, currentSavedTerms);

      if (!terms.length) {
        updateState({ 
          error: 'All terms from this deck are already saved to your Word Bank',
          isSaving: false 
        });
        return;
      }

      updateState({ progress: 40 });

      await saveMultipleTerms({ variables: { items: terms } });
      updateState({ progress: 80 });

      await createSyncedDeck({
        variables: {
          deckId,
          language: getLanguageCode(language),
          termCount: terms.length
        }
      });

      updateState({ progress: 100 });
      await new Promise(resolve => setTimeout(resolve, 2000));
      updateState({ showConfirm: false, isSaving: false });

    } catch (err: any) {
      updateState({ 
        error: err.message || 'Failed to save terms',
        progress: 0,
        isSaving: false
      });
    }
  };

  return {
    state,
    updateState,
    saveAllTerms,
    isSaveDisabled: state.isSaving || savedTermsLoading || Boolean(syncedDeckData?.synced_decks?.length),
    isDeckSynced: Boolean(syncedDeckData?.synced_decks?.length)
  };
}; 