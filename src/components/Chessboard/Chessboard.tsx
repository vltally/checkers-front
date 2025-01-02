import { useRef, useState } from 'react';
import Tile from '../Tile/Tile';
import './Chessboard.css';

const verticalAxis = ['1', '2', '3', '4', '5', '6', '7', '8'];
const horizontalAxis = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

interface Piece {
    image: string;
    x: number;
    y: number;
}

const initialBoardState: Piece[] = [];

const rows = [
    { y: 0, start: 0, step: 2, image: '/src/assets/images/pawn_g.png' },
    { y: 1, start: 1, step: 2, image: '/src/assets/images/pawn_g.png' },
    { y: 2, start: 0, step: 2, image: '/src/assets/images/pawn_g.png' },
    { y: 5, start: 1, step: 2, image: '/src/assets/images/pawn_r.png' },
    { y: 6, start: 0, step: 2, image: '/src/assets/images/pawn_r.png' },
    { y: 7, start: 1, step: 2, image: '/src/assets/images/pawn_r.png' },
];

rows.forEach(({ y, start, step, image }) => {
    for (let x = start; x < 8; x += step) {
        initialBoardState.push({ image, x, y });
    }
});

export default function Chessboard() {
    const [activePiece, setActivePiece] = useState<HTMLElement | null>(null);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [gridX, setGridX] = useState(0);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [gridY, setGridY] = useState(0);
    const [pieces, setPieces] = useState<Piece[]>(initialBoardState);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const chessboardRef = useRef<HTMLDivElement>(null);

    function grabPiece(e: React.MouseEvent) {
        const element = e.target as HTMLElement;
        const chessboard = chessboardRef.current;

        if (element.classList.contains('chess-piece') && chessboard) {
            setGridX(Math.floor((e.clientX - chessboard.offsetLeft) / 100));
            setGridY(
                Math.abs(
                    Math.ceil((e.clientY - chessboard.offsetTop - 800) / 100)
                )
            );
            const x = e.clientX - 50;
            const y = e.clientY - 50;
            element.style.position = 'absolute';
            element.style.left = `${x}px`;
            element.style.top = `${y}px`;
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

    // function dropPiece(e: React.MouseEvent) {
    //     const chessboard = chessboardRef.current;
    //     if (activePiece && chessboard) {
    //         const x = Math.floor((e.clientX - chessboard.offsetLeft) / 100);
    //         const y = Math.abs(
    //             Math.ceil((e.clientY - chessboard.offsetTop - 800) / 100)
    //         );

    //         console.log(x, y);

    //         setPieces((value) => {
    //             const pieces = value.map((p) => {
    //                 if (p.x === gridX && p.y === gridY) {
    //                     p.x = x;
    //                     p.y = y;
    //                 }
    //                 return p;
    //             });
    //             return pieces;
    //         });

    //         setActivePiece(null);
    //     }
    // }

    function dropPiece(e: React.MouseEvent) {
        const chessboard = chessboardRef.current;
        if (activePiece && chessboard) {
            const x = Math.floor((e.clientX - chessboard.offsetLeft) / 100);
            const y = Math.abs(
                Math.ceil((e.clientY - chessboard.offsetTop - 800) / 100)
            );

            // Скидаємо стилі активної шашки
            activePiece.style.position = '';
            activePiece.style.left = '';
            activePiece.style.top = '';

            setPieces((value) => {
                const pieces = value.map((p) => {
                    if (p.x === gridX && p.y === gridY) {
                        p.x = x;
                        p.y = y;
                    }
                    return p;
                });
                return pieces;
            });

            setActivePiece(null);
        }
    }

    const board = [];

    for (let j = verticalAxis.length - 1; j >= 0; j--) {
        for (let i = 0; i < horizontalAxis.length; i++) {
            const number = j + i + 2;
            let image = undefined;

            pieces.forEach((p) => {
                if (p.x === i && p.y === j) {
                    image = p.image;
                }
            });
            board.push(
                <Tile key={`${j},${i}`} image={image} number={number} />
            );
        }
    }

    return (
        <div
            onMouseMove={(e) => movePiece(e)}
            onMouseDown={(e) => grabPiece(e)}
            onMouseUp={(e) => dropPiece(e)}
            id="chessboard"
            ref={chessboardRef}
        >
            {board}
        </div>
    );
}
