import {
    Piece,
    PieceType,
    TeamType,
} from '../components/Chessboard/Chessboard';

export default class Referee {
    tileIsOccupied(x: number, y: number, boardState: Piece[]): boolean {
        return boardState.some((p) => p.x === x && p.y === y);
    }

    tileIsOccupiedByOpponent(
        x: number,
        y: number,
        boardState: Piece[],
        team: TeamType
    ): boolean {
        return boardState.some(
            (p) => p.x === x && p.y === y && p.team !== team
        );
    }

    isValidMove(
        px: number,
        py: number,
        x: number,
        y: number,
        type: PieceType,
        team: TeamType,
        boardState: Piece[],
        captureCallback: (midX: number, midY: number) => void
    ): boolean {
        if (type === PieceType.PAWN) {
            const direction = team === TeamType.OUR ? 1 : -1;

            // Check for mandatory captures first
            const mandatoryCaptures = this.findAllMandatoryCaptures(
                boardState,
                team
            );
            if (mandatoryCaptures.length > 0) {
                // Only allow capture moves when there are mandatory captures
                const isCapture =
                    Math.abs(x - px) === 2 && Math.abs(y - py) === 2;
                if (!isCapture) {
                    return false;
                }
            }

            // Regular move
            if (Math.abs(x - px) === 1 && y - py === direction) {
                return !this.tileIsOccupied(x, y, boardState);
            }

            // Capture move
            if (Math.abs(x - px) === 2 && Math.abs(y - py) === 2) {
                const midX = px + (x - px) / 2;
                const midY = py + (y - py) / 2;

                if (
                    !this.tileIsOccupied(x, y, boardState) &&
                    this.tileIsOccupiedByOpponent(midX, midY, boardState, team)
                ) {
                    captureCallback(midX, midY);
                    return true;
                }
            }
        }

        if (type === PieceType.KING) {
            const dx = x - px;
            const dy = y - py;

            // Check if move is diagonal
            if (Math.abs(dx) !== Math.abs(dy)) {
                return false;
            }

            // Check if path is clear
            const stepX = dx > 0 ? 1 : -1;
            const stepY = dy > 0 ? 1 : -1;
            let currentX = px + stepX;
            let currentY = py + stepY;

            let hasCaptured = false;
            let opponentFound = false;
            let midX = -1;
            let midY = -1;

            while (currentX !== x && currentY !== y) {
                if (this.tileIsOccupied(currentX, currentY, boardState)) {
                    if (
                        this.tileIsOccupiedByOpponent(
                            currentX,
                            currentY,
                            boardState,
                            team
                        )
                    ) {
                        if (opponentFound) {
                            // Already found an opponent, invalid move
                            return false;
                        }
                        opponentFound = true;
                        midX = currentX;
                        midY = currentY;
                    } else {
                        // Path is blocked by own piece
                        return false;
                    }
                }
                currentX += stepX;
                currentY += stepY;
            }

            if (opponentFound) {
                captureCallback(midX, midY);
                return true; // Дозволяємо переміщення після захоплення
            }
            return true; // Дозволяємо звичайний рух, якщо шлях вільний
        }

        return false;
    }

    // Check if a piece has more captures available
    hasMoreCaptures(
        x: number,
        y: number,
        team: TeamType,
        boardState: Piece[]
    ): boolean {
        const directions = [
            { dx: 2, dy: 2 },
            { dx: 2, dy: -2 },
            { dx: -2, dy: 2 },
            { dx: -2, dy: -2 },
        ];

        for (const dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            const midX = x + dir.dx / 2;
            const midY = y + dir.dy / 2;

            if (
                newX >= 0 &&
                newX < 8 &&
                newY >= 0 &&
                newY < 8 &&
                !this.tileIsOccupied(newX, newY, boardState) &&
                this.tileIsOccupiedByOpponent(midX, midY, boardState, team)
            ) {
                return true;
            }
        }

        return false;
    }

    // Find all pieces that have mandatory captures
    findAllMandatoryCaptures(
        boardState: Piece[],
        team: TeamType
    ): { x: number; y: number }[] {
        const mandatoryCaptures: { x: number; y: number }[] = [];

        boardState.forEach((piece) => {
            if (piece.team === team) {
                if (this.hasMoreCaptures(piece.x, piece.y, team, boardState)) {
                    mandatoryCaptures.push({ x: piece.x, y: piece.y });
                }
            }
        });

        return mandatoryCaptures;
    }

    promoteToKing(piece: Piece): Piece {
        if (
            (piece.team === TeamType.OUR && piece.y === 7) ||
            (piece.team === TeamType.OPPONENT && piece.y === 0)
        ) {
            return {
                ...piece,
                type: PieceType.KING,
                image:
                    piece.team === TeamType.OUR
                        ? '/src/assets/images/king_g.png'
                        : '/src/assets/images/king_r.png',
            };
        }
        return piece;
    }

    updatePiecesAfterMove(pieces: Piece[]): Piece[] {
        return pieces.map((piece) => this.promoteToKing(piece));
    }
}
