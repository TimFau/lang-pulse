import { Card, CardContent, Typography, CardActions, IconButton, Chip, Link, Tooltip } from "@mui/material";
import { Delete as DeleteIcon, Language, SyncAlt } from '@mui/icons-material';
import { format } from 'date-fns';
import { useNavigate } from "react-router-dom";
import { SavedTermResponse } from "../types/SavedTerm";

type SavedTermCardProps = {
  term: SavedTermResponse['saved_terms'][0];
  onDelete: (id: string) => void;
};

const SavedTermCard = ({ term, onDelete }: SavedTermCardProps) => {
  const navigate = useNavigate();

  const handleDeckClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (term.source_deck) {
      navigate(`/deck?id=${term.source_deck.deck_id}&name=${term.source_deck.deck_name}`);
    }
  };

  return (
    <Card className="saved-term-card">
      <CardContent>
        <div className="card-content-top">
          <div className="term-info">
            <Language />
            <Typography variant="subtitle2" component="span">{term.language}</Typography>
            {term.sync_preference && (
              <Tooltip title={`Sync preference: ${term.sync_preference}`}>
                <Chip 
                  icon={<SyncAlt />} 
                  label={term.sync_preference.replace('_', ' ')} 
                  size="small" 
                  className="sync-chip"
                />
              </Tooltip>
            )}
          </div>
          <Typography variant="caption" className="term-date">
            {format(new Date(term.date_created), 'MMM d, yyyy')}
          </Typography>
        </div>

        <Typography variant="h6" component="h3" className="term-text">
          {term.term}
        </Typography>
        <Typography variant="body1" color="text.secondary" className="term-definition">
          {term.definition}
        </Typography>

        {term.source_deck ? (
          <Link 
            href="#" 
            onClick={handleDeckClick}
            className="source-deck-link"
            variant="body2"
          >
            From Deck: {term.source_deck.deck_name}
          </Link>
        ) : (
          <Typography variant="body2" color="text.secondary" className="source-info">
            Manually added
          </Typography>
        )}
      </CardContent>
      <CardActions>
        <IconButton
          aria-label="Delete term"
          onClick={() => onDelete(term.id)}
          size="small"
        >
          <DeleteIcon />
        </IconButton>
      </CardActions>
    </Card>
  );
};

export default SavedTermCard; 