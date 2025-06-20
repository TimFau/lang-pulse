import React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';

interface StackedFlashCardProps {
  showAnswer: boolean;
  question: string;
  answer: string;
  onReveal?: () => void;
  onSpeak?: () => void;
}

const StackedFlashCard: React.FC<StackedFlashCardProps> = ({ showAnswer, question, answer, onReveal, onSpeak }) => {
  return (
    <div className="flash-card-outer-container">
      <Card
        className={showAnswer ? 'flash-card-container flash-card-stacked' : 'flash-card-container'}
        data-testid="flashcard"
      >
        {showAnswer ? (
          <CardContent data-testid="card-back" className="flash-card-stacked-content">
            <div className="stacked-question">
              <Typography color="textSecondary">Question</Typography>
              <h1 className="lang-from stacked-question-text" data-testid="card-question">
                {`"${question}"`}
              </h1>
            </div>
            <div className="stacked-divider" />
            <div className="stacked-answer">
              <Typography color="textSecondary">Answer</Typography>
              <h2 className="lang-to stacked-answer-text" data-testid="card-answer">
                {`"${answer}"`}
              </h2>
            </div>
          </CardContent>
        ) : (
          <CardContent onClick={onReveal} data-testid="card-front" className="card-front">
            <Typography color="textSecondary">Question</Typography>
            <div className="flash-card-question-row">
              <h1 className="lang-from" data-testid="card-question">
                {`"${question}"`}
              </h1>
              {onSpeak && (
                <Button
                  aria-label="Pronounce question"
                  onClick={(e) => { e.stopPropagation(); onSpeak(); }}
                  size="small"
                  className="pronounce-btn"
                >
                  <VolumeUpIcon />
                </Button>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default StackedFlashCard; 