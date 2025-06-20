import { useEffect, useState, useContext } from 'react';
import { useAppSelector, useAppDispatch } from 'hooks';
import UserDecks from '../../components/Authenticated/UserDecks';
import AuthContext from 'context/auth-context';
import userService from 'services/userService';
import DeckCardSkeleton from '../../components/DeckCardSkeleton';
import ColdStartMessage from '../../components/ColdStartMessage';
import FetchErrorMessage from '../../components/Unauthenticated/FetchErrorMessage';
import { COLD_START_TIMEOUT } from '../../utils/constants';
import { Button } from '@mui/material';
import { Link } from 'react-router-dom';

export default function Account() {

    const authCtx = useContext(AuthContext);
    const userName = useAppSelector((state) => state.userName)
    const [userId, setUserId] = useState('');
    const [isReady, setIsReady] = useState(false);
    const [isColdStart, setIsColdStart] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const dispatch = useAppDispatch();

    function getAccountDetails() {
        setError(null);
        userService.getAccountDetails(authCtx.userToken)
        .then(async response => {
            const data = await response;
            dispatch({type: 'user/setUserName', value: data.users_me.first_name})
            setUserId(data.users_me.id)
            setIsReady(true)
            return true
        })
        .catch(error => {
            if (error.graphQLErrors) {
                const hasInvalidTokenError = error.graphQLErrors.some(
                    (err: any) => err.extensions?.code === 'INVALID_TOKEN'
                );
                if (hasInvalidTokenError) {
                    authCtx.onLogout();
                    authCtx.onLoginOpen(true, false);
                    setError("Your session has expired. Please log in again.");
                    return;
                }
            }
            // Handle token expiration (401 Unauthorized or 403 Forbidden)
            if (error && error.networkError && (error.networkError.statusCode === 401 || error.networkError.statusCode === 403)) {
                authCtx.onLogout();
                authCtx.onLoginOpen(true, false);
                return;
            }
            setError(error.message || 'An unexpected error occurred.');
            console.error('catch', error);
        })
    }

    useEffect(function () {
        getAccountDetails();
    }, []);

    useEffect(() => {
        if (!isReady) {
            const timer = setTimeout(() => setIsColdStart(true), COLD_START_TIMEOUT);
            return () => clearTimeout(timer);
        } else {
            setIsColdStart(false);
            return undefined;
        }
    }, [isReady]);

    // Scroll to top on mount (fixes mobile reload issue)
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);
    
    return (
        <div className="container page-container">
            <div className="wrapper" id="account">
                {error ? (
                    <div className="decks-container">
                        <FetchErrorMessage error={error} onRetry={getAccountDetails} title="Error loading account details" />
                    </div>
                ) : isReady ? 
                <>
                    <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                        <Button component={Link} to="/review" variant="contained" color="primary" size="large">
                            Start a Review Session
                        </Button>
                    </div>
                    <UserDecks userId={userId} userName={userName} />
                </>
                :
                isColdStart ? (
                    <ColdStartMessage maxSeconds={30} />
                ) : (
                    <div className="decks-container">
                        {Array.from({ length: 3 }).map((_, idx) => (
                            <DeckCardSkeleton key={idx} />
                        ))}
                    </div>
                )
                }
            </div>
        </div>
    )
}