/* eslint-disable react-hooks/rules-of-hooks */
import { useEffect, useRef, useState } from 'react';
import {
    BOARD_SIZE,
    HORIZONTAL_AXIS,
    initialBoardState,
    Piece,
    Position, samePosition,
    TeamType, TILE_SIZE,
    VERTICAL_AXIS,
} from '../../Constants';
import Referee from '../../referee/Referee';
import Tile from '../Tile/Tile';
import './Chessboard.css';
import { findAllMandatoryCaptures, updatePiecesAfterMove, hasMoreCaptures } from "../../referee/rules/GeneralRules.ts"

export default function Chessboard() {
    // State to keep track of the currently selected piece (HTML element).
    const [activePiece, setActivePiece] = useState<HTMLElement | null>(null);
    // State to store the initial position of the piece when picked up.
    const [grabPosition, setGrabPosition] = useState<Position>({x: -1, y: -1});
    // State to store the current board pieces and their positions.
    const [pieces, setPieces] = useState<Piece[]>(initialBoardState);
    // State to keep track of whose turn it currently is (OUR team vs OPPONENT team).
    const [currentTeam, setCurrentTeam] = useState<TeamType>(TeamType.OUR);
    // State to store all pieces with mandatory captures.
    const [mandatoryCaptures, setMandatoryCaptures] = useState<Position[]>([]);
    // State to track whether the current move is part of a multiple capture scenario.
    const [isMultipleCapture, setIsMultipleCapture] = useState(false);
    // State to store the piece that was last moved.
    const [lastMovedPiece, setLastMovedPiece] = useState<Piece | null>(null);
    // Reference to the chessboard DOM element (used to calculate positions).
    const chessboardRef = useRef<HTMLDivElement>(null);
    // Instance of the Referee class for validating moves.
    const referee = new Referee();


    // useEffect hook to calculate mandatory captures whenever the game state changes.
    useEffect(() => {
        if (!isMultipleCapture) {
            const captures = findAllMandatoryCaptures(
                pieces,
                currentTeam
            );
            // Updates the list of mandatory captures for the current team.
            setMandatoryCaptures(captures);
        }
    }, [currentTeam, pieces, isMultipleCapture]);


    // Function to grab a piece when clicked or touched.
    function grabPiece(e: React.MouseEvent) {
        const element = e.target as HTMLElement;
        const chessboard = chessboardRef.current;

        if (element.classList.contains('chess-piece') && chessboard) {
            // Calculate the grid position where the piece was picked up.
            const grabX = Math.floor((e.clientX - chessboard.offsetLeft) / TILE_SIZE);
            const grabY = Math.abs(
                Math.ceil((e.clientY - chessboard.offsetTop - BOARD_SIZE) / TILE_SIZE)
            );
            const piece = pieces.find(
                (p) => samePosition(p.position, { x: grabX, y: grabY })
            );
            // Prevents grabbing the piece if it's not the current team's turn or if the piece isn't mandatory.
            if (piece?.team !== currentTeam) {
                return;
            }
            if (mandatoryCaptures.length > 0) {
                const isMandatoryPiece = mandatoryCaptures.some(
                    (pos) => samePosition(pos, { x: grabX, y: grabY })
                );
                if (!isMandatoryPiece) {
                    return;
                }
            }
            if (isMultipleCapture && lastMovedPiece) {
                if (
                    grabX !== lastMovedPiece.position.x ||
                    grabY !== lastMovedPiece.position.y
                ) {
                    return;
                }
            }
            // Store the initial grabbed position and make the piece draggable.
            setGrabPosition({ x: grabX, y: grabY });
            const mouseX = e.clientX - TILE_SIZE/2;
            const mouseY = e.clientY - TILE_SIZE/2;
            element.style.zIndex = '100';
            element.style.position = 'absolute';
            element.style.left = `${mouseX}px`;
            element.style.top = `${mouseY}px`;
            setActivePiece(element);
        }
    }

    // Function to move a piece visually during dragging.
    function movePiece(e: React.MouseEvent) {
        const chessboard = chessboardRef.current;
        if (activePiece && chessboard) {
            // Define min/max boundaries for movement to keep the piece within the chessboard.
            const minX = chessboard.offsetLeft;
            const minY = chessboard.offsetTop;
            const maxX = chessboard.offsetLeft + chessboard.clientWidth - TILE_SIZE;
            const maxY = chessboard.offsetTop + chessboard.clientHeight - TILE_SIZE;
            const x = e.clientX - TILE_SIZE/2;
            const y = e.clientY - TILE_SIZE/2;
            activePiece.style.zIndex = '100';
            activePiece.style.position = 'absolute';

            // Update the position of the piece while ensuring it doesn't move outside the boundaries.
            if (x < minX) {
                activePiece.style.left = `${minX}px`;
            } else if (x > maxX) {
                activePiece.style.left = `${maxX}px`;
            } else {
                activePiece.style.left = `${x}px`;
            }

            if (y < minY) {
                activePiece.style.top = `${minY}px`;
            } else if (y > maxY) {
                activePiece.style.top = `${maxY}px`;
            } else {
                activePiece.style.top = `${y}px`;
            }
        }
    }

    // Handles the start of a touch gesture by translating it into mouse-based input.
    function handleTouchStart(e: React.TouchEvent) {
        const touch = e.touches[0]; // Take the first touch point.
        const mouseEvent = {
            clientX: touch.clientX, // Touch X-coordinate
            clientY: touch.clientY, // Touch Y-coordinate
            target: e.target,
        } as unknown as React.MouseEvent;
        grabPiece(mouseEvent);
    }

    // Handles movement during a touch gesture.
    function handleTouchMove(e: React.TouchEvent) {
        const touch = e.touches[0];
        const mouseEvent = {
            clientX: touch.clientX,
            clientY: touch.clientY,
            target: e.target,
        } as unknown as React.MouseEvent;
        movePiece(mouseEvent);
    }

    // Handles the end of a touch gesture by simulating the piece dropped behavior.
    function handleTouchEnd(e: React.TouchEvent) {
        const touch = e.changedTouches[0]; // Get the last touch position
        const mouseEvent = {
            clientX: touch.clientX, // Final X-coordinate
            clientY: touch.clientY, // Final Y-coordinate
            target: e.target,
        } as unknown as React.MouseEvent;
        dropPiece(mouseEvent);
    }

    // Handles when a piece is dropped onto the board grid.
    function dropPiece(e: React.MouseEvent) {
        const chessboard = chessboardRef.current;
        if (activePiece && chessboard) {
            // Convert drop position to grid coordinates
            const x = Math.floor((e.clientX - chessboard.offsetLeft) / TILE_SIZE);
            const y = Math.abs(
                Math.ceil((e.clientY - chessboard.offsetTop - BOARD_SIZE) / TILE_SIZE)
            );

            // Find the current piece being moved
            const currentPiece = pieces.find(
                (p) => samePosition(p.position, grabPosition)
            );

            if (currentPiece) {
                // Validate the move
                const moveResult = referee.isValidMove(
                    grabPosition,
                    { x, y },
                    currentPiece.type,
                    currentPiece.team,
                    pieces // Provide board state
                );

                let wasCapture = false; // Initialize flag for a capture move

                if (moveResult.success) {
                    let updatedPieces = pieces.map((piece) => {
                        // Update the position of the moved piece
                        if (samePosition(piece.position, currentPiece.position)) {
                            return { ...piece, position: { x, y } };
                        }
                        return piece;
                    });

                    // Remove the captured piece, if any
                    if (moveResult.capturedPiece) {
                        wasCapture = true; // Flag as a capture move
                        updatedPieces = updatedPieces.filter(
                            (p) =>
                                !samePosition(p.position, moveResult.capturedPiece!)
                        );
                    }

                    // Update piece state (e.g., promotion, next move, etc.)
                    updatedPieces = updatePiecesAfterMove(updatedPieces);
                    setPieces(updatedPieces);

                    // Check for additional capture moves
                    if (wasCapture) {
                        const additionalCaptures = hasMoreCaptures(
                            { x, y },
                            currentPiece.team,
                            updatedPieces,
                            currentPiece.type
                        );
                        if (additionalCaptures) {
                            // Multi-capture scenario: Update necessary states
                            setIsMultipleCapture(true);
                            setMandatoryCaptures([{ x, y }]);
                            setLastMovedPiece({
                                ...currentPiece,
                                position: { x, y },
                            });
                            return;
                        }
                    }

                    // Reset states for the next turn
                    setIsMultipleCapture(false);
                    setMandatoryCaptures([]);
                    setCurrentTeam((prevTeam) =>
                        prevTeam === TeamType.OUR
                            ? TeamType.OPPONENT
                            : TeamType.OUR
                    );
                    setLastMovedPiece(null);
                }
            }

            // Скидання стилів для перетягуваного елемента
            activePiece.style.zIndex = '1';
            activePiece.style.position = 'relative';
            activePiece.style.removeProperty('top');
            activePiece.style.removeProperty('left');
            setActivePiece(null);
        }
    }

    // Renders the tiles and pieces on the chessboard.
    const board = [];
    for (let j = VERTICAL_AXIS.length - 1; j >= 0; j--) {
        for (let i = 0; i < HORIZONTAL_AXIS.length; i++) {
            const number = j + i + 2;
            let image = undefined;
            const isHighlighted = mandatoryCaptures.some(
                (pos) =>  samePosition(pos, {x: i, y: j}));
            const piece = pieces.find(p => samePosition(p.position, {x: i, y: j}));
            image = piece ? piece.image : undefined;
            board.push(
                <Tile
                    key={`${j},${i}`}
                    image={image}
                    number={number}
                    isHighlighted={isHighlighted}
                />
            );
        }
    }

    return (
        <>
            <div className="game-info">
                Turn: {currentTeam === TeamType.OUR ? 'Green' : 'Red'}
            </div>
            <div
                onMouseMove={(e) => movePiece(e)}
                onMouseDown={(e) => grabPiece(e)}
                onMouseUp={(e) => dropPiece(e)}
                onTouchStart={(e) => handleTouchStart(e)}
                onTouchMove={(e) => handleTouchMove(e)}
                onTouchEnd={(e) => handleTouchEnd(e)}
                id="chessboard"
                ref={chessboardRef}
            >
                {board}
            </div>
        </>
    );
}
