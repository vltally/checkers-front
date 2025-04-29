import React, { useEffect, useState } from 'react';
import {
    initialBoardState,
    Piece,
    Position,
    samePosition,
    TeamType,
    TILE_SIZE,
} from '../../Constants';
import { Move } from '../../context/types';
import Referee from '../../referee/Referee';
import { findAllMandatoryCaptures } from '../../referee/rules/GeneralRules';
import Tile from '../Tile/Tile';
import './Chessboard.css';

interface Props {
    moves: Move[];
}

type BoardHistoryEntry = {
    board: Piece[];
    turn: TeamType;
};

const ChessboardReplay: React.FC<Props> = ({ moves }) => {
    const [boardStates, setBoardStates] = useState<BoardHistoryEntry[]>([]);
    const [currentMoveIndex, setCurrentMoveIndex] = useState<number>(0);
    const [pieces, setPieces] = useState<Piece[]>(initialBoardState);
    const [highlightedTiles, setHighlightedTiles] = useState<Position[]>([]);

    const referee = new Referee();

    // Generate board states along with corresponding turn per move
    useEffect(() => {
        const generateBoardStates = () => {
            const history: BoardHistoryEntry[] = [];
            let currentBoard = [...initialBoardState];
            let turn = TeamType.OUR;

            // Push the initial state together with its turn
            history.push({ board: [...currentBoard], turn });

            moves.forEach((move, index) => {
                console.log(`Processing move ${index + 1}:`, move);

                const piece = currentBoard.find((p) =>
                    samePosition(p.position, move.from)
                );

                if (!piece) {
                    console.warn(
                        `Move ${index + 1} skipped: No piece found at position`,
                        move.from
                    );
                    return;
                }

                if (piece.team !== turn) {
                    console.warn(
                        `Move ${index + 1} skipped: It's not ${turn}'s turn`
                    );
                    return;
                }

                // Validate the move using Referee
                const moveResult = referee.isValidMove(
                    move.from,
                    move.to,
                    piece.type,
                    piece.team,
                    currentBoard
                );

                if (!moveResult.success) {
                    console.warn(
                        `Move ${index + 1} skipped: Invalid move`,
                        move
                    );
                    return;
                }

                // Apply the move: update the piece's position
                let updatedBoard = currentBoard.map((p) => {
                    if (samePosition(p.position, move.from)) {
                        return { ...p, position: move.to };
                    }
                    return p;
                });

                // Handle captures
                if (moveResult.capturedPiece) {
                    updatedBoard = updatedBoard.filter(
                        (p) =>
                            !samePosition(p.position, moveResult.capturedPiece!)
                    );
                }

                // Handle promotion
                updatedBoard = updatedBoard.map((p) => {
                    if (
                        samePosition(p.position, move.to) &&
                        p.type === 0 && // Ensure it's a pawn
                        ((p.team === TeamType.OUR && move.to.y === 7) ||
                            (p.team === TeamType.OPPONENT && move.to.y === 0))
                    ) {
                        return {
                            ...p,
                            type: 1, // Promote to KING
                            image:
                                p.team === TeamType.OUR
                                    ? '/src/assets/images/king_g.png'
                                    : '/src/assets/images/king_r.png',
                        };
                    }
                    return p;
                });

                // Check for additional captures after the capture is processed
                const additionalCaptures = moveResult.capturedPiece
                    ? referee.hasAdditionalCaptures(
                          move.to,
                          piece.type,
                          turn,
                          updatedBoard
                      )
                    : false;

                console.log(
                    `Move ${
                        index + 1
                    }: Additional captures available: ${additionalCaptures}`
                );

                // Switch the turn only if no more captures are available
                if (!additionalCaptures) {
                    turn =
                        turn === TeamType.OUR
                            ? TeamType.OPPONENT
                            : TeamType.OUR;
                    console.log(`Turn switched to: ${turn}`);
                }

                history.push({ board: [...updatedBoard], turn });
                currentBoard = updatedBoard;
            });

            setBoardStates(history);
        };

        generateBoardStates();
    }, [moves]);

    // Update the board when the current move index changes
    useEffect(() => {
        if (boardStates.length > 0) {
            const { board, turn } = boardStates[currentMoveIndex];
            setPieces(board);
            console.log('Sending current team to highlight: ' + turn);

            // Highlight mandatory captures for the team corresponding to this move's board state
            const captures = findAllMandatoryCaptures(board, turn);
            console.log(
                `Highlighting mandatory captures for team ${turn}:`,
                captures
            );
            setHighlightedTiles(captures);
        }
    }, [boardStates, currentMoveIndex]);

    // Handlers for navigation (no turn toggling here)
    const handleNext = () => {
        if (currentMoveIndex < boardStates.length - 1) {
            setCurrentMoveIndex((prev) => prev + 1);
        }
    };

    const handleBack = () => {
        if (currentMoveIndex > 0) {
            setCurrentMoveIndex((prev) => prev - 1);
        }
    };

    // Render the chessboard
    const board = [];
    for (let j = 7; j >= 0; j--) {
        for (let i = 0; i < 8; i++) {
            const currentPos = { x: i, y: j };
            const piece = pieces.find((p) =>
                samePosition(p.position, currentPos)
            );
            const image = piece ? piece.image : undefined;
            const isHighlighted = highlightedTiles.some((pos) =>
                samePosition(pos, currentPos)
            );
            const number = j + i + 2;

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

    return (
        <div className="flex flex-col items-center">
            <div className="game-info mb-4">
                Move {currentMoveIndex} of {boardStates.length - 1}
            </div>
            <div
                id="chessboard"
                className="touch-none"
                style={
                    { '--tile-size': `${TILE_SIZE}px` } as React.CSSProperties
                }
            >
                {board}
            </div>
            <div className="mt-4 flex space-x-4">
                <button
                    onClick={handleBack}
                    disabled={currentMoveIndex === 0}
                    className="px-4 py-2 bg-gray-600 text-white rounded disabled:opacity-50"
                >
                    Back
                </button>
                <button
                    onClick={handleNext}
                    disabled={currentMoveIndex === boardStates.length - 1}
                    className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default ChessboardReplay;
