import React, { useContext, useState } from 'react';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import AuthContext from 'context/auth-context';

export default function Login() {

    const [emailError, setEmailError] = useState('');
    const [passError, setPassError] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const authCtx = useContext(AuthContext);

    const endpoint = 'https://d3pdj2cb.directus.app/graphql/system';

    function login() {
        fetch(endpoint, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: `
                mutation {
                    auth_login(
                        email: "${email}",
                        password: "${password}",
                        mode: cookie
                    ) {
                        access_token
                        refresh_token
                    }
                }
                `
            })
        })
        .then(async response => {
            const data = await response.json();
            setEmailError('');
            setPassError('');
            if(!response.ok) {
                const resError = (data && data.message) || response.status;
                return Promise.reject(resError);
            } else if (data.errors) {
                const errorMsgs = data.errors;
                for (let i = 0; i < errorMsgs.length; i++) {
                    let errorMsg = errorMsgs[i].message;
                    if(errorMsg.includes('Invalid user credentials')) {
                        setEmailError('Invalid username or password');
                        setPassError("Invalid username or password");
                    }
                    if(errorMsg.includes('email')) {
                        setEmailError('Please enter a valid email address');
                    }
                    if(errorMsg.includes('password')) {
                        setPassError("Please enter your password");
                    }
                }
                return false
            } else {
                authCtx.onLogin(data.data.auth_login.access_token)
                return true
            }
        })
        .catch(error => {
            console.error('catch', error);
        })
    }

    function handleEmail(event: React.ChangeEvent<HTMLInputElement>) {
        setEmail(event.target.value);
    }

    function handlePassword(event: React.ChangeEvent<HTMLInputElement>) {
        setPassword(event.target.value);
    }

    return (
        <Dialog open={authCtx.loginOpen} onClose={() => authCtx.onLoginOpen(false, false)} className="login-dialog">
            <DialogTitle>
                {authCtx.isNewUser ? 'Account Created!' : 'Login'}
            </DialogTitle>
            <DialogContent>
                <DialogContentText>
                    {authCtx.isNewUser && 'Please login below'}
                </DialogContentText>
                <TextField 
                    autoFocus
                    margin="dense"
                    value={email}
                    onChange={handleEmail} 
                    error={emailError !== ''}
                    helperText={emailError}
                    label="Email Address"
                    fullWidth
                    variant="standard"
                />
                <TextField 
                    margin="dense"
                    value={password}
                    onChange={handlePassword} 
                    error={passError !== ''}
                    helperText={passError}
                    label="Password"
                    type="password"
                    fullWidth
                    variant="standard"
                />
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={() => login()}
                    variant="contained"
                    color="primary"
                >Login</Button>
            </DialogActions>
        </Dialog>
    )
}