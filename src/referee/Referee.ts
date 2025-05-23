import {Piece, PieceType, Position, TeamType, MoveResult } from '../Constants';
import {pawnMove, kingMove, hasMoreCapturesKing, hasMoreCapturesPawn} from "./rules";

export default class Referee {
    isValidMove(
        initialPosition: Position,
        desiredPosition: Position,
        type: PieceType,
        team: TeamType,
        boardState: Piece[]
    ): MoveResult {
        switch (type) {
            case PieceType.PAWN:
                return pawnMove(initialPosition, desiredPosition, team, boardState);
            case PieceType.KING:
                return kingMove(initialPosition, desiredPosition, team, boardState);
            default:
                return { success: false };
        }
    }

    hasAdditionalCaptures(
        position: Position,
        type: PieceType,
        team: TeamType,
        boardState: Piece[]
    ): boolean {
        switch (type) {
            case PieceType.PAWN:
                return hasMoreCapturesPawn(position, team, boardState);
            case PieceType.KING:
                return hasMoreCapturesKing(position, team, boardState); // Ensure this function exists
            default:
                return false;
        }
    }
}