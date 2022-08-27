import React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

const flashCard = (props: any) => {
    return(
        <Card className="flash-card-container">
            {props.showAnswer ? (
                <CardContent>
                    <Typography color="textSecondary">Answer</Typography>
                    <h1 className="lang-to">"{props.langTo[props.randomNum]}"</h1>
                    <div className="btn-container flipped">
                        <Button
                            variant="contained"
                            color="secondary"
                            onClick={props.getCard}
                        >I got it wrong</Button >
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={props.archiveCard}
                        >I got it right</Button >
                    </div>
                </CardContent>
            ) : (
                <CardContent onClick={props.showAnswerFc}>
                    <Typography color="textSecondary">{props.children}</Typography>
                    <h1 className="lang-from">"{props.langFrom[props.randomNum]}"</h1>
                    <div className="btn-container">
                        <Button
                            variant="contained"
                            color="primary"
                        >See Answer</Button >
                    </div>
                </CardContent>
            )}
        </Card>
    )
}

export default flashCard;
