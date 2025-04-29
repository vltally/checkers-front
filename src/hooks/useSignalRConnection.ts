import { useCallback, useContext } from 'react';
import { GlobleContext } from '../context/Context';
import {
    GameStatePayload,
    Message,
    PrivateRoomMessage,
} from '../context/types';

export const useSignalRConnection = () => {
    const {
        userState: { username },
        signalRState: { signalRService, privateRoomInitiated, privateRoomMsg },
    } = useContext(GlobleContext);

    const sendGameState = useCallback(
        (gameState: GameStatePayload, opponentUsername: string) => {
            if (!signalRService || !opponentUsername || !username) {
                console.error(
                    'SignalR service or user details not available for sending state.'
                );
                return;
            }

            const message: PrivateRoomMessage = {
                from: username,
                to: opponentUsername,
                gameState: gameState,
            };

            signalRService.sendPrivateRooMessage(message);
        },
        [signalRService, username]
    );

    const requestRestart = useCallback(
        (opponentUsername: string) => {
            if (!signalRService || !opponentUsername || !username) return;

            const message: PrivateRoomMessage = {
                from: username,
                to: opponentUsername,
                restart: true,
            };

            signalRService.sendPrivateRooMessage(message);
        },
        [signalRService, username]
    );

    const closeRoom = useCallback(
        (opponentUsername: string) => {
            if (!signalRService || !opponentUsername || !username) return;

            const message: Message = {
                from: username,
                to: opponentUsername,
                content: 'ClosePrivateRoom',
            };

            signalRService.closePrivateRoom(message);
        },
        [signalRService, username]
    );

    const getOpponentUsername = useCallback(() => {
        if (!privateRoomInitiated) return null;
        return privateRoomInitiated.requested === username
            ? privateRoomInitiated.accepted
            : privateRoomInitiated.requested;
    }, [privateRoomInitiated, username]);

    return {
        username,
        privateRoomInitiated,
        privateRoomMsg,
        sendGameState,
        requestRestart,
        closeRoom,
        getOpponentUsername,
    };
};
