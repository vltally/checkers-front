/* eslint-disable react-hooks/rules-of-hooks */
import React, { useContext, useEffect, useRef, useState } from 'react';
import {
    BOARD_SIZE,
    HORIZONTAL_AXIS,
    initialBoardState,
    Piece,
    Position,
    samePosition,
    TeamType,
    TILE_SIZE,
    VERTICAL_AXIS,
} from '../../Constants.ts'; // Adjust path as needed
import { GlobleContext } from '../../context/Context.tsx'; // Adjust path as needed
import {
    GameStatePayload,
    GameStatus,
    PrivateRoomMessage,
} from '../../context/types.ts';
import Referee from '../../referee/Referee.ts'; // Adjust path as needed
import {
    findAllMandatoryCaptures,
    hasMoreCaptures,
    updatePiecesAfterMove,
} from '../../referee/rules/GeneralRules.ts'; // Adjust path as needed
import Tile from '../Tile/Tile.tsx'; // Adjust path as needed
import './Chessboard.css';

// --- Data Structures for State Synchronization ---

// Payload containing the full game state sent over SignalR

// --- Chessboard Component ---

export default function Chessboard() {
    const chessboardRef = useRef<HTMLDivElement>(null);
    const [activePiece, setActivePiece] = useState<HTMLElement | null>(null);
    const [grabPosition, setGrabPosition] = useState<Position>({
        x: -1,
        y: -1,
    });
    const [pieces, setPieces] = useState<Piece[]>(initialBoardState);
    const [mandatoryCaptures, setMandatoryCaptures] = useState<Position[]>([]);
    const [isMultipleCapture, setIsMultipleCapture] = useState(false); // Tracks if current player is in mid-multi-capture
    const [lastMovedPiece, setLastMovedPiece] = useState<Piece | null>(null); // For multi-capture UI constraint
    const [gameOver, setGameOver] = useState<string | null>(null);
    const [showRestartButton, setShowRestartButton] = useState(false);

    // --- SignalR Integration & User Info ---

    const {
        userState: { username },
        signalRState: { signalRService, privateRoomInitiated, privateRoomMsg },
    } = useContext(GlobleContext);

    const myTeamType =
        privateRoomInitiated && privateRoomInitiated.requested === username
            ? TeamType.OUR
            : TeamType.OPPONENT;
    const opponentUsername =
        privateRoomInitiated && myTeamType === TeamType.OUR
            ? privateRoomInitiated.accepted
            : privateRoomInitiated?.requested;

    const [currentTeam, setCurrentTeam] = useState<TeamType>(TeamType.OUR);

    // Effect for initialization and handling room changes
    useEffect(() => {
        console.log('Room initialized or changed. Resetting board.');
        setCurrentTeam(TeamType.OUR); // Requester (OUR) always starts
        setGameOver(null);
        setShowRestartButton(false);
        setPieces(initialBoardState);
        setMandatoryCaptures([]);
        setIsMultipleCapture(false);
        setLastMovedPiece(null);
    }, [privateRoomInitiated]);

    // Effect to handle incoming SignalR messages (State Updates & Restart)
    useEffect(() => {
        if (
            privateRoomMsg &&
            opponentUsername &&
            privateRoomMsg.from === opponentUsername
        ) {
            const messageData = privateRoomMsg as PrivateRoomMessage;
            console.log('Received message from opponent:', messageData);

            if (messageData.gameState) {
                handleOpponentStateUpdate(messageData.gameState);
            }
            if (messageData.restart) {
                console.log('Opponent requested/confirmed restart.');
                handleRestartGame(); // Reset game locally on opponent's signal
            }
            // Consider clearing the message from context after processing
        }
    }, [privateRoomMsg, opponentUsername]); // Rerun when message or opponent changes

    // --- Referee Instance ---
    const referee = new Referee();

    // --- Effect for Calculating Mandatory Captures ---
    // This runs whenever the board state (`pieces`) or the `currentTeam` changes.
    useEffect(() => {
        if (!gameOver) {
            // Only calculate if game is ongoing
            const captures = findAllMandatoryCaptures(pieces, currentTeam);
            // Update mandatory captures based on the current authoritative state
            setMandatoryCaptures(captures);
            console.log(
                `Calculated mandatory captures for ${
                    currentTeam === myTeamType ? 'My Turn' : 'Opponent Turn'
                }:`,
                captures
            );
        } else {
            setMandatoryCaptures([]); // Clear highlights if game is over
        }
    }, [pieces, currentTeam, gameOver, myTeamType]); // Dependencies for recalculation

    // --- State Update Handler (Receiver Logic) ---
    // Handles receiving the full game state from the opponent
    const handleOpponentStateUpdate = (receivedGameState: GameStatePayload) => {
        console.log('Applying received game state:', receivedGameState);

        // --- Directly Update Local State ---
        setPieces(receivedGameState.pieces);
        setCurrentTeam(receivedGameState.currentTeam); // Set turn based on received state
        setGameOver(receivedGameState.gameOver); // Update game over status
        setShowRestartButton(!receivedGameState.gameOver); // Show restart if game over

        // --- Reset Local Helper State ---
        // These will be recalculated or managed based on the new state and subsequent actions.
        // We don't know the opponent's exact multi-capture status from state alone,
        // but we know whose turn it is. Mandatory captures are recalculated by useEffect.
        setIsMultipleCapture(false);
        setLastMovedPiece(null);

        console.log('Received game state applied successfully.');
        console.log('Current team after receiving state: ' + currentTeam);
        console.log('Game over status after receiving state: ' + gameOver);
    };

    // --- Send State Function ---
    // Sends the full game state via SignalR
    const sendGameStateViaSignalR = (gameState: GameStatePayload) => {
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

        console.log(gameState);
        console.log('Sending game state:', message);
        signalRService.sendPrivateRooMessage(message);
    };

    // --- Game Over Check Function ---
    // Checks the game state based on pieces and whose turn it would be.
    // Returns an object indicating if the game is over and a message.
    const checkGameState = (
        currentPieces: Piece[],
        teamWhoseTurnItIs: TeamType,
        username: string,
        opponentUsername: string
    ): GameStatus => {
        // 1. Check if the current team has any pieces left
        const teamPieces = currentPieces.filter(
            (p) => p.team === teamWhoseTurnItIs
        );

        console.log(
            teamPieces.length + ' pieces left for ' + teamWhoseTurnItIs
        );
        if (teamPieces.length === 0) {
            const winner =
                teamWhoseTurnItIs === TeamType.OUR
                    ? opponentUsername
                    : username;
            return {
                isGameOver: true,
                message: `Game Over! ${winner} wins! (No pieces left)`,
            };
        }

        // 2. Check if the current team has any valid moves
        const referee = new Referee();
        let hasValidMove = false;

        for (const piece of teamPieces) {
            // Iterate over all possible board positions (8x8)
            for (let dx = -2; dx <= 2; dx++) {
                for (let dy = -2; dy <= 2; dy++) {
                    if (dx === 0 && dy === 0) continue;

                    const targetX = piece.position.x + dx;
                    const targetY = piece.position.y + dy;

                    // Skip positions out of bounds
                    if (
                        targetX < 0 ||
                        targetX >= 8 ||
                        targetY < 0 ||
                        targetY >= 8
                    )
                        continue;

                    const result = referee.isValidMove(
                        piece.position,
                        { x: targetX, y: targetY },
                        piece.type,
                        piece.team,
                        currentPieces
                    );

                    result.success = true; // Force success for testing

                    if (result.success) {
                        hasValidMove = true;
                        break;
                    }
                }
                if (hasValidMove) break;
            }
            if (hasValidMove) break;
        }

        if (!hasValidMove) {
            const winner =
                teamWhoseTurnItIs === TeamType.OUR
                    ? opponentUsername
                    : username;
            return {
                isGameOver: true,
                message: `Game Over! ${winner} wins! (No valid moves left)`,
            };
        }

        // Game continues
        return {
            isGameOver: false,
            message: 'Game continues',
        };
    };

    // --- Piece Interaction Functions (Sender Logic) ---

    function grabPiece(e: React.MouseEvent) {
        const element = e.target as HTMLElement;
        const chessboard = chessboardRef.current;

        console.log('Grab piece event triggered.');

        console.log(
            'currentTeam = ' + currentTeam + ' myTeamType ' + myTeamType
        );
        console.log('if statement ' + ' ' + gameOver + ' ' + chessboard);
        if (currentTeam !== myTeamType || gameOver || !chessboard) {
            return; // Not my turn, game over, or ref not ready
        }

        if (element.classList.contains('chess-piece')) {
            const grabX = Math.floor(
                (e.clientX - chessboard.offsetLeft) / TILE_SIZE
            );
            const grabY = Math.abs(
                Math.ceil(
                    (e.clientY - chessboard.offsetTop - BOARD_SIZE) / TILE_SIZE
                )
            );
            const potentialGrabPos = { x: grabX, y: grabY };
            const piece = pieces.find((p) =>
                samePosition(p.position, potentialGrabPos)
            );

            console.log('found piece ' + piece);

            console.log(
                'Can move my piecee' + !piece || piece.team !== myTeamType
            );

            if (!piece || piece.team !== myTeamType) return; // Not my piece

            // --- Mandatory & Multi-Capture Checks ---
            if (
                mandatoryCaptures.length > 0 &&
                !mandatoryCaptures.some((pos) =>
                    samePosition(pos, potentialGrabPos)
                )
            ) {
                console.log('Must play a mandatory capture piece.');
                return; // Must play a highlighted piece if captures exist
            }
            if (
                isMultipleCapture &&
                lastMovedPiece &&
                !samePosition(lastMovedPiece.position, potentialGrabPos)
            ) {
                console.log('Must continue capture with the same piece.');
                return; // In multi-capture, must use the same piece
            }
            // --- End Checks ---

            setGrabPosition(potentialGrabPos);
            // Position the piece for dragging
            const mouseX = e.clientX - TILE_SIZE / 2;
            const mouseY = e.clientY - TILE_SIZE / 2;
            element.style.zIndex = '100';
            element.style.position = 'absolute';
            element.style.left = `${mouseX}px`;
            element.style.top = `${mouseY}px`;
            setActivePiece(element);
        }
    }

    function movePiece(e: React.MouseEvent) {
        const chessboard = chessboardRef.current;
        if (activePiece && chessboard) {
            const minX = chessboard.offsetLeft;
            const minY = chessboard.offsetTop;
            const maxX =
                chessboard.offsetLeft + chessboard.clientWidth - TILE_SIZE;
            const maxY =
                chessboard.offsetTop + chessboard.clientHeight - TILE_SIZE;
            const x = e.clientX - TILE_SIZE / 2;
            const y = e.clientY - TILE_SIZE / 2;
            activePiece.style.zIndex = '100';
            activePiece.style.position = 'absolute';
            activePiece.style.left = `${Math.max(minX, Math.min(x, maxX))}px`;
            activePiece.style.top = `${Math.max(minY, Math.min(y, maxY))}px`;
        }
    }

    // Main function for handling player moves and updating state
    function dropPiece(e: React.MouseEvent) {
        const chessboard = chessboardRef.current;
        console.log('Drop piece event triggered.');
        console.log(
            'active piece' +
                activePiece +
                ' chessboard' +
                chessboard +
                ' currentTeam' +
                currentTeam +
                ' myTeamType' +
                myTeamType +
                ' gameOver' +
                gameOver
        );
        if (
            !activePiece ||
            !chessboard ||
            currentTeam !== myTeamType ||
            gameOver
        ) {
            if (activePiece) {
                // Reset piece visual if dropped improperly
                activePiece.style.position = 'relative';
                activePiece.style.removeProperty('top');
                activePiece.style.removeProperty('left');
                setActivePiece(null);
            }
            return; // Only process drop if it's a valid situation
        }

        const x = Math.floor((e.clientX - chessboard.offsetLeft) / TILE_SIZE);
        const y = Math.abs(
            Math.ceil(
                (e.clientY - chessboard.offsetTop - BOARD_SIZE) / TILE_SIZE
            )
        );
        const dropPosition = { x, y };

        const currentPiece = pieces.find((p) =>
            samePosition(p.position, grabPosition)
        );

        if (currentPiece) {
            // Validate the attempted move
            const moveResult = referee.isValidMove(
                grabPosition,
                dropPosition,
                currentPiece.type,
                currentPiece.team,
                pieces
            );

            if (moveResult.success) {
                // --- Move was valid, calculate the resulting state ---
                let wasCapture = !!moveResult.capturedPiece; // Check if referee reported capture
                // Fallback check (useful if referee logic misses something)
                if (!wasCapture) {
                    const pieceAtTarget = pieces.find((p) =>
                        samePosition(p.position, dropPosition)
                    );
                    if (pieceAtTarget && pieceAtTarget.team !== myTeamType)
                        wasCapture = true;
                }

                // 1. Calculate the updated pieces array
                let updatedPieces = pieces.map((piece) => {
                    if (samePosition(piece.position, currentPiece.position)) {
                        // TODO: Handle promotion type change if applicable
                        return { ...piece, position: dropPosition };
                    }
                    return piece;
                });
                // Remove the captured piece
                if (moveResult.capturedPiece) {
                    updatedPieces = updatedPieces.filter(
                        (p) =>
                            !samePosition(p.position, moveResult.capturedPiece!)
                    );
                } else if (wasCapture) {
                    // Handle fallback capture check
                    updatedPieces = updatedPieces.filter(
                        (p) => !samePosition(p.position, dropPosition)
                    );
                }
                // Apply any post-move updates (like promotion)
                updatedPieces = updatePiecesAfterMove(updatedPieces);

                // 2. Determine whose turn it is NEXT
                let nextTeam = currentTeam; // Assume turn continues (for multi-capture)
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
                        currentPiece.type // TODO: Check promoted type
                    );
                    if (!moreCapturesAvailable) {
                        nextTeam = opponentTeam; // Switch turn if no more captures
                    }
                    // If moreCapturesAvailable is true, nextTeam remains myTeamType
                } else {
                    nextTeam = opponentTeam; // Normal move, switch turn
                }

                // 3. Check if the game ended with this move
                const gameStateResult = checkGameState(
                    updatedPieces,
                    currentTeam,
                    username,
                    opponentUsername
                );

                // --- Prepare Full State Payload ---
                const gameStatePayload: GameStatePayload = {
                    pieces: updatedPieces,
                    currentTeam: nextTeam,
                    gameOver: gameStateResult.message,
                };

                // --- Send Full State via SignalR ---
                sendGameStateViaSignalR(gameStatePayload);

                // --- Update Local State to Match Sent State ---
                setPieces(updatedPieces);
                setCurrentTeam(nextTeam);
                setGameOver(gameStateResult.message);
                setShowRestartButton(gameStateResult.isGameOver);

                // Update local multi-capture UI state *after* main state updates
                if (
                    nextTeam === myTeamType &&
                    wasCapture &&
                    moreCapturesAvailable &&
                    !gameStateResult.isGameOver
                ) {
                    console.log('Setting local multi-capture state: TRUE');
                    setIsMultipleCapture(true);
                    // Mandatory captures useEffect will update based on new pieces/turn,
                    // but we set lastMovedPiece to constrain the *next* grabPiece
                    setLastMovedPiece({
                        ...currentPiece,
                        position: dropPosition,
                    });
                    // We set mandatoryCaptures here directly for immediate UI feedback if needed
                    setMandatoryCaptures([dropPosition]);
                } else {
                    console.log('Setting local multi-capture state: FALSE');
                    setIsMultipleCapture(false);
                    setLastMovedPiece(null);
                    // Mandatory captures will be updated by the useEffect based on the new state
                }
            } else {
                // Invalid move - revert visual position
                console.log('Invalid move.');
                activePiece.style.position = 'relative';
                activePiece.style.removeProperty('top');
                activePiece.style.removeProperty('left');
            }
        }

        // Reset active piece after processing drop
        setActivePiece(null);
    }

    // --- Touch Handlers ---
    function handleTouchStart(e: React.TouchEvent) {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const mouseEvent = {
                clientX: touch.clientX,
                clientY: touch.clientY,
                target: e.target,
            } as unknown as React.MouseEvent;
            grabPiece(mouseEvent);
            e.preventDefault(); // Prevent default touch behavior like scrolling
        }
    }
    function handleTouchMove(e: React.TouchEvent) {
        if (e.touches.length === 1 && activePiece) {
            // Only move if a piece is active
            const touch = e.touches[0];
            const mouseEvent = {
                clientX: touch.clientX,
                clientY: touch.clientY,
                target: e.target,
            } as unknown as React.MouseEvent;
            movePiece(mouseEvent);
            e.preventDefault(); // Prevent scrolling while dragging
        }
    }
    function handleTouchEnd(e: React.TouchEvent) {
        if (e.changedTouches.length === 1 && activePiece) {
            // Only process if a piece was active
            const touch = e.changedTouches[0];
            const mouseEvent = {
                clientX: touch.clientX,
                clientY: touch.clientY,
                target: e.target,
            } as unknown as React.MouseEvent;
            dropPiece(mouseEvent);
            // No preventDefault needed here usually
        } else if (activePiece) {
            // If touch ends unexpectedly or without a piece active (e.g., tap cancellation)
            // Reset visual position of the piece if one was somehow active
            activePiece.style.position = 'relative';
            activePiece.style.removeProperty('top');
            activePiece.style.removeProperty('left');
            setActivePiece(null);
        }
    }

    // --- Restart Logic ---
    const handleRequestRestart = () => {
        if (!signalRService || !opponentUsername || !username) return;
        const message: PrivateRoomMessage = {
            from: username,
            to: opponentUsername,
            restart: true,
        };
        signalRService.sendPrivateRooMessage(message);
        // Reset locally immediately. Opponent reset is handled by receiving the message.
        handleRestartGame();
    };

    const handleRestartGame = () => {
        // Resets the game state locally
        console.log('Restarting game locally...');
        setPieces(initialBoardState);
        setCurrentTeam(TeamType.OUR); // Reset to default starting player
        setMandatoryCaptures([]);
        setIsMultipleCapture(false);
        setLastMovedPiece(null);
        setGameOver(null);
        setShowRestartButton(false);
        setActivePiece(null);
        setGrabPosition({ x: -1, y: -1 });
    };

    // --- Rendering Logic ---
    const board = [];
    for (let j = VERTICAL_AXIS.length - 1; j >= 0; j--) {
        for (let i = 0; i < HORIZONTAL_AXIS.length; i++) {
            const currentPos = { x: i, y: j };
            const piece = pieces.find((p) =>
                samePosition(p.position, currentPos)
            );
            const image = piece ? piece.image : undefined;
            const number = j + i + 2; // For tile coloring

            // Determine if the tile should be highlighted (mandatory move)
            let isHighlighted = false;
            if (currentTeam === myTeamType && !gameOver) {
                if (isMultipleCapture && lastMovedPiece) {
                    // In multi-capture, only highlight the piece that MUST move
                    isHighlighted = samePosition(
                        lastMovedPiece.position,
                        currentPos
                    );
                } else if (mandatoryCaptures.length > 0) {
                    // Otherwise, highlight any piece that has a mandatory capture
                    isHighlighted = mandatoryCaptures.some((pos) =>
                        samePosition(pos, currentPos)
                    );
                }
            }

            board.push(
                <Tile
                    key={`${i}-${j}`} // Use standard key format
                    image={image}
                    number={number}
                    isHighlighted={isHighlighted}
                />
            );
        }
    }

    // Display text for whose turn it is or game over message
    const turnText = gameOver
        ? gameOver
        : !username || !opponentUsername
        ? 'Connecting...'
        : currentTeam === myTeamType
        ? `${username} (Your Turn)` +
          (isMultipleCapture ? ' - Must Capture!' : '')
        : `${opponentUsername}'s Turn`;

    return (
        <div className="flex flex-col items-center p-4 font-sans">
            {' '}
            {/* Basic styling */}
            <div className="game-info mb-2 text-lg font-semibold h-8 flex items-center justify-center text-center">
                {' '}
                {/* Centered text, fixed height */}
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
                className="touch-none" // Added touch-none to potentially help with scrolling issues
                style={
                    { '--tile-size': `${TILE_SIZE}px` } as React.CSSProperties
                }
            >
                {board}
            </div>
            {showRestartButton && (
                <button
                    onClick={handleRequestRestart}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-800 transition duration-150 ease-in-out shadow active:bg-blue-900" // Added active style
                >
                    Restart Game
                </button>
            )}
        </div>
    );
}
