import {MoveResult, Piece, PieceType, Position, TeamType} from "../../Constants.ts";
import {findAllMandatoryCaptures, tileIsOccupied, tileIsOccupiedByOpponent} from "./GeneralRules.ts";

export const kingMove = (
    initialPosition: Position,
    desiredPosition: Position,
    team: TeamType,
    boardState: Piece[]
): MoveResult => {
    const dx = desiredPosition.x - initialPosition.x;
    const dy = desiredPosition.y - initialPosition.y;
    const result: MoveResult = { success: false };

    // Перевірка на обов'язкове захоплення
    const mandatoryCaptures = findAllMandatoryCaptures(boardState, team);
    if (mandatoryCaptures.length > 0) {
        const isCapture = Math.abs(dx) === Math.abs(dy) && Math.abs(dx) > 1;
        if (!isCapture) {
            return result; // Інші рухи заблоковано
        }
    }

    // Перевірка руху по діагоналі
    if (Math.abs(dx) !== Math.abs(dy)) {
        return result;
    }

    const stepX = dx > 0 ? 1 : -1;
    const stepY = dy > 0 ? 1 : -1;
    let currentX = initialPosition.x + stepX;
    let currentY = initialPosition.y + stepY;

    let opponentFound = false; // Прапорець, чи знайдено фігуру для захоплення
    let midX = -1;
    let midY = -1;

    while (currentX !== desiredPosition.x && currentY !== desiredPosition.y) {
        if (tileIsOccupied({ x: currentX, y: currentY }, boardState)) {
            if (
                tileIsOccupiedByOpponent({ x: currentX, y: currentY }, boardState, team)
            ) {
                if (opponentFound) {
                    return result; // Неможливо: блокують інші фігури
                }
                opponentFound = true;
                midX = currentX;
                midY = currentY;
            } else {
                return result; // Блокування своїм гравцем
            }
        }
        currentX += stepX;
        currentY += stepY;
    }

    // Обробка захоплення
    if (opponentFound) {
        if (tileIsOccupied(desiredPosition, boardState)) {
            return result;
        }
        result.success = true;
        result.capturedPiece = { x: midX, y: midY }; // Передаємо позицію захопленої фігури
        return result;
    }

    // Звичайний рух дозволяється лише за відсутністю захоплень
    result.success = mandatoryCaptures.length === 0;
    return result;
};

// Promotes a piece to a King if it reaches the opponent's back rank.
export const promoteToKing = (piece: Piece): Piece => {
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

// Checks if the King piece has more capturing options.
export const hasMoreCapturesKing = (
    position: Position,
    team: TeamType,
    boardState: Piece[]
): boolean => {
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
            if (tileIsOccupied({x: currentX, y: currentY}, boardState)) {
                if (
                    tileIsOccupiedByOpponent(
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
