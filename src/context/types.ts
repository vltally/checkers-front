import { Piece, Position, TeamType } from '../Constants';
import { SignalRService } from '../services/SignalrService';

export interface UserState {
    isLogin: boolean;
    username: string;
    accessToken: string;
    refreshToken: string;
}

export interface Action {
    type: string;
    payload: any;
}

export interface SignalRState {
    signalRService: SignalRService | null;
    onlineUsers: OnlineUser[];
    privateRoomRequest: boolean;
    privateRoomInitiated: { requested: string; accepted: string };
    message: Message;
    privateRoomMsg: PrivateRoomMessage;
}

export interface Message {
    from: string;
    to: string;
    content: string;
}

export interface OnlineUser {
    key: string;
    value: boolean;
}

export interface PrivateRoomMessage {
    from: string;
    to: string;
    gameState?: GameStatePayload; // Optional for full game state
    restart?: boolean; // Optional for restart requests
}

export interface GameStatePayload {
    pieces: Piece[];
    currentTeam: TeamType;
    isGameOver: boolean;
    currentMessage: string | null;
    fromPosition?: Position;
    toPosition?: Position;
    isPromoted?: boolean;
    winner?: string | null;
}

export interface GameStatus {
    isGameOver: boolean;
    message: string;
    winner: string | null;
}

export interface GameDetails {
    roomId: string;
    player1: string;
    player2: string;
    startTime: string;
    endTime?: string | null;
    winner?: string | null;
    moves? : Move[];
}

export interface Move {
    id: number;
    moveNumber: number;
    from: Position;
    to: Position;
    team: TeamType;
    pieceType: number;
    isPromoted: boolean;
    timestamp: string;
}
