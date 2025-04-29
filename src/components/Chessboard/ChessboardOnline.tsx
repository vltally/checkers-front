/* eslint-disable react-hooks/rules-of-hooks */
import React, { useEffect, useRef } from 'react';
import {
    HORIZONTAL_AXIS,
    initialBoardState,
    Piece,
    samePosition,
    TeamType,
    TILE_SIZE,
    VERTICAL_AXIS,
} from '../../Constants';
import { GameStatePayload } from '../../context/types';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';
import { useGameState } from '../../hooks/useGameState';
import { useSignalRConnection } from '../../hooks/useSignalRConnection';
import Referee from '../../referee/Referee';
import {
    findAllMandatoryCaptures,
    hasMoreCaptures,
    updatePiecesAfterMove,
} from '../../referee/rules/GeneralRules';
import GameOverModal from '../Modals/GameOverModal';
import Tile from '../Tile/Tile';
import './Chessboard.css';

export default function Chessboard() {
    const chessboardRef = useRef<HTMLDivElement>(null);
    const referee = new Referee();

    // Use custom hooks
    const { gameState, updateGameState, resetGame, handleOpponentStateUpdate } =
        useGameState();
    const {
        dragState,
        startDragging,
        stopDragging,
        updateDragPosition,
        calculateGrabPosition,
        calculateDropPosition,
    } = useDragAndDrop();
    const {
        username,
        privateRoomInitiated,
        privateRoomMsg,
        sendGameState,
        requestRestart,
        closeRoom,
        getOpponentUsername,
    } = useSignalRConnection();

    const opponentUsername = getOpponentUsername();
    const myTeamType =
        privateRoomInitiated?.requested === username
            ? TeamType.OUR
            : TeamType.OPPONENT;

    // Effect for initialization and handling room changes
    useEffect(() => {
        if (
            privateRoomInitiated &&
            privateRoomInitiated.requested &&
            privateRoomInitiated.accepted
        ) {
            // Only reset if the room is newly initialized
            if (
                !gameState.pieces.length ||
                gameState.pieces === initialBoardState
            ) {
                console.log('Room initialized. Setting up new game.');
                resetGame();

                // Send initial game state to opponent
                if (opponentUsername) {
                    const initialGameState: GameStatePayload = {
                        pieces: initialBoardState,
                        currentTeam: TeamType.OUR,
                        isGameOver: false,
                        winner: null,
                        currentMessage: null,
                        fromPosition: { x: -1, y: -1 },
                        toPosition: { x: -1, y: -1 },
                        isPromoted: false,
                    };
                    sendGameState(initialGameState, opponentUsername);
                }
            }
        }
    }, [
        privateRoomInitiated,
        opponentUsername,
        resetGame,
        sendGameState,
        gameState.pieces,
    ]);

    // Effect for handling incoming SignalR messages
    useEffect(() => {
        if (privateRoomMsg && opponentUsername) {
            const messageData = privateRoomMsg;
            if (messageData.from === opponentUsername) {
                console.log('Received message from opponent:', messageData);

                if (messageData.gameState) {
                    handleOpponentStateUpdate(messageData.gameState);
                }
                if (messageData.restart) {
                    console.log('Opponent requested/confirmed restart.');
                    resetGame();
                }
            }
        }
    }, [
        privateRoomMsg,
        opponentUsername,
        handleOpponentStateUpdate,
        resetGame,
    ]);

    // Effect for calculating mandatory captures
    useEffect(() => {
        if (!gameState.isGameOver) {
            const captures = findAllMandatoryCaptures(
                gameState.pieces,
                gameState.currentTeam
            );
            updateGameState({ mandatoryCaptures: captures });
            console.log(
                `Calculated mandatory captures for ${
                    gameState.currentTeam === myTeamType
                        ? 'My Turn'
                        : 'Opponent Turn'
                }:`,
                captures
            );
        } else {
            updateGameState({ mandatoryCaptures: [] });
        }
    }, [
        gameState.pieces,
        gameState.currentTeam,
        gameState.isGameOver,
        myTeamType,
        updateGameState,
    ]);

    // Game logic functions
    const checkGameState = (
        currentPieces: Piece[],
        teamWhoseTurnItIs: TeamType,
        username: string,
        opponentUsername: string | null
    ) => {
        if (!opponentUsername) {
            return {
                isGameOver: false,
                message: 'Waiting for opponent...',
                winner: null,
            };
        }

        const currentTeamPieces = currentPieces.filter(
            (p) => p.team === teamWhoseTurnItIs
        );
        const opponentTeamPieces = currentPieces.filter(
            (p) => p.team !== teamWhoseTurnItIs
        );

        if (opponentTeamPieces.length === 0) {
            const winner =
                teamWhoseTurnItIs === TeamType.OUR
                    ? username
                    : opponentUsername;
            return {
                isGameOver: true,
                message: `Game Over! ${winner} wins! (Opponent has no pieces left)`,
                winner: winner,
            };
        }

        if (currentTeamPieces.length === 0) {
            const winner =
                teamWhoseTurnItIs === TeamType.OUR
                    ? opponentUsername
                    : username;
            return {
                isGameOver: true,
                message: `Game Over! ${winner} wins! (No pieces left)`,
                winner: winner,
            };
        }

        if (currentTeamPieces.length === 1) {
            const lastPiece = currentTeamPieces[0];
            const isTrapped = isPieceTrappedAgainstEdge(
                lastPiece,
                opponentTeamPieces
            );
            if (isTrapped) {
                const winner =
                    teamWhoseTurnItIs === TeamType.OUR
                        ? opponentUsername
                        : username;
                return {
                    isGameOver: true,
                    message: `Game Over! ${winner} wins! (Opponent's piece is trapped against the edge)`,
                    winner: winner,
                };
            }
        }

        const hasValidMove = checkForValidMoves(
            currentTeamPieces,
            currentPieces
        );
        if (!hasValidMove) {
            const winner =
                teamWhoseTurnItIs === TeamType.OUR
                    ? opponentUsername
                    : username;
            return {
                isGameOver: true,
                message: `Game Over! ${winner} wins! (No valid moves left)`,
                winner: winner,
            };
        }

        const currentTurnPlayer =
            teamWhoseTurnItIs === TeamType.OUR ? opponentUsername : username;
        return {
            isGameOver: false,
            message: `Game continues. It's ${currentTurnPlayer}'s turn.`,
            winner: null,
        };
    };

    const checkForValidMoves = (
        currentTeamPieces: Piece[],
        allPieces: Piece[]
    ): boolean => {
        // for (const piece of currentTeamPieces) {
        //     for (let dx = -2; dx <= 2; dx++) {
        //         for (let dy = -2; dy <= 2; dy++) {
        //             if (dx === 0 && dy === 0) continue;

        //             const targetX = piece.position.x + dx;
        //             const targetY = piece.position.y + dy;

        //             if (
        //                 targetX < 0 ||
        //                 targetX >= 8 ||
        //                 targetY < 0 ||
        //                 targetY >= 8
        //             )
        //                 continue;

        //             const result = referee.isValidMove(
        //                 piece.position,
        //                 { x: targetX, y: targetY },
        //                 piece.type,
        //                 piece.team,
        //                 allPieces
        //             );

        //             if (result.success) return true;
        //         }
        //     }
        // }
        return true;
    };

    const isPieceTrappedAgainstEdge = (
        piece: Piece,
        opponentPieces: Piece[]
    ): boolean => {
        const isOnLeftEdge = piece.position.x === 0;
        const isOnRightEdge = piece.position.x === 7;

        if (!isOnLeftEdge && !isOnRightEdge) return false;

        const y = piece.position.y;

        if (isOnLeftEdge) {
            const hasBlockingPieceTop = opponentPieces.some(
                (p) => p.position.x === 1 && p.position.y === y - 1
            );
            const hasBlockingPieceBottom = opponentPieces.some(
                (p) => p.position.x === 1 && p.position.y === y + 1
            );
            return hasBlockingPieceTop && hasBlockingPieceBottom;
        }

        if (isOnRightEdge) {
            const hasBlockingPieceTop = opponentPieces.some(
                (p) => p.position.x === 6 && p.position.y === y - 1
            );
            const hasBlockingPieceBottom = opponentPieces.some(
                (p) => p.position.x === 6 && p.position.y === y + 1
            );
            return hasBlockingPieceTop && hasBlockingPieceBottom;
        }

        return false;
    };

    // Event handlers
    const handleLeaveRoom = () => {
        if (opponentUsername) {
            closeRoom(opponentUsername);
        }
    };

    const handleRequestRestart = () => {
        if (opponentUsername) {
            requestRestart(opponentUsername);
            resetGame();
        }
    };

    const grabPiece = (e: React.MouseEvent) => {
        const element = e.target as HTMLElement;
        if (gameState.currentTeam !== myTeamType || !chessboardRef.current) {
            return;
        }

        if (element.classList.contains('chess-piece')) {
            const potentialGrabPos = calculateGrabPosition(e, chessboardRef);
            const piece = gameState.pieces.find((p) =>
                samePosition(p.position, potentialGrabPos)
            );

            if (!piece || piece.team !== myTeamType) return;

            if (
                gameState.mandatoryCaptures.length > 0 &&
                !gameState.mandatoryCaptures.some((pos) =>
                    samePosition(pos, potentialGrabPos)
                )
            ) {
                console.log('Must play a mandatory capture piece.');
                return;
            }

            if (
                gameState.isMultipleCapture &&
                gameState.lastMovedPiece &&
                !samePosition(
                    gameState.lastMovedPiece.position,
                    potentialGrabPos
                )
            ) {
                console.log('Must continue capture with the same piece.');
                return;
            }

            startDragging(element, potentialGrabPos);
        }
    };

    const movePiece = (e: React.MouseEvent) => {
        updateDragPosition(e, chessboardRef);
    };

    const dropPiece = (e: React.MouseEvent) => {
        if (
            !dragState.activePiece ||
            !chessboardRef.current ||
            gameState.currentTeam !== myTeamType
        ) {
            stopDragging();
            return;
        }

        const dropPosition = calculateDropPosition(e, chessboardRef);
        const currentPiece = gameState.pieces.find((p) =>
            samePosition(p.position, dragState.grabPosition)
        );

        if (currentPiece) {
            const moveResult = referee.isValidMove(
                dragState.grabPosition,
                dropPosition,
                currentPiece.type,
                currentPiece.team,
                gameState.pieces
            );

            if (moveResult.success) {
                let wasCapture = !!moveResult.capturedPiece;
                if (!wasCapture) {
                    const pieceAtTarget = gameState.pieces.find((p) =>
                        samePosition(p.position, dropPosition)
                    );
                    if (pieceAtTarget && pieceAtTarget.team !== myTeamType)
                        wasCapture = true;
                }

                let updatedPieces = gameState.pieces.map((piece) => {
                    if (samePosition(piece.position, currentPiece.position)) {
                        return { ...piece, position: dropPosition };
                    }
                    return piece;
                });

                if (moveResult.capturedPiece) {
                    updatedPieces = updatedPieces.filter(
                        (p) =>
                            !samePosition(p.position, moveResult.capturedPiece!)
                    );
                } else if (wasCapture) {
                    updatedPieces = updatedPieces.filter(
                        (p) => !samePosition(p.position, dropPosition)
                    );
                }

                updatedPieces = updatePiecesAfterMove(updatedPieces);

                let nextTeam = gameState.currentTeam;
                const opponentTeam =
                    myTeamType === TeamType.OUR
                        ? TeamType.OPPONENT
                        : TeamType.OUR;
                let moreCapturesAvailable = false;

                if (wasCapture) {
                    moreCapturesAvailable = hasMoreCaptures(
                        dropPosition,
                        currentPiece.team,
                        updatedPieces,
                        currentPiece.type
                    );
                    if (!moreCapturesAvailable) {
                        nextTeam = opponentTeam;
                    }
                } else {
                    nextTeam = opponentTeam;
                }

                const gameStateResult = checkGameState(
                    updatedPieces,
                    gameState.currentTeam,
                    username,
                    opponentUsername
                );

                const gameStatePayload: GameStatePayload = {
                    pieces: updatedPieces,
                    currentTeam: nextTeam,
                    isGameOver: gameStateResult.isGameOver,
                    winner: gameStateResult.winner,
                    currentMessage: gameStateResult.message,
                    fromPosition: dragState.grabPosition,
                    toPosition: dropPosition,
                    isPromoted: false,
                };

                if (opponentUsername) {
                    sendGameState(gameStatePayload, opponentUsername);
                }

                updateGameState({
                    pieces: updatedPieces,
                    currentTeam: nextTeam,
                    currentMessage: gameStateResult.message,
                    isGameOver: gameStateResult.isGameOver,
                    showRestartButton: gameStateResult.isGameOver,
                    gameWinner: gameStateResult.winner,
                    isMultipleCapture:
                        nextTeam === myTeamType &&
                        wasCapture &&
                        moreCapturesAvailable &&
                        !gameStateResult.isGameOver,
                    lastMovedPiece:
                        nextTeam === myTeamType &&
                        wasCapture &&
                        moreCapturesAvailable &&
                        !gameStateResult.isGameOver
                            ? { ...currentPiece, position: dropPosition }
                            : null,
                });
            } else {
                console.log('Invalid move.');
                // Reset the piece's position to its original position
                if (dragState.activePiece) {
                    dragState.activePiece.style.position = 'relative';
                    dragState.activePiece.style.removeProperty('top');
                    dragState.activePiece.style.removeProperty('left');
                    dragState.activePiece.style.removeProperty('z-index');
                }
            }
        }
        stopDragging();
    };

    // Touch handlers
    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const mouseEvent = {
                clientX: touch.clientX,
                clientY: touch.clientY,
                target: e.target,
            } as unknown as React.MouseEvent;
            grabPiece(mouseEvent);
            e.preventDefault();
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length === 1 && dragState.activePiece) {
            const touch = e.touches[0];
            const mouseEvent = {
                clientX: touch.clientX,
                clientY: touch.clientY,
                target: e.target,
            } as unknown as React.MouseEvent;
            movePiece(mouseEvent);
            e.preventDefault();
        }
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (e.changedTouches.length === 1 && dragState.activePiece) {
            const touch = e.changedTouches[0];
            const mouseEvent = {
                clientX: touch.clientX,
                clientY: touch.clientY,
                target: e.target,
            } as unknown as React.MouseEvent;
            dropPiece(mouseEvent);
        } else if (dragState.activePiece) {
            stopDragging();
        }
    };

    // Render board
    const board = [];
    for (let j = VERTICAL_AXIS.length - 1; j >= 0; j--) {
        for (let i = 0; i < HORIZONTAL_AXIS.length; i++) {
            const currentPos = { x: i, y: j };
            const piece = gameState.pieces.find((p) =>
                samePosition(p.position, currentPos)
            );
            const image = piece ? piece.image : undefined;
            const number = j + i + 2;

            let isHighlighted = false;
            if (gameState.currentTeam === myTeamType && !gameState.isGameOver) {
                if (gameState.isMultipleCapture && gameState.lastMovedPiece) {
                    isHighlighted = samePosition(
                        gameState.lastMovedPiece.position,
                        currentPos
                    );
                } else if (gameState.mandatoryCaptures.length > 0) {
                    isHighlighted = gameState.mandatoryCaptures.some((pos) =>
                        samePosition(pos, currentPos)
                    );
                }
            }

            board.push(
                <Tile
                    key={`${i}-${j}`}
                    image={image}
                    number={number}
                    isHighlighted={isHighlighted}
                />
            );
        }
    }

    const turnText = gameState.isGameOver
        ? gameState.currentMessage
        : !username || !opponentUsername
        ? 'Connecting...'
        : gameState.currentTeam === myTeamType
        ? `${username} (Your Turn)` +
          (gameState.isMultipleCapture ? ' - Must Capture!' : '')
        : `${opponentUsername}'s Turn`;

    return (
        <div className="flex flex-col items-center p-4 font-sans">
            <div className="game-info mb-2 text-lg font-semibold h-8 flex items-center justify-center text-center">
                {turnText}
            </div>
            <div
                onMouseMove={movePiece}
                onMouseDown={grabPiece}
                onMouseUp={dropPiece}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                id="chessboard"
                ref={chessboardRef}
                className="touch-none"
                style={
                    { '--tile-size': `${TILE_SIZE}px` } as React.CSSProperties
                }
            >
                {board}
            </div>
            {gameState.showRestartButton && (
                <button
                    onClick={handleRequestRestart}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-800 transition duration-150 ease-in-out shadow active:bg-blue-900"
                >
                    Restart Game
                </button>
            )}
            {gameState.isGameOver && (
                <GameOverModal
                    open={gameState.isGameOver}
                    winner={gameState.gameWinner}
                    message={gameState.currentMessage || ''}
                    onRestart={handleRequestRestart}
                    onClose={handleLeaveRoom}
                    onLeaveRoom={handleLeaveRoom}
                />
            )}
        </div>
    );
}
