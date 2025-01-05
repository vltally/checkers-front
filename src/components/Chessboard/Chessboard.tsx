import { useEffect, useRef, useState } from 'react';
import Referee from '../../referee/Referee';
import Tile from '../Tile/Tile';
import './Chessboard.css';

const verticalAxis = ['1', '2', '3', '4', '5', '6', '7', '8'];
const horizontalAxis = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

export interface Piece {
    image: string;
    x: number;
    y: number;
    type: PieceType;
    team: TeamType;
}

export enum PieceType {
    PAWN,
    KING,
}

export enum TeamType {
    OPPONENT,
    OUR,
}

const initialBoardState: Piece[] = [];

const rows = [
    {
        y: 0,
        start: 0,
        step: 2,
        image: '/src/assets/images/pawn_g.png',
        team: TeamType.OUR,
    },
    {
        y: 1,
        start: 1,
        step: 2,
        image: '/src/assets/images/pawn_g.png',
        team: TeamType.OUR,
    },
    {
        y: 2,
        start: 0,
        step: 2,
        image: '/src/assets/images/pawn_g.png',
        team: TeamType.OUR,
    },
    {
        y: 5,
        start: 1,
        step: 2,
        image: '/src/assets/images/pawn_r.png',
        team: TeamType.OPPONENT,
    },
    {
        y: 6,
        start: 0,
        step: 2,
        image: '/src/assets/images/pawn_r.png',
        team: TeamType.OPPONENT,
    },
    {
        y: 7,
        start: 1,
        step: 2,
        image: '/src/assets/images/pawn_r.png',
        team: TeamType.OPPONENT,
    },
];

rows.forEach(({ y, start, step, image, team }) => {
    for (let x = start; x < 8; x += step) {
        initialBoardState.push({ image, x, y, type: PieceType.PAWN, team });
    }
});


export default function Chessboard() {
    const [activePiece, setActivePiece] = useState<HTMLElement | null>(null);
    const [gridX, setGridX] = useState(0);
    const [gridY, setGridY] = useState(0);
    const [pieces, setPieces] = useState<Piece[]>(initialBoardState);
    const [currentTeam, setCurrentTeam] = useState<TeamType>(TeamType.OUR);
    const [mandatoryCaptures, setMandatoryCaptures] = useState<
        { x: number; y: number }[]
    >([]);
    const [isMultipleCapture, setIsMultipleCapture] = useState(false);
    const [lastMovedPiece, setLastMovedPiece] = useState<Piece | null>(null);

    const chessboardRef = useRef<HTMLDivElement>(null);
    const referee = new Referee();

    useEffect(() => {
        if (!isMultipleCapture) {
            const captures = referee.findAllMandatoryCaptures(
                pieces,
                currentTeam
            );
            setMandatoryCaptures(captures);
        }
    }, [currentTeam, pieces, isMultipleCapture]);



    function grabPiece(e: React.MouseEvent) {
        const element = e.target as HTMLElement;
        const chessboard = chessboardRef.current;

        if (element.classList.contains('chess-piece') && chessboard) {
            const x = Math.floor((e.clientX - chessboard.offsetLeft) / 100);
            const y = Math.abs(
                Math.ceil((e.clientY - chessboard.offsetTop - 800) / 100)
            );

            const piece = pieces.find((p) => p.x === x && p.y === y);

            if (piece?.team !== currentTeam) {
                return;
            }

            if (mandatoryCaptures.length > 0) {
                const isMandatoryPiece = mandatoryCaptures.some(
                    (pos) => pos.x === x && pos.y === y
                );
                if (!isMandatoryPiece) {
                    return;
                }
            }

            if (isMultipleCapture && lastMovedPiece) {
                if (x !== lastMovedPiece.x || y !== lastMovedPiece.y) {
                    return;
                }
            }

            setGridX(x);
            setGridY(y);

            const mouseX = e.clientX - 50;
            const mouseY = e.clientY - 50;
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
            const maxX = chessboard.offsetLeft + chessboard.clientWidth - 100;
            const maxY = chessboard.offsetTop + chessboard.clientHeight - 100;
            const x = e.clientX - 50;
            const y = e.clientY - 50;
            activePiece.style.zIndex = '100';
            activePiece.style.position = 'absolute';

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


    function handleTouchStart(e: React.TouchEvent) {

        const touch = e.touches[0]; // Беремо перший елемент із дотиків
        const mouseEvent = {
            clientX: touch.clientX, // Координати дотику
            clientY: touch.clientY,
            target: e.target,
        } as unknown as React.MouseEvent;
        grabPiece(mouseEvent);
    }

    function handleTouchMove(e: React.TouchEvent) {

        const touch = e.touches[0];
        const mouseEvent = {
            clientX: touch.clientX,
            clientY: touch.clientY,
            target: e.target,
        } as unknown as React.MouseEvent;
        movePiece(mouseEvent);
    }

    function handleTouchEnd(e: React.TouchEvent) {

        const touch = e.changedTouches[0]; // Визначаємо останнє положення дотику
        const mouseEvent = {
            clientX: touch.clientX, // Отримуємо фінальні координати
            clientY: touch.clientY,
            target: e.target,
        } as unknown as React.MouseEvent;
        dropPiece(mouseEvent);
    }

    function dropPiece(e: React.MouseEvent) {
        const chessboard = chessboardRef.current;
        if (activePiece && chessboard) {
            const x = Math.floor((e.clientX - chessboard.offsetLeft) / 100);
            const y = Math.abs(
                Math.ceil((e.clientY - chessboard.offsetTop - 800) / 100)
            );

            const currentPiece = pieces.find(
                (p) => p.x === gridX && p.y === gridY
            );

            if (currentPiece) {
                let wasCapture = false;
                let updatedPieces = [...pieces];

                // Виконуємо перевірку на валідність ходу
                const validMove = referee.isValidMove(
                    gridX,
                    gridY,
                    x,
                    y,
                    currentPiece.type,
                    currentPiece.team,
                    pieces,
                    (midX, midY) => {
                        wasCapture = true;
                        updatedPieces = pieces.filter((p) => !(p.x === midX && p.y === midY));
                    }
                );

                if (validMove) {
                    // Оновлюємо позицію активної фігури
                    updatedPieces = updatedPieces.map((piece) => {
                        if (piece.x === currentPiece.x && piece.y === currentPiece.y) {
                            return { ...piece, x, y };
                        }
                        return piece;
                    });

                    // Застосовуємо додатковий рефакторинг
                    updatedPieces = referee.updatePiecesAfterMove(updatedPieces);

                    // Оновлюємо стан
                    setPieces(updatedPieces);

                    if (wasCapture) {
                        // Перевірка на можливість додаткового побиття з ОНОВЛЕНИМ станом
                        const additionalCaptures = referee.hasMoreCaptures(
                            x,
                            y,
                            currentPiece.team,
                            updatedPieces, // Використовуємо оновлений стан
                            currentPiece.type
                        );

                        if (additionalCaptures) {
                            setIsMultipleCapture(true);
                            setMandatoryCaptures([{ x, y }]);
                            setLastMovedPiece({ ...currentPiece, x, y });
                            return;
                        }
                    }

                    // Скидаємо всі стани для наступного ходу
                    setIsMultipleCapture(false);
                    setMandatoryCaptures([]);
                    setCurrentTeam((prevTeam) =>
                        prevTeam === TeamType.OUR ? TeamType.OPPONENT : TeamType.OUR
                    );
                    setLastMovedPiece(null);
                }
            }

            // Скидаємо стилі вибраної фігури
            activePiece.style.zIndex = '1';
            activePiece.style.position = 'relative';
            activePiece.style.removeProperty('top');
            activePiece.style.removeProperty('left');
            setActivePiece(null);
        }
    }

    const board = [];

    for (let j = verticalAxis.length - 1; j >= 0; j--) {
        for (let i = 0; i < horizontalAxis.length; i++) {
            const number = j + i + 2;
            let image = undefined;
            const isHighlighted = mandatoryCaptures.some(
                (pos) => pos.x === i && pos.y === j
            );

            pieces.forEach((p) => {
                if (p.x === i && p.y === j) {
                    image = p.image;
                }
            });

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
