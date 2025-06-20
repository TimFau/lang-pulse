import { useMutation, useLazyQuery } from '@apollo/client';
import { Button } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import type { GraphQLError } from 'graphql';
import { useContext, useState, useEffect } from 'react';
import AuthContext from '../context/auth-context';
import { SAVE_TERM, CHECK_TERM_SAVED, GET_DECK_BY_SHEET_ID } from '../queries';
import { SavedTermMetadata, createSavedTermInput } from '../types/SavedTerm';

interface SaveToBankProps {
  term: string;
  definition: string;
  language: string;
  className?: string;
  metadata?: Partial<SavedTermMetadata>;
  deckId?: string;
  deckName?: string;
  termIndex?: number;
}

export default function SaveToBank({ 
  term, 
  definition, 
  language, 
  className, 
  metadata,
  deckId,
  deckName,
  termIndex 
}: SaveToBankProps) {
  const authCtx = useContext(AuthContext);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  
  // Lazy query to check if term is already saved (requires valid auth token)
  const [checkTermSaved, {
    data: savedData,
    loading: checkingStatus
  }] = useLazyQuery(CHECK_TERM_SAVED, {
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
    context: {
      headers: {
        authorization: `Bearer ${authCtx.userToken}`
      }
    }
  });

  // Trigger check once token is available or when term/language change
  useEffect(() => {
    if (authCtx.userToken) {
      checkTermSaved({ variables: { term, language } });
    }
  }, [authCtx.userToken, term, language]);

  // Get deck UUID by sheet ID
  const [getDeckId, { loading: loadingDeckId }] = useLazyQuery(GET_DECK_BY_SHEET_ID, {
    context: {
      headers: {
        authorization: `Bearer ${authCtx.userToken}`
      }
    }
  });

  const [saveTerm] = useMutation(SAVE_TERM, {
    context: {
      headers: {
        authorization: `Bearer ${authCtx.userToken}`
      }
    },
    // Re-run saved check after successful save
    onCompleted: () => {
      checkTermSaved({ variables: { term, language } });
    }
  });

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!authCtx.userToken) {
      authCtx.onLoginOpen(true, false);
      return;
    }

    if (!authCtx.userId) {
      console.error("No user ID available");
      return;
    }

    if (!deckId) {
      console.error("No deck ID provided");
      return;
    }

    if (!deckName) {
      console.error("No deck name provided");
      return;
    }

    setIsSaving(true);
    setSaveError(false);

    try {
      // First, get the deck's UUID
      const { data: deckData } = await getDeckId({ variables: { deckId } });
      
      if (!deckData?.decks?.[0]?.id) {
        throw new Error('Could not find deck UUID');
      }

      const sourceDeckId = deckData.decks[0].id;

      // Save the term with the deck's UUID
      const today = new Date().toISOString().split('T')[0];

      await saveTerm({
        variables: {
          term,
          definition,
          language,
          source_deck_id: sourceDeckId,
          today,
          source_term_key: termIndex !== undefined ? `${termIndex + 1}` : undefined,
          source_definition: definition
        }
      });
      // Success state is handled by the isAlreadySaved check
    } catch (err: any) {
      // If token is invalid, trigger login dialog
      if (err.graphQLErrors?.some((e: GraphQLError) => 
        e.extensions?.code === 'INVALID_TOKEN' || 
        e.extensions?.code === 'INVALID_CREDENTIALS'
      )) {
        authCtx.onLogout();
        authCtx.onLoginOpen(true, false);
        return;
      }

      setSaveError(true);
      console.error("❌ Failed to save term:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const isAlreadySaved = savedData?.saved_terms?.length > 0;

  // Determine button state
  const getButtonProps = () => {
    if (isAlreadySaved) {
      return {
        startIcon: <CheckCircleIcon />,
        color: 'success' as const,
        children: 'Saved',
        sx: { 
          minWidth: 'auto',
          padding: '4px 8px',
          opacity: 0.7,
          '&:hover': {
            opacity: 0.7,
            cursor: 'default'
          }
        }
      };
    }

    if (saveError) {
      return {
        startIcon: <ErrorIcon />,
        color: 'error' as const,
        children: 'Retry',
        sx: { 
          minWidth: 'auto',
          padding: '4px 8px',
          opacity: 0.9,
          '&:hover': {
            opacity: 1
          }
        }
      };
    }

    return {
      startIcon: <SaveIcon />,
      color: 'secondary' as const,
      children: isSaving || loadingDeckId ? 'Saving...' : 'Save',
      sx: { 
        minWidth: 'auto',
        padding: '4px 8px',
        opacity: 0.7,
        '&:hover': {
          opacity: 1
        },
        '&.Mui-disabled': {
          opacity: 0.5
        }
      }
    };
  };

  const buttonProps = getButtonProps();

  return (
    <Button 
      onClick={handleSave}
      variant="text"
      disabled={(!authCtx.userToken || checkingStatus || isSaving || loadingDeckId || isAlreadySaved)}
      className={className}
      {...buttonProps}
    />
  );
} 