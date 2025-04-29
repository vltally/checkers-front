import {Piece, PieceType, Position, TeamType} from "../../Constants.ts";
import { hasMoreCapturesKing, promoteToKing } from "./KingRule.ts"
import { hasMoreCapturesPawn } from "./PawnRule.ts";


// Checks if a specific board tile is occupied by a piece from the opponent's team.
export const tileIsOccupiedByOpponent = (
    position: Position,
    boardState: Piece[],
    team: TeamType
): boolean => {
    return boardState.some(
        (p) => p.position.x === position.x && p.position.y === position.y && p.team !== team
    );
}

// Checks if a specific board tile is occupied by any piece.
export const tileIsOccupied = (position: Position, boardState: Piece[]): boolean => {
    return boardState.some((p) => p.position.x === position.x && p.position.y === position.y);
}

// Checks and updates all pieces on the board for possible promotions after a move.
export const  updatePiecesAfterMove = (pieces: Piece[]): Piece[] => {
    return pieces.map((piece) => promoteToKing(piece));
}

// Identifies all pieces eligible for mandatory captures.
export const findAllMandatoryCaptures = (
    boardState: Piece[],
    team: TeamType
):  Position[]  => {
    const mandatoryCaptures: { x: number; y: number }[] = [];

    boardState.forEach((piece) => {
        if (piece.team === team) {
            const hasCaptures =
                piece.type === PieceType.KING
                    ? hasMoreCapturesKing(
                        piece.position,
                        team,
                        boardState
                    )
                    : hasMoreCaptures(
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


// Checks if a given piece has available capture moves.
export const hasMoreCaptures =(
    position: Position,
    team: TeamType,
    boardState: Piece[],
    type: PieceType
): boolean => {
    switch (type) {
        case PieceType.PAWN:
            return hasMoreCapturesPawn(position, team, boardState);
        case PieceType.KING:
            return hasMoreCapturesKing(position, team, boardState);
        default:
            return false;
    }
}



