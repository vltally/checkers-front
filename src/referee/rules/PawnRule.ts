import {MoveResult, Piece, Position, TeamType} from "../../Constants.ts";
import {findAllMandatoryCaptures, tileIsOccupied, tileIsOccupiedByOpponent} from "./GeneralRules.ts";

export const pawnMove = (
    initialPosition: Position,
    desiredPosition: Position,
    team: TeamType,
    boardState: Piece[]
): MoveResult => {
    const direction = team === TeamType.OUR ? 1 : -1;
    const result: MoveResult = { success: false };

    // Check for mandatory captures
    const mandatoryCaptures = findAllMandatoryCaptures(boardState, team);
    if (mandatoryCaptures.length > 0) {
        // Allow only capture moves if mandatory captures exist
        const isCapture =
            Math.abs(desiredPosition.x - initialPosition.x) === 2 &&
            Math.abs(desiredPosition.y - initialPosition.y) === 2;

        if (!isCapture) {
            return result; // Block other moves
        }
    }

    // Handle standard moves
    if (
        Math.abs(desiredPosition.x - initialPosition.x) === 1 &&
        desiredPosition.y - initialPosition.y === direction
    ) {
        if (!tileIsOccupied(desiredPosition, boardState)) {
            result.success = true;
        }
        return result;
    }

    // Handle captures
    if (
        Math.abs(desiredPosition.x - initialPosition.x) === 2 &&
        Math.abs(desiredPosition.y - initialPosition.y) === 2
    ) {
        const midX = initialPosition.x + (desiredPosition.x - initialPosition.x) / 2;
        const midY = initialPosition.y + (desiredPosition.y - initialPosition.y) / 2;

        if (
            !tileIsOccupied(desiredPosition, boardState) &&
            tileIsOccupiedByOpponent({ x: midX, y: midY }, boardState, team)
        ) {
            result.success = true;
            result.capturedPiece = { x: midX, y: midY }; // Provide the captured piece's position
        }
    }

    return result;
};

export const hasMoreCapturesPawn = (
    position: Position,
    team: TeamType,
    boardState: Piece[]
): boolean => {
    // Define the directions a Pawn can move for captures
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

        // Check if the destination tile is free and there is an opponent to capture
        if (
            // Check if the destination is within bounds
            newX >= 0 &&
            newX < 8 &&
            newY >= 0 &&
            newY < 8 &&
            // The destination tile must be empty
            !tileIsOccupied({ x: newX, y: newY }, boardState) &&
            // There must be an opponent piece at the midpoint
            tileIsOccupiedByOpponent(
                { x: midX, y: midY },
                boardState,
                team
            )
        ) {
            return true;
        }
    }
    return false;
}