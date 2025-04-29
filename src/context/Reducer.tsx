import {
    Action,
    Message,
    SignalRService,
    SignalRState,
    UserState,
} from './types';

export const userControlReducer = (
    state: UserState,
    action: Action
): UserState => {
    if (!('type' in action)) return state;

    switch (action.type) {
        case 'LOGIN':
        case 'REFRESH_TOKEN':
            if (!action.payload || !('username' in action.payload))
                return state;
            return {
                ...state,
                isLogin: true,
                username: action.payload.username,
                accessToken: action.payload.accessToken,
                refreshToken: action.payload.refreshToken,
            };
        case 'LOGOUT':
            localStorage.removeItem('jwtToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('username');
            return {
                ...state,
                isLogin: false,
                username: '',
                accessToken: '',
                refreshToken: '',
            };
        default:
            return state;
    }
};

export const signalRConnectionReducer = (
    state: SignalRState,
    action: Action
): SignalRState => {
    if (!('type' in action)) return state;

    switch (action.type) {
        case 'SET_SIGNALR_CONNECTION':
            if (
                !action.payload ||
                !('createUserRoomConnection' in action.payload)
            )
                return state;
            return {
                ...state,
                signalRService: action.payload as SignalRService,
            };
        case 'REMOVE_SIGNALR_CONNECTION':
            return {
                ...state,
                signalRService: null,
                privateRoomRequest: false,
                privateRoomInitiated: { requested: '', accepted: '' },
                privateRoomMsg: {
                    from: '',
                    to: '',
                    gameState: undefined,
                    restart: undefined,
                },
            };
        case 'UPDATE_ONLINE_USERS':
            if (!action.payload || !('onlineUsers' in action.payload))
                return state;
            return { ...state, onlineUsers: action.payload.onlineUsers };
        case 'REQUEST_PRIVATE_ROOM':
        case 'REJECT_PRIVATE_ROOM_REQUEST':
            if (!action.payload || !('from' in action.payload)) return state;
            return {
                ...state,
                privateRoomRequest: action.type === 'REQUEST_PRIVATE_ROOM',
                message: action.payload as Message,
            };
        case 'OPEN_PRIVATE_ROOM': {
            if (!action.payload || !('from' in action.payload)) return state;
            const message = action.payload as Message;
            return {
                ...state,
                privateRoomInitiated: {
                    requested: message.from,
                    accepted: message.to,
                },
            };
        }
        case 'CLOSE_PRIVATE_ROOM':
            if (!action.payload || !('from' in action.payload)) return state;
            return {
                ...state,
                privateRoomRequest: false,
                privateRoomInitiated: { requested: '', accepted: '' },
                message: action.payload as Message,
                winner: (action.payload as Message).content,
                privateRoomMsg: {
                    from: '',
                    to: '',
                    gameState: undefined,
                    restart: undefined,
                },
            };
        case 'PRIVATE_ROOM_MESSAGE':
            if (!action.payload || !('from' in action.payload)) return state;
            return { ...state, privateRoomMsg: action.payload };
        default:
            return state;
    }
};
