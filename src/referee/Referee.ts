import {
    Piece,
    PieceType,
    TeamType,
} from '../components/Chessboard/Chessboard';

export default class Referee {
    tileIsOccupied(x: number, y: number, boardState: Piece[]): boolean {
        const piece = boardState.find((p) => p.x === x && p.y === y);
        if (piece) {
            return true;
        } else return false;
    }

    tileIsOccupiedByOpponent(
        x: number,
        y: number,
        boardState: Piece[],
        team: TeamType
    ): boolean {
        console.log('check if tile is occupied');
        const piece = boardState.find(
            (p) => p.x === x && p.y === y && p.team !== team
        );

        if (piece) {
            return true;
        } else return false;
    }

    isValidMove(
        px: number,
        py: number,
        x: number,
        y: number,
        type: PieceType,
        team: TeamType,
        boardState: Piece[]
    ) {
        // console.log(`Previous location: ${px}, ${py}, `);
        // console.log(`Current location: ${x}, ${y}, `);
        // console.log(`Piece type: ${type} `);
        // console.log('referee is checking the move');
        // console.log(`Team ${team}`);

        if (type === PieceType.PAWN) {
            // const direction = team === TeamType.OUR ? 1 : -1;

            if (type === PieceType.PAWN) {
                if (team == TeamType.OUR) {
                    const direction = 1;
                    if (Math.abs(x - px) === 1 && y - py === direction) {
                        if (!this.tileIsOccupied(x, y, boardState)) return true;
                    }

                    if (Math.abs(x - px) === 2 && y - py === 2 * direction) {
                        const midX = (px + x) / 2;
                        const midY = (py + y) / 2;

                        if (
                            this.tileIsOccupiedByOpponent(
                                midX,
                                midY,
                                boardState,
                                team
                            )
                        ) {
                            console.log('Strike');
                            return true;
                        }
                    }

                                  }

                if (team === TeamType.OPPONENT) {
                    const direction = -1;

                    if (Math.abs(x - px) === 1 && y - py === direction) {
                        if (!this.tileIsOccupied(x, y, boardState)) return true;
                    }

                    if (Math.abs(x - px) === 2 && y - py === 2 * direction) {
                        const midX = (px + x) / 2;
                        const midY = (py + y) / 2;

                        if (
                            this.tileIsOccupiedByOpponent(

                                midX,
                                midY,
                                boardState,
                                team
                            )
                        ) {
                            console.log('Strike');
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }
}
