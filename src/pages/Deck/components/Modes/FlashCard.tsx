import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import { useEffect } from 'react';
import SaveToBank from '../../../../components/SaveToBank';

interface FlashCardProps {
    showAnswer: boolean,
    langFrom: Array<string>,
    langTo: Array<string>,
    randomNum: number,
    getCard: () => void,
    archiveCard: (event: React.UIEvent<HTMLElement>) => void,
    showAnswerFc: (event: React.UIEvent<HTMLElement>) => void,
    children: React.ReactNode,
    autoSpeak: boolean,
    langFromLangCode: string,
    langToLangCode: string,
    deckId: string,
    deckName: string,
}

const speak = (text: string, lang: string = 'en') => {
    if ('speechSynthesis' in window && text) {
        const synth = window.speechSynthesis;
        synth.cancel();
        const processedText = text.replace(/_{2,}/g, 'blank');
        const voices = synth.getVoices();
        // Try to find a voice that matches the lang exactly
        const voice = voices.find(v => v.lang === lang)
            // Or fallback to any voice that starts with the language (e.g., 'es')
            || voices.find(v => v.lang.startsWith(lang.split('-')[0]));
        const utterance = new window.SpeechSynthesisUtterance(processedText);
        utterance.lang = lang;
        if (voice) {
            utterance.voice = voice;
        }
        synth.speak(utterance);
    }
};

const flashCard = (props: FlashCardProps) => {
    useEffect(() => {
        if (!props.showAnswer && props.autoSpeak) {
            speak(props.langFrom[props.randomNum], props.langFromLangCode);
        }
        // Only run when question changes or autoSpeak toggles
    }, [props.langFrom, props.randomNum, props.showAnswer, props.autoSpeak, props.langFromLangCode]);

    const isLangFromEnglish = props.langFromLangCode.startsWith('en');
    const term = isLangFromEnglish ? props.langFrom[props.randomNum] : props.langTo[props.randomNum];
    const definition = isLangFromEnglish ? props.langTo[props.randomNum] : props.langFrom[props.randomNum];
    const targetLanguageCode = isLangFromEnglish ? props.langToLangCode : props.langFromLangCode;

    return(
        <div className="flash-card-outer-container">
            <Card className={props.showAnswer ? "flash-card-container flash-card-stacked" : "flash-card-container"} data-testid="flashcard">
                {props.showAnswer ? (
                    <CardContent data-testid="card-back" className="flash-card-stacked-content">
                        <div className="save-button-container">
                            <SaveToBank 
                                term={term}
                                definition={definition}
                                language={targetLanguageCode.split('-')[0]}
                                className="save-button"
                                deckId={props.deckId}
                                deckName={props.deckName}
                                termIndex={props.randomNum}
                            />
                        </div>
                        <div className="stacked-question">
                            <Typography color="textSecondary">Question</Typography>
                            <h1 className="lang-from stacked-question-text" data-testid="card-question">
                                "{props.langFrom[props.randomNum]}"
                            </h1>
                        </div>
                        <div className="stacked-divider" />
                        <div className="stacked-answer">
                            <Typography color="textSecondary">Answer</Typography>
                            <h2 className="lang-to stacked-answer-text" data-testid="card-answer">
                                "{props.langTo[props.randomNum]}"
                            </h2>
                        </div>
                    </CardContent>
                ) : (
                    <CardContent onClick={props.showAnswerFc} data-testid="card-front" className="card-front">
                        <div className="save-button-container">
                            <SaveToBank 
                                term={term}
                                definition={definition}
                                language={targetLanguageCode.split('-')[0]}
                                className="save-button"
                                deckId={props.deckId}
                                deckName={props.deckName}
                                termIndex={props.randomNum}
                            />
                        </div>
                        <Typography color="textSecondary">{props.children}</Typography>
                        <div className="flash-card-question-row">
                            <h1 className="lang-from" data-testid="card-question">
                                "{props.langFrom[props.randomNum]}"
                            </h1>
                            <Button
                                aria-label="Pronounce question"
                                onClick={e => { e.stopPropagation(); speak(props.langFrom[props.randomNum], props.langFromLangCode); }}
                                size="small"
                                className="pronounce-btn"
                            >
                                <VolumeUpIcon />
                            </Button>
                        </div>
                    </CardContent>
                )}
            </Card>
            {props.showAnswer ? (
                <div className="btn-container flipped flash-card-button-row">
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={props.getCard}
                        data-testid="wrong-answer-button"
                    >I got it wrong</Button >
                    <Button
                        variant="contained"
                        color="success"
                        onClick={props.archiveCard}
                        data-testid="correct-answer-button"
                    >I got it right</Button >
                </div>
            ) : (
                <div className="btn-container flash-card-button-row">
                    <Button
                        variant="contained"
                        color="primary"
                        data-testid="show-answer-button"
                        onClick={props.showAnswerFc}
                    >See Answer</Button >
                </div>
            )}
        </div>
    )
}

export default flashCard;
