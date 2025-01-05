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

                // ПЕРЕВІРКА КІНЦЕВОЇ КЛІТИНКИ
                if (
                    !this.tileIsOccupied(x, y, boardState) && // Клітина повинна бути вільною
                    !this.tileIsOccupiedByOpponent(x, y, boardState, team) && // Не зайнята ворожою
                    this.tileIsOccupiedByOpponent(midX, midY, boardState, team) // Можливе захоплення
                ) {
                    captureCallback(midX, midY);
                    return true;
                }
            }
        }

        if (type === PieceType.KING) {
            const dx = x - px;
            const dy = y - py;

            // Перевірка на обов’язкові захоплення
            const mandatoryCaptures = this.findAllMandatoryCaptures(boardState, team);
            if (mandatoryCaptures.length > 0) {
                const isCapture = Math.abs(dx) === Math.abs(dy) && Math.abs(dx) > 1; // Тільки захоплення
                if (!isCapture) {
                    return false; // Якщо є обов’язкові захоплення, забороняємо звичайний рух
                }
            }

            // Дозволено лише діагональний рух
            if (Math.abs(dx) !== Math.abs(dy)) {
                return false;
            }

            // Перевірка, чи шлях вільний
            const stepX = dx > 0 ? 1 : -1;
            const stepY = dy > 0 ? 1 : -1;
            let currentX = px + stepX;
            let currentY = py + stepY;

            let opponentFound = false; // Слідкуємо, чи знайдено суперника
            let midX = -1;
            let midY = -1;

            while (currentX !== x && currentY !== y) {
                if (this.tileIsOccupied(currentX, currentY, boardState)) {
                    if (
                        this.tileIsOccupiedByOpponent(currentX, currentY, boardState, team)
                    ) {
                        if (opponentFound) {
                            // Знайдено зайву фігуру, рух неможливий
                            return false;
                        }
                        // Помічаємо суперника для потенційного захоплення
                        opponentFound = true;
                        midX = currentX;
                        midY = currentY;
                    } else {
                        // Шлях заблоковано своєю фігурою
                        return false;
                    }
                }
                currentX += stepX;
                currentY += stepY;
            }

            // Якщо знайдено суперника — дозволяємо захоплення
            if (opponentFound) {
                if (this.tileIsOccupiedByOpponent(x, y, boardState, team) || this.tileIsOccupied(x, y, boardState)) {
                    return false;
                }
                captureCallback(midX, midY);
                return true;
            }

            // Дозволяємо звичайний рух лише за відсутності обов'язкових захоплень
            return mandatoryCaptures.length === 0;
        }

        return false;
    }

    // Check if a piece has more captures available
    hasMoreCaptures(
        x: number,
        y: number,
        team: TeamType,
        boardState: Piece[],
        type: PieceType
    ): boolean {

        if (type === PieceType.KING) {
            return this.hasMoreCapturesKing(x, y, team, boardState);
        }

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
                !this.tileIsOccupied(newX, newY, boardState) && // ПЕРЕВІРКА ВІЛЬНОЇ КІНЦЕВОЇ ПЛИТКИ
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
                const hasCaptures =
                    piece.type === PieceType.KING
                        ? this.hasMoreCapturesKing(piece.x, piece.y, team, boardState)
                        : this.hasMoreCaptures(piece.x, piece.y, team, boardState, piece.type);

                if (hasCaptures) {
                    mandatoryCaptures.push({ x: piece.x, y: piece.y });
                }
            }
        });

        return mandatoryCaptures;
    }

    hasMoreCapturesKing(
        x: number,
        y: number,
        team: TeamType,
        boardState: Piece[]
    ): boolean {
        const directions = [
            { stepX: 1, stepY: 1 },
            { stepX: 1, stepY: -1 },
            { stepX: -1, stepY: 1 },
            { stepX: -1, stepY: -1 },
        ];

        for (const dir of directions) {
            let currentX = x + dir.stepX;
            let currentY = y + dir.stepY;
            let opponentFound = false;

            while (currentX >= 0 && currentX < 8 && currentY >= 0 && currentY < 8) {
                if (this.tileIsOccupied(currentX, currentY, boardState)) {
                    if (
                        this.tileIsOccupiedByOpponent(currentX, currentY, boardState, team) &&
                        !opponentFound
                    ) {
                        // Знайшли суперника, якого можна побити
                        opponentFound = true;
                    } else {
                        // Якщо знайшли другу фігуру, рух неможливий
                        break;
                    }
                } else if (opponentFound) {
                    // Якщо суперник був знайдений, а ця клітинка вільна — можливе захоплення
                    return true;
                }

                currentX += dir.stepX;
                currentY += dir.stepY;
            }
        }

        return false;
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
