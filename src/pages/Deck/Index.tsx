import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import sheetService from 'services/sheetService';

import ProgressBar from './components/ProgressBar';
import FlashCard from './components/Modes/FlashCard';
import WordBank from './components/Modes/WordBank';
import Keyboard from './components/Modes/Keyboard';
import DeckDialog from './components/DeckOptionsModal';
import BottomButtonsContainer from './components/BottomButtonsContainer';
import DeckFinishedModal from './components/DeckFinishedModal';
import ResumeProgressDialog from './components/ResumeProgressDialog';

import { keyboardModeHandleChangeEvent, handleSubmitType } from './types';
import { wordBankHelper, generateRandomNum } from './helpers';


type RootState = {
    deckDialogOpen: boolean,
    setDeckDialogClose: () => void,
    setDeckDialogOpen: () => void,
    setDeckStartedFalse: () => void,
    setDeckStartedTrue: () => void,
    deckStarted: boolean
}

export type langArray = string[];

function Deck(props: RootState) {
    const queryParams = new URLSearchParams(window.location.search)
    const name: string = queryParams.get("name") || ''
    const id: string = queryParams.get("id") || ''
    const navigate = useNavigate()
    const location = useLocation();
    const from = location.state?.from;

    // State Functions
    const [langArr, setLangArr] = useState<{ langOneArr: langArray, langTwoArr: langArray }>({
        langOneArr: [],
        langTwoArr: []
    });
    const [langOneArrInit, setLangOneArrInit] = useState<langArray>([]);
    const [langTwoArrInit, setLangTwoArrInit] = useState<langArray>([]);
    const [language1, setLanguage1] = useState<string | undefined>('');
    const [language2, setLanguage2] = useState<string | undefined>('');
    const [langFrom, setLangFrom] = useState<langArray>([]);
    const [langTo, setLangTo] = useState<langArray>([]);
    const [translationInputValue, setTranslationInputValue] = useState<string>('');
    const [wordBank, setWordBank] = useState<langArray>([]);
    const [translateMode, setTranslateMode] = useState<string>('1to2');
    const [inputMode, setInputMode] = useState<string>('Flashcard');
    const [showAnswer, setShowAnswer] = useState<boolean>(false);
    const [success, setSuccess] = useState<boolean>(false);
    const [incorrect, setIncorrect] = useState<boolean>(false);
    const [currentDeckName, setCurrentDeckName] = useState<string>('');
    const [deckDataLoaded, setDeckDataLoaded] = useState<boolean>(false);
    const [randomNum, setRandomNum] = useState<number>(0);
    const [initialCount, setInitialCount] = useState<number>(0);
    const [checkAccents] = useState<boolean>(false);
    const [autoSpeak, setAutoSpeak] = useState(() => {
        const stored = sessionStorage.getItem('autoSpeakFlashcard');
        return stored === null ? false : stored === 'true';
    });
    const { setDeckDialogOpen, setDeckDialogClose } = props;

    // Progress persistence state
    const [showResumeDialog, setShowResumeDialog] = useState(false);
    const [pendingLoadProgress, setPendingLoadProgress] = useState<any>(null);

    /**
     * Selects a new flashcard from the deck. 
     * If the previous card was answered correctly
     * (`success` is true), it removes that card from the deck. 
     * It then selects a new random card from the remaining deck.
     */
    const resetCard = () => {
        setSuccess(false);
        setIncorrect(false);
        setTranslationInputValue('');
        setShowAnswer(false);
    }
    const handleSetNextCard = (newLangOneArr: langArray, newLangTwoArr: langArray, newRandomNum: number) => {
        resetCard();
        setRandomNum(newRandomNum);
        setLangFrom(translateMode === '1to2' ? newLangOneArr : newLangTwoArr);
        setLangTo(translateMode === '1to2' ? newLangTwoArr : newLangOneArr);
        setLangArr({
            langOneArr: newLangOneArr,
            langTwoArr: newLangTwoArr
        })
        handleWordBank(newLangOneArr, newLangTwoArr, newRandomNum);
    }
    const getCard = (currentLangOneArr?: langArray, currentLangTwoArr?: langArray) => {
        let newLangOneArr = Array.isArray(currentLangOneArr) ? [...currentLangOneArr] : [...langArr.langOneArr];
        let newLangTwoArr = Array.isArray(currentLangTwoArr) ? [...currentLangTwoArr] : [...langArr.langTwoArr];
        if (success) {
            newLangOneArr.splice(randomNum, 1);
            newLangTwoArr.splice(randomNum, 1);
        };
        const newRandomNum = generateRandomNum(newLangOneArr);
        handleSetNextCard(newLangOneArr, newLangTwoArr, newRandomNum);
    }

    /**
     * Removes the current flashcard from the deck. 
     * It updates the state with the new arrays (minus the removed card) 
     * and then selects a new random card from the remaining deck.
     */
    function archiveCard() {
        let newLangOneArr = [...langArr.langOneArr];
        let newLangTwoArr = [...langArr.langTwoArr];
        newLangOneArr.splice(randomNum, 1);
        newLangTwoArr.splice(randomNum, 1);
        setLangArr({
            langOneArr: newLangOneArr,
            langTwoArr: newLangTwoArr
        });
        getCard(newLangOneArr, newLangTwoArr);
    }

    /**
     * Generates a new word bank for the current flashcard.
     * It uses the `wordBankHelper` function to generate a list of potential translations,
     * which includes the correct translation and some incorrect ones.
     */
    function handleWordBank(currentLangOneArr: langArray, currentLangTwoArr: langArray, currentRandomNum: number) {
        const translationsArr = translateMode === '1to2' ? currentLangTwoArr : currentLangOneArr;
        const translationsArrInit =  translateMode === '1to2' ? langTwoArrInit : langOneArrInit;
        setWordBank(wordBankHelper(translationsArr, translationsArrInit, currentRandomNum));
    }

    /**
     * Checks if the user's input matches the correct translation.
     * It normalizes both the user's input and the correct answer to lowercase, trims any whitespace, 
     * and removes any periods. If the `checkAccents` state is false, it also removes any accents.
     * If the user's input matches the correct answer, it sets `success` to true; otherwise, it sets `incorrect` to true.
     * It also sets `showAnswer` to true to reveal the correct answer.
     */
    function handleSubmit(event: handleSubmitType) {
        event.preventDefault();
        var inputValueRegex = translationInputValue.toLowerCase().trim().replace(/\./g,'');
        var correctAnswerRegex = langTo[randomNum].toLowerCase().trim().replace(/\./g,'');
        if(checkAccents === false) {
            inputValueRegex = inputValueRegex.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            correctAnswerRegex = correctAnswerRegex.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        }
        if (inputValueRegex === correctAnswerRegex) {
            setSuccess(true);
        }  else {
            setIncorrect(true);
        }
        setShowAnswer(true);
    }

    // State Handlers
    function keyboardModeHandleChange(event: keyboardModeHandleChangeEvent) {
        setTranslationInputValue(event.currentTarget.value)
    }
    function switchInput(value: string) {
        if(value === 'Wordbank'){
            setInputMode('Wordbank');
        } else if(value === 'Keyboard' && inputMode !== 'Keyboard'){
            setInputMode('Keyboard');
        } else if(value === 'Flashcard' && inputMode !== 'Flashcard'){
            setInputMode('Flashcard');
        }
    }
    function setTranslationMode1() {
        setTranslateMode('1to2');
        setLangFrom(langArr.langOneArr);
        setLangTo(langArr.langTwoArr);
    }
    function setTranslationMode2() {
        setTranslateMode('2to1');
        setLangFrom(langArr.langTwoArr);
        setLangTo(langArr.langOneArr);
    }
    function goToDeckSelector() {
        props.setDeckStartedFalse();
        props.setDeckDialogClose();
        if (from === '/decks') {
            navigate('/decks');
        } else {
            navigate('/');
        }
    }
    function startDeck() {
        getCard();
        switchInput(inputMode)
        props.setDeckStartedTrue();
        props.setDeckDialogClose();
    }
    function showAnswerFc() {
        setShowAnswer(true);
    }

    const getLangCode = (lang: string | undefined) => {
        const langMap: { [key: string]: string } = {
            spanish: 'es-ES',
            french: 'fr-FR',
            german: 'de-DE',
            italian: 'it-IT',
            portuguese: 'pt-PT',
            russian: 'ru-RU',
            japanese: 'ja-JP',
            chinese: 'zh-CN',
        };
        if (lang) {
            const lower = lang.toLowerCase();
            for (const key in langMap) {
                if (lower.includes(key)) return langMap[key];
            }
        }
        return 'en-US';
    }

    // Helper to determine language code for langFrom
    const getLangFromLangCode = () => {
        const lang = translateMode === '1to2' ? language1 : language2;
        return getLangCode(lang);
    };

    const getLangToLangCode = () => {
        const lang = translateMode === '1to2' ? language2 : language1;
        return getLangCode(lang);
    }

    useEffect(() => {
        function getDeckData(value: string) {
            sheetService.getSheet(value).then( data => {
                let newLangOneArr: langArray = [];
                let newLangTwoArr: langArray = [];
                if (data.length > 0) {
                    data.forEach(function(item: { Language1: string; Language2: string; }){
                        newLangOneArr.push(item.Language1);
                        newLangTwoArr.push(item.Language2);
                    })
                } else if (data.error) {
                    console.log('Deck Load Error: ' + data.error)
                } else {
                    console.log('Data is empty; Deck not loaded')
                }
                setLanguage1(newLangOneArr.shift());
                setLanguage2(newLangTwoArr.shift());
                setInitialCount(newLangOneArr.length);
                setRandomNum(generateRandomNum(newLangOneArr));
                setDeckDataLoaded(true);
                setLangOneArrInit(newLangOneArr);
                setLangTwoArrInit(newLangTwoArr);
                resetCard();
                setLangArr({
                    langOneArr: newLangOneArr,
                    langTwoArr: newLangTwoArr
                })
                setDeckDialogOpen();
            })
            .catch((error) => {
                console.error('Error', error);
                setDeckDialogClose();
            })
        }
        function deckOptions(deckName: string, deckId: string) {
            setDeckDataLoaded(false);
            getDeckData(deckId)
            setCurrentDeckName(deckName);
            setDeckDialogOpen();
        }
        deckOptions(name, id)
    }, [name, id, setDeckDialogClose, setDeckDialogOpen])

    useEffect(() => {
        sessionStorage.setItem('autoSpeakFlashcard', autoSpeak.toString());
    }, [autoSpeak]);

    // Only show DeckFinishedModal when deck is loaded, options modal is closed, and deck is finished
    const showDeckFinishedModal = !props.deckDialogOpen && deckDataLoaded && langArr.langOneArr.length === 0;

    // Save progress to localStorage (should be migrated to DB for cross-device persistence)
    function saveProgress() {
        const progress = {
            langArr,
            langOneArrInit,
            langTwoArrInit,
            language1,
            language2,
            langFrom,
            langTo,
            translationInputValue,
            wordBank,
            translateMode,
            inputMode,
            showAnswer,
            success,
            incorrect,
            currentDeckName,
            deckDataLoaded,
            randomNum,
            initialCount,
            autoSpeak,
            name,
            id
        };
        localStorage.setItem('deckProgress', JSON.stringify(progress));
    }
    // Load progress from localStorage
    function loadProgress(progress: any) {
        setLangArr(progress.langArr);
        setLangOneArrInit(progress.langOneArrInit);
        setLangTwoArrInit(progress.langTwoArrInit);
        setLanguage1(progress.language1);
        setLanguage2(progress.language2);
        setLangFrom(progress.langFrom);
        setLangTo(progress.langTo);
        setTranslationInputValue(progress.translationInputValue);
        setWordBank(progress.wordBank);
        setTranslateMode(progress.translateMode);
        setInputMode(progress.inputMode);
        setShowAnswer(progress.showAnswer);
        setSuccess(progress.success);
        setIncorrect(progress.incorrect);
        setCurrentDeckName(progress.currentDeckName);
        setDeckDataLoaded(progress.deckDataLoaded);
        setRandomNum(progress.randomNum);
        setInitialCount(progress.initialCount);
        setAutoSpeak(progress.autoSpeak);
        // Don't set name/id, those come from URL
        props.setDeckStartedTrue();
        props.setDeckDialogClose();
    }
    // Clear progress from localStorage
    function clearProgress() {
        localStorage.removeItem('deckProgress');
    }
    // Save progress on relevant state changes
    useEffect(() => {
        if (deckDataLoaded && langArr.langOneArr.length > 0) {
            saveProgress();
        }
    }, [langArr, langOneArrInit, langTwoArrInit, language1, language2, langFrom, langTo, translationInputValue, wordBank, translateMode, inputMode, showAnswer, success, incorrect, currentDeckName, deckDataLoaded, randomNum, initialCount, autoSpeak]);
    // On mount, check for saved progress
    useEffect(() => {
        const saved = localStorage.getItem('deckProgress');
        if (saved) {
            const progress = JSON.parse(saved);
            // Only prompt if deck matches
            if (progress.id === id && progress.name === name && progress.langArr.langOneArr.length > 0) {
                setPendingLoadProgress(progress);
                setShowResumeDialog(true);
            }
        }
    }, [id, name]);
    // When deck is finished, clear progress
    useEffect(() => {
        if (langArr.langOneArr.length === 0 && deckDataLoaded) {
            clearProgress();
        }
    }, [langArr.langOneArr.length, deckDataLoaded]);

    return (
        <div className={"container page-container " + inputMode}>
            <div className="wrapper">
                {/* Only show main deck UI if modal is NOT open */}
                {!props.deckDialogOpen && (
                    <>
                        <ProgressBar 
                            langOneArrLength={langArr.langOneArr.length}
                            initialCount={initialCount}
                        />
                        <form onSubmit={handleSubmit}  id="mainApp">
                            {/* Auto-speak toggle */}
                            <div className="auto-speak-toggle">
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <label className="switch">
                                        <input
                                            type="checkbox"
                                            checked={autoSpeak}
                                            onChange={e => setAutoSpeak(e.target.checked)}
                                            aria-checked={autoSpeak}
                                            aria-label="Automatically speak each question"
                                        />
                                        <span className="slider" />
                                    </label>
                                    <span>Automatically speak each question</span>
                                </div>
                            </div>
                            {inputMode === 'Flashcard' &&
                                <FlashCard 
                                showAnswerFc={showAnswerFc}
                                showAnswer={showAnswer}
                                getCard={getCard}
                                archiveCard={archiveCard}
                                langTo={langTo}
                                langFrom={langFrom}
                                randomNum={randomNum}
                                autoSpeak={autoSpeak}
                                langFromLangCode={getLangFromLangCode()}
                                langToLangCode={getLangToLangCode()}
                                deckId={id}
                                deckName={name}
                                >
                                    {translateMode === '1to2' ? `${language1} to ${language2}` : `${language2} to ${language1}`}
                                </FlashCard>
                            }
                            {inputMode === 'Keyboard' &&
                                <Keyboard 
                                    langTo={langTo}
                                    langFrom={langFrom}
                                    randomNum={randomNum}
                                    translationInputValue={translationInputValue}
                                    keyboardModeHandleChange={(event: keyboardModeHandleChangeEvent) => keyboardModeHandleChange(event)}
                                >
                                    Translate to <span>{translateMode === "1to2" ? language2 : language1}</span>
                                </Keyboard>
                            }
                            {inputMode === 'Wordbank' &&
                                <WordBank 
                                    langTo={langTo}
                                    langFrom={langFrom}
                                    randomNum={randomNum}
                                    wordBank={wordBank}
                                    keyboardModeHandleChange={(event: keyboardModeHandleChangeEvent) => keyboardModeHandleChange(event)}
                                >
                                    Translate to <span>{translateMode === "1to2" ? language2 : language1}</span>
                                </WordBank>
                            }
                        </form>
                        {inputMode !== 'Flashcard' &&
                            <BottomButtonsContainer 
                                handleSubmit={handleSubmit}
                                translateMode={translateMode}
                                getCard={() => getCard()}
                                randomNum={randomNum}
                                langOneArr={langArr.langOneArr}
                                langTwoArr={langArr.langTwoArr}
                                success={success}
                                incorrect={incorrect}
                                showAnswer={showAnswer}
                            />
                        }
                    </>
                )}
                <DeckDialog
                    inputMode={inputMode}
                    currentDeckName={currentDeckName}
                    setInputMode={setInputMode}
                    setDialogClosed={props.setDeckDialogClose}
                    deckDialogOpen={props.deckDialogOpen}
                    setTranslationMode1={setTranslationMode1}
                    setTranslationMode2={setTranslationMode2}
                    translateMode={translateMode}
                    language1={language1}
                    language2={language2}
                    startDeck={startDeck}
                    deckDataLoaded={deckDataLoaded}
                    from={from}
                />
                {showDeckFinishedModal && (
                    <DeckFinishedModal
                        langOneArr={langArr.langOneArr}
                        goToDeckSelector={() => goToDeckSelector()}
                    />
                )}
                {/* Resume Progress Modal */}
                {showResumeDialog && (
                    <ResumeProgressDialog
                        open={showResumeDialog}
                        onResume={() => {
                            if (pendingLoadProgress) loadProgress(pendingLoadProgress);
                            setShowResumeDialog(false);
                        }}
                        onStartOver={() => {
                            clearProgress();
                            setShowResumeDialog(false);
                        }}
                    />
                )}
            </div>
        </div>
    )
}

export default Deck