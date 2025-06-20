import FavoriteIcon from '@mui/icons-material/Favorite';
import { Card, CardContent, Typography, CardActions, CardActionArea, IconButton, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button, Link, CircularProgress } from "@mui/material"
import { useNavigate } from "react-router";
import deckService from 'services/deckService';
import AuthContext from 'context/auth-context';
import ModalContext from 'context/modal-context';
import { useContext, useState } from "react";
import { FavoriteBorder, Language, Delete as DeleteIcon, Edit as EditIcon, ArrowForwardIos, SaveAlt } from '@mui/icons-material';
import { useTermBank } from '../hooks/useTermBank';
import { TermBankDialog } from './TermBankDialog';

type DeckCardProps = {
    item: any,
    from?: string
}

const DeckCard = (props: DeckCardProps) => {
    const deck = props.item.deck_relation ? props.item.deck_relation : props.item
    const { deck_name: deckName, deck_id: deckId } = deck
    const authCtx = useContext(AuthContext);
    const modalCtx = useContext(ModalContext);
    const userToken = authCtx.userToken || ''
    const savedDeckId = props.item.deck_relation ? props.item.id : null

    const navigate = useNavigate();
    const [confirmOpen, setConfirmOpen] = useState(false);

    // Safely determine the target language for the Word Bank.
    // Protect against null/undefined or non-string values for Language1/Language2.
    const lang1 = typeof deck.Language1 === 'string' ? deck.Language1 : '';
    const lang2 = typeof deck.Language2 === 'string' ? deck.Language2 : '';
    const isLanguage1English = lang1.toLowerCase().includes('english');
    const targetLanguage = isLanguage1English ? lang2 : lang1 || lang2;

    const {
        state: termBankState,
        saveAllTerms,
        isSaveDisabled,
        isDeckSynced,
        updateState: updateTermBankState
    } = useTermBank({
        deckId,
        language: targetLanguage,
        userToken: authCtx.userToken || '',
        userId: authCtx.userId
    });

    const handleClick = () => {
        if (savedDeckId) {
            const now = new Date().toISOString();
            deckService.updateSavedDeck(userToken, savedDeckId, now)
        }
        const from = props.from || '/';
        navigate(`/deck?name=${deckName}&id=${deckId}`, { state: { from } });
    }

    const handleEditDeck = () => {
        console.log('handleEditDeck', deck)
        modalCtx.setDeck({
            isPublic: deck.status === 'published',
            ...deck
        })
        modalCtx.setModeEdit()
        modalCtx.openModal()
    }

    const handleDeleteClick = () => {
        setConfirmOpen(true);
    };

    const handleConfirmDelete = () => {
        deckService.deleteDeck(userToken, deck.id, authCtx.userId);
        setConfirmOpen(false);
    };

    const handleCloseConfirm = () => {
        setConfirmOpen(false);
    };

    const handleSaveAllTerms = async () => {
        if (!authCtx.userToken) {
            authCtx.onLoginOpen(true, false);
            return;
        }

        if (isDeckSynced) {
            updateTermBankState({ error: "This deck has already been saved to your Word Bank" });
            return;
        }

        updateTermBankState({ showConfirm: true });
    };

    return (
        <>
            <Card 
                className={[
                    "deck-card", 
                    props.item.type === 'user' ? 'isUser' : 'notUser',
                    props.item.isOwnDeck ? 'is-own-deck' : ''
                ].join(' ')}
                data-testid={`deck-card-${deckName?.replace(/\s+/g, '-')}-${deck.id}`}
            >
                <CardActionArea onClick={() => handleClick()} data-testid={`deck-card-action-area`} className="deck-card__action-area-top">
                    <CardContent className="deck-card__action-area-top__content">
                        <div className="card-content-top">
                            <div className="deck-info">
                                <Language />
                                <Typography variant="subtitle2" component="span">{deck.Language2}</Typography>
                            </div>
                            <span className="deck-categories">
                                {props.item.isOwnDeck && <Chip label="My Deck" size="small" className="my-deck-chip" color="primary" />}
                                {deck.categories?.map((category: string) => <Chip label={category} key={category} size="small" />)}
                            </span>
                        </div>
                        <Typography gutterBottom variant="h5" component="h3" className="deck-name">
                            {deckName}
                        </Typography>
                    </CardContent>
                </CardActionArea>
                <CardActions disableSpacing className="deck-card__action-area-bottom">
                    {props.item.type !== 'user' ?
                    <>
                        {authCtx.userToken && (
                            <>
                                {props.item.isOwnDeck ? (
                                    <IconButton
                                        aria-label={`Edit "${deckName}"`}
                                        onClick={(e) => { e.stopPropagation(); handleEditDeck() }}
                                        size="large">
                                        <EditIcon />
                                    </IconButton>
                                ) : (
                                    <>
                                        <IconButton
                                            aria-label={props.item.isSaved ? "Remove from favorites" : "Add to favorites"}
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                if (authCtx.userToken) {
                                                    props.item.isSaved ? deckService.unsaveDeck(userToken, props.item.savedDeckId, authCtx.userId) : deckService.saveDeck(userToken, deck, authCtx.userId)
                                                } else {
                                                    console.log("User must be logged in to save decks");
                                                }
                                            }}
                                            size="large">
                                            {props.item.isSaved ? <FavoriteIcon /> : <FavoriteBorder />}
                                        </IconButton>
                                        <IconButton
                                            aria-label={isSaveDisabled ? "Terms already saved to Word Bank" : "Save all terms to Word Bank"}
                                            onClick={(e) => { e.stopPropagation(); handleSaveAllTerms(); }}
                                            size="large"
                                            disabled={isSaveDisabled}
                                            title={isSaveDisabled ? "Terms already saved to Word Bank" : "Save all terms to Word Bank"}
                                        >
                                            {termBankState.isSaving ? (
                                                <CircularProgress size={24} variant="determinate" value={termBankState.progress} />
                                            ) : (
                                                <SaveAlt />
                                            )}
                                        </IconButton>
                                    </>
                                )}
                            </>
                        )}
                    </>
                    :
                    <>
                        <IconButton
                            aria-label={`Delete "${deckName}"`}
                            onClick={handleDeleteClick}
                            size="large">
                            <DeleteIcon />
                        </IconButton>
                        <IconButton
                            aria-label={`Edit "${deckName}"`}
                            onClick={(e) => { e.stopPropagation(); handleEditDeck() }}
                            size="large">
                            <EditIcon />
                        </IconButton>
                        <IconButton
                            aria-label={isSaveDisabled ? "Terms already saved to Word Bank" : "Save all terms to Word Bank"}
                            onClick={(e) => { e.stopPropagation(); handleSaveAllTerms(); }}
                            size="large"
                            disabled={isSaveDisabled}
                            title={isSaveDisabled ? "Terms already saved to Word Bank" : "Save all terms to Word Bank"}
                        >
                            {termBankState.isSaving ? (
                                <CircularProgress size={24} variant="determinate" value={termBankState.progress} />
                            ) : (
                                <SaveAlt />
                            )}
                        </IconButton>
                    </>
                    }
                    <Link href="#" onClick={(e) => {e.preventDefault(); handleClick();}} className="try-now-link" data-testid="try-now-link">
                        {authCtx.userToken ? 'Study Now' : 'Try Now'} <ArrowForwardIos />
                    </Link>
                </CardActions>
            </Card>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={confirmOpen}
                onClose={handleCloseConfirm}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
                data-testid="delete-confirm-dialog"
            >
                <DialogTitle id="alert-dialog-title">
                    {`Delete Deck "${deckName}"?`}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Are you sure you want to delete this deck? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseConfirm} data-testid="cancel-delete-button">
                        Cancel
                    </Button>
                    <Button onClick={handleConfirmDelete} color="error" autoFocus data-testid="confirm-delete-button">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Save All Terms Dialog */}
            <TermBankDialog
                open={termBankState.showConfirm}
                onClose={() => updateTermBankState({ showConfirm: false })}
                onConfirm={saveAllTerms}
                deckName={deckName}
                isSaving={termBankState.isSaving}
                progress={termBankState.progress}
                error={termBankState.error}
            />
        </>
    );
}

export default DeckCard