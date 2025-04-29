import { useCallback, useState } from 'react';
import { Piece, Position, TeamType, initialBoardState } from '../Constants';
import { GameStatePayload } from '../context/types';

interface GameState {
    pieces: Piece[];
    currentTeam: TeamType;
    isGameOver: boolean;
    currentMessage: string | null;
    showRestartButton: boolean;
    gameWinner: string | null;
    mandatoryCaptures: Position[];
    isMultipleCapture: boolean;
    lastMovedPiece: Piece | null;
}

export const useGameState = (initialTeam: TeamType = TeamType.OUR) => {
    const [gameState, setGameState] = useState<GameState>({
        pieces: initialBoardState,
        currentTeam: initialTeam,
        isGameOver: false,
        currentMessage: null,
        showRestartButton: false,
        gameWinner: null,
        mandatoryCaptures: [],
        isMultipleCapture: false,
        lastMovedPiece: null,
    });

    const resetGame = useCallback(() => {
        setGameState({
            pieces: initialBoardState,
            currentTeam: initialTeam,
            isGameOver: false,
            currentMessage: null,
            showRestartButton: false,
            gameWinner: null,
            mandatoryCaptures: [],
            isMultipleCapture: false,
            lastMovedPiece: null,
        });
    }, [initialTeam]);

    const updateGameState = useCallback((updates: Partial<GameState>) => {
        setGameState((prev) => ({ ...prev, ...updates }));
    }, []);

    const handleOpponentStateUpdate = useCallback(
        (receivedGameState: GameStatePayload) => {
            setGameState({
                pieces: receivedGameState.pieces,
                currentTeam: receivedGameState.currentTeam,
                isGameOver: receivedGameState.isGameOver,
                currentMessage: receivedGameState.currentMessage,
                showRestartButton: receivedGameState.isGameOver,
                gameWinner: receivedGameState.winner || null,
                mandatoryCaptures: [],
                isMultipleCapture: false,
                lastMovedPiece: null,
            });
        },
        []
    );

    return {
        gameState,
        updateGameState,
        resetGame,
        handleOpponentStateUpdate,
    };
};
