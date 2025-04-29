import React, { ReactNode, createContext, useEffect, useReducer } from 'react';
import { SignalRService } from '../services/SignalrService';
import { signalRConnectionReducer, userControlReducer } from './Reducer';
import { Action, SignalRState, UserState } from './types';

interface GlobalStateProps {
    children: ReactNode;
}

// const initialUserState: UserState = {
//     isLogin: false,
//     username: '',
//     accessToken: '',
//     refreshToken: '',
// };

// const getInitialUserState = (): UserState => {
//     const jwtToken = localStorage.getItem('jwtToken') || '';
//     const refreshToken = localStorage.getItem('refreshToken') || '';
//     const username = localStorage.getItem('username') || '';
//     return {
//         isLogin: !!jwtToken,
//         username,
//         accessToken: jwtToken,
//         refreshToken,
//     };
// };

const getInitialUserState = (): UserState => {
    const jwtToken = localStorage.getItem('jwtToken') || '';
    const refreshToken = localStorage.getItem('refreshToken') || '';
    const username = localStorage.getItem('username') || '';

    // If there's no token, user is not logged in.
    if (!jwtToken) {
        return {
            isLogin: false,
            username: '',
            accessToken: '',
            refreshToken: '',
        };
    }

    try {
        const base64Url = jwtToken.split('.')[1];
        const base64 = base64Url.replace('-', '+').replace('_', '/');
        const decoded = JSON.parse(atob(base64));
        // Check if token is expired
        if (decoded.exp * 1000 < Date.now()) {
            // Token expired, cleanup storage and return logged out state.
            localStorage.removeItem('jwtToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('username');
            return {
                isLogin: false,
                username: '',
                accessToken: '',
                refreshToken: '',
            };
        }
    } catch (error) {
        console.error('Failed to decode JWT:', error);
        return {
            isLogin: false,
            username: '',
            accessToken: '',
            refreshToken: '',
        };
    }

    return {
        isLogin: true,
        username,
        accessToken: jwtToken,
        refreshToken,
    };
};

const initialSignalRStatus: SignalRState = {
    signalRService: null,
    onlineUsers: [],
    privateRoomRequest: false,
    privateRoomInitiated: { requested: '', accepted: '' },
    message: { from: '', to: '', content: '' },
    privateRoomMsg: {
        from: '',
        to: '',
        gameState: undefined,
        restart: undefined,
    },
};

// eslint-disable-next-line react-refresh/only-export-components
export const GlobleContext = createContext<{
    userState: UserState;
    userDispatch: React.Dispatch<Action>;
    signalRState: SignalRState;
    signalRDispatch: React.Dispatch<Action>;
}>({
    //userState: initialUserState,
    userState: getInitialUserState(),
    userDispatch: () => undefined,
    signalRState: initialSignalRStatus,
    signalRDispatch: () => undefined,
});

const GlobleState: React.FC<GlobalStateProps> = ({ children }) => {
    const [userState, userDispatch] = useReducer(
        userControlReducer,
        //initialUserState
        getInitialUserState()
    );
    const [signalRState, signalRDispatch] = useReducer(
        signalRConnectionReducer,
        initialSignalRStatus
    );

    let refreshInterval: NodeJS.Timeout | null = null;

    useEffect(() => {
        if (userState.accessToken) {
            // Start SignalR connection only if it doesn't exist
            if (!signalRState.signalRService) {
                startSignalRConnection();
            }

            // Check token expiration every 12 seconds
            refreshInterval = setInterval(refreshToken, 12000);

            // Cleanup function
            return () => {
                if (refreshInterval) {
                    clearInterval(refreshInterval);
                    refreshInterval = null;
                }
            };
        }
    }, [userState.accessToken, signalRState.signalRService]);

    const startSignalRConnection = () => {
        const signalRService = new SignalRService(
            userState.username,
            signalRDispatch
        );
        signalRService.createUserRoomConnection();
        signalRDispatch({
            type: 'SET_SIGNALR_CONNECTION',
            payload: signalRService,
        });
    };

    const refreshToken = () => {
        const jwtToken = localStorage.getItem('jwtToken');
        if (jwtToken) {
            try {
                const decoded = decodeJwt(jwtToken);
                // Refresh if token expires in less than 10 minutes
                if (decoded.exp * 1000 < Date.now() + 600000) {
                    console.log('Refreshing token...');
                    fetchRefreshToken();
                }
            } catch (error) {
                console.error('Error decoding token:', error);
                handleLogout();
            }
        }
    };

    const handleLogout = () => {
        userDispatch({ type: 'LOGOUT', payload: null });
        signalRDispatch({
            type: 'REMOVE_SIGNALR_CONNECTION',
            payload: null,
        });
        if (refreshInterval) {
            clearInterval(refreshInterval);
            refreshInterval = null;
        }
    };

    const decodeJwt = (token: string) => {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace('-', '+').replace('_', '/');
        return JSON.parse(atob(base64));
    };

    const fetchRefreshToken = async () => {
        const jwtToken = localStorage.getItem('jwtToken');
        const refreshToken = localStorage.getItem('refreshToken');
        try {
            const result = await fetch(
                import.meta.env.VITE_BACKEND_API_URL + 'api/User/refresh',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        accessToken: jwtToken,
                        refreshToken: refreshToken,
                    }),
                }
            ).then((res) => res.json());

            if (result.accessToken) {
                localStorage.setItem('jwtToken', result.accessToken);
                localStorage.setItem('refreshToken', result.refreshToken);
                localStorage.setItem('username', userState.username);
                userDispatch({
                    type: 'LOGIN',
                    payload: {
                        isLogin: true,
                        username: userState.username,
                        accessToken: result.accessToken,
                        refreshToken: result.refreshToken,
                    },
                });
                console.log('Token refreshed successfully');
            } else {
                console.error('Failed to refresh token');
                handleLogout();
            }
        } catch (error) {
            console.error('Error refreshing token:', error);
            handleLogout();
        }
    };

    return (
        <GlobleContext.Provider
            value={{ userState, userDispatch, signalRState, signalRDispatch }}
        >
            {children}
        </GlobleContext.Provider>
    );
};

export default GlobleState;
