import {Piece, PieceType, Position, TeamType} from '../Constants';

export default class Referee {

    // Checks if a specific board tile is occupied by any piece.
    tileIsOccupied(position: Position, boardState: Piece[]): boolean {
        return boardState.some((p) => p.position.x === position.x && p.position.y === position.y);
    }

    // Checks if a specific board tile is occupied by a piece from the opponent's team.
    tileIsOccupiedByOpponent(
        position: Position,
        boardState: Piece[],
        team: TeamType
    ): boolean {
        return boardState.some(
            (p) => p.position.x === position.x && p.position.y === position.y && p.team !== team
        );
    }

    // Validates if a move is legal based on the rules for each piece type, including mandatory captures.
    isValidMove(
        initialPosition: Position,
        desiredPosition: Position,
        type: PieceType,
        team: TeamType,
        boardState: Piece[],
        captureCallback: (midX: number, midY: number) => void
    ): boolean {
        if (type === PieceType.PAWN) {
            console.log(1);
            const direction = team === TeamType.OUR ? 1 : -1;

            // Check for mandatory captures first
            const mandatoryCaptures = this.findAllMandatoryCaptures(
                boardState,
                team
            );
            if (mandatoryCaptures.length > 0) {
                // Only allow capture moves when there are mandatory captures
                const isCapture =
                    Math.abs(desiredPosition.x - initialPosition.x) === 2 && Math.abs(desiredPosition.y - initialPosition.y) === 2;
                if (!isCapture) {
                    //Blocks other moves if captures are mandatory.
                    return false;
                }
            }

            // Handles regular moves.
            if (Math.abs(desiredPosition.x - initialPosition.x) === 1 && desiredPosition.y - initialPosition.y === direction) {
                return !this.tileIsOccupied(desiredPosition, boardState);
            }

            // Handles capture moves.
            if (Math.abs(desiredPosition.x - initialPosition.x) === 2 && Math.abs(desiredPosition.y - initialPosition.y) === 2) {
                const midX = initialPosition.x + (desiredPosition.x - initialPosition.x) / 2;
                const midY = initialPosition.y + (desiredPosition.y - initialPosition.y) / 2;

                // Checks if the destination tile is empty and there is an opponent piece to capture.
                if (
                    !this.tileIsOccupied(desiredPosition, boardState) && // Клітина повинна бути вільною
                    !this.tileIsOccupiedByOpponent(desiredPosition, boardState, team) && // Не зайнята ворожою
                    this.tileIsOccupiedByOpponent({x: midX, y: midY}, boardState, team) // Можливе захоплення
                ) {
                    captureCallback(midX, midY);
                    // Calls capture logic.
                    return true;
                }
            }
        }

        if (type === PieceType.KING) {
            const dx = desiredPosition.x - initialPosition.x;
            const dy = desiredPosition.y - initialPosition.y;

            // Checks for mandatory captures.
            const mandatoryCaptures = this.findAllMandatoryCaptures(
                boardState,
                team
            );
            if (mandatoryCaptures.length > 0) {
                const isCapture =
                    Math.abs(dx) === Math.abs(dy) && Math.abs(dx) > 1;
                // Ensures diagonal capture.
                if (!isCapture) {
                    return false;
                }
            }

            // Allows only diagonal movement.
            if (Math.abs(dx) !== Math.abs(dy)) {
                return false;
            }

            // Checks if the path for the King is clear.
            const stepX = dx > 0 ? 1 : -1;
            const stepY = dy > 0 ? 1 : -1;
            let currentX = initialPosition.x + stepX;
            let currentY = initialPosition.y + stepY;

            let opponentFound = false; // Tracks if an opponent is found for capture.
            let midX = -1;
            let midY = -1;

            while (currentX !== desiredPosition.x && currentY !== desiredPosition.y) {
                if (this.tileIsOccupied({x: currentX, y: currentY}, boardState)) {
                    if (
                        this.tileIsOccupiedByOpponent(
                            { x:currentX, y: currentY },
                            boardState,
                            team
                        )
                    ) {
                        if (opponentFound) {
                            // Second occupied tile blocks movement.
                            return false;
                        }

                        opponentFound = true;
                        midX = currentX;
                        midY = currentY;
                    } else {
                        return false;
                        // Blocked by a piece of the same team.
                    }
                }
                currentX += stepX;
                currentY += stepY;
            }

            if (opponentFound) {
                if (
                    this.tileIsOccupiedByOpponent(desiredPosition, boardState, team) ||
                    this.tileIsOccupied(desiredPosition, boardState)
                ) {
                    return false;
                }
                captureCallback(midX, midY);
                return true;
            }

            // Allows normal move only if no mandatory captures exist.
            return mandatoryCaptures.length === 0;
        }

        return false;
    }

    // Checks if a given piece has available capture moves.
    hasMoreCaptures(
        position: Position,
        team: TeamType,
        boardState: Piece[],
        type: PieceType
    ): boolean {
        if (type === PieceType.KING) {
            return this.hasMoreCapturesKing(position, team, boardState);
        }

        // All possible directions for capture.
        const directions = [
            { dx: 2, dy: 2 },
            { dx: 2, dy: -2 },
            { dx: -2, dy: 2 },
            { dx: -2, dy: -2 },
        ];

        for (const dir of directions) {
            const newX = position.x + dir.dx;
            const newY = position.y + dir.dy;
            const midX = position.x + dir.dx / 2;
            const midY = position.y + dir.dy / 2;

            // Verifies that the move ends in an empty tile and captures an opponent piece.
            if (
                newX >= 0 &&
                newX < 8 &&
                newY >= 0 &&
                newY < 8 &&
                !this.tileIsOccupied({x: newX, y: newY}, boardState) && // ПЕРЕВІРКА ВІЛЬНОЇ КІНЦЕВОЇ ПЛИТКИ
                this.tileIsOccupiedByOpponent({x: midX, y:midY}, boardState, team)
            ) {
                return true;
            }
        }

        return false;
    }

    // Identifies all pieces eligible for mandatory captures.
    findAllMandatoryCaptures(
        boardState: Piece[],
        team: TeamType
    ): { x: number; y: number }[] {
        const mandatoryCaptures: { x: number; y: number }[] = [];

        boardState.forEach((piece) => {
            if (piece.team === team) {
                const hasCaptures =
                    piece.type === PieceType.KING
                        ? this.hasMoreCapturesKing(
                              piece.position,
                              team,
                              boardState
                          )
                        : this.hasMoreCaptures(
                              piece.position,
                              team,
                              boardState,
                              piece.type
                          );

                if (hasCaptures) {
                    mandatoryCaptures.push({ x: piece.position.x, y: piece.position.y });
                }
            }
        });

        return mandatoryCaptures;
    }

    // Checks if the King piece has more capturing options.
    hasMoreCapturesKing(
        position: Position,
        team: TeamType,
        boardState: Piece[]
    ): boolean {
        // All diagonal directions for moving the King.
        const directions = [
            { stepX: 1, stepY: 1 },
            { stepX: 1, stepY: -1 },
            { stepX: -1, stepY: 1 },
            { stepX: -1, stepY: -1 },
        ];

        for (const dir of directions) {
            let currentX = position.x + dir.stepX;
            let currentY = position.y + dir.stepY;
            let opponentFound = false;

            // Loop through possible moves in one direction.
            while (
                currentX >= 0 &&
                currentX < 8 &&
                currentY >= 0 &&
                currentY < 8
            ) {
                if (this.tileIsOccupied({x: currentX, y: currentY}, boardState)) {
                    if (
                        this.tileIsOccupiedByOpponent(
                            {x: currentX, y: currentY},
                            boardState,
                            team
                        ) &&
                        !opponentFound
                    ) {
                        // Found an opponent for capture.
                        opponentFound = true;
                    } else {
                        // A piece blocks further movement.
                        break;
                    }
                } else if (opponentFound) {
                    // Found a valid capture move.
                    return true;
                }

                currentX += dir.stepX;
                currentY += dir.stepY;
            }
        }

        return false;
    }

    // Promotes a piece to a King if it reaches the opponent's back rank.
    promoteToKing(piece: Piece): Piece {
        if (
            (piece.team === TeamType.OUR && piece.position.y === 7) ||
            (piece.team === TeamType.OPPONENT && piece.position.y === 0)
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

    // Checks and updates all pieces on the board for possible promotions after a move.
    updatePiecesAfterMove(pieces: Piece[]): Piece[] {
        return pieces.map((piece) => this.promoteToKing(piece));
    }
}
