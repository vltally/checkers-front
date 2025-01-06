export const VERTICAL_AXIS = ['1', '2', '3', '4', '5', '6', '7', '8'];

export const HORIZONTAL_AXIS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

export const TILE_SIZE = 100;

export const BOARD_SIZE = 800;


export interface Position {
    x: number;
    y: number;
}

export enum PieceType {
    PAWN,
    KING,
}

export enum TeamType {
    OPPONENT,
    OUR,
}

export interface Piece {
    image: string;
    position: Position;
    type: PieceType;
    team: TeamType;
}

export const initialBoardState: Piece[] = [
  { image: '/src/assets/images/pawn_g.png', position: { x: 0, y: 0 }, type: PieceType.PAWN, team: TeamType.OUR },
  { image: '/src/assets/images/pawn_g.png', position: { x: 2, y: 0 }, type: PieceType.PAWN, team: TeamType.OUR },
  { image: '/src/assets/images/pawn_g.png', position: { x: 4, y: 0 }, type: PieceType.PAWN, team: TeamType.OUR },
  { image: '/src/assets/images/pawn_g.png', position: { x: 6, y: 0 }, type: PieceType.PAWN, team: TeamType.OUR },
  { image: '/src/assets/images/pawn_g.png', position: { x: 1, y: 1 }, type: PieceType.PAWN, team: TeamType.OUR },
  { image: '/src/assets/images/pawn_g.png', position: { x: 3, y: 1 }, type: PieceType.PAWN, team: TeamType.OUR },
  { image: '/src/assets/images/pawn_g.png', position: { x: 5, y: 1 }, type: PieceType.PAWN, team: TeamType.OUR },
  { image: '/src/assets/images/pawn_g.png', position: { x: 7, y: 1 }, type: PieceType.PAWN, team: TeamType.OUR },
  { image: '/src/assets/images/pawn_g.png', position: { x: 0, y: 2 }, type: PieceType.PAWN, team: TeamType.OUR },
  { image: '/src/assets/images/pawn_g.png', position: { x: 2, y: 2 }, type: PieceType.PAWN, team: TeamType.OUR },
  { image: '/src/assets/images/pawn_g.png', position: { x: 4, y: 2 }, type: PieceType.PAWN, team: TeamType.OUR },
  { image: '/src/assets/images/pawn_g.png', position: { x: 6, y: 2 }, type: PieceType.PAWN, team: TeamType.OUR },
  { image: '/src/assets/images/pawn_r.png', position: { x: 1, y: 5 }, type: PieceType.PAWN, team: TeamType.OPPONENT },
  { image: '/src/assets/images/pawn_r.png', position: { x: 3, y: 5 }, type: PieceType.PAWN, team: TeamType.OPPONENT },
  { image: '/src/assets/images/pawn_r.png', position: { x: 5, y: 5 }, type: PieceType.PAWN, team: TeamType.OPPONENT },
  { image: '/src/assets/images/pawn_r.png', position: { x: 7, y: 5 }, type: PieceType.PAWN, team: TeamType.OPPONENT },
  { image: '/src/assets/images/pawn_r.png', position: { x: 0, y: 6 }, type: PieceType.PAWN, team: TeamType.OPPONENT },
  { image: '/src/assets/images/pawn_r.png', position: { x: 2, y: 6 }, type: PieceType.PAWN, team: TeamType.OPPONENT },
  { image: '/src/assets/images/pawn_r.png', position: { x: 4, y: 6 }, type: PieceType.PAWN, team: TeamType.OPPONENT },
  { image: '/src/assets/images/pawn_r.png', position: { x: 6, y: 6 }, type: PieceType.PAWN, team: TeamType.OPPONENT },
  { image: '/src/assets/images/pawn_r.png', position: { x: 1, y: 7 }, type: PieceType.PAWN, team: TeamType.OPPONENT },
  { image: '/src/assets/images/pawn_r.png', position: { x: 3, y: 7 }, type: PieceType.PAWN, team: TeamType.OPPONENT },
  { image: '/src/assets/images/pawn_r.png', position: { x: 5, y: 7 }, type: PieceType.PAWN, team: TeamType.OPPONENT },
  { image: '/src/assets/images/pawn_r.png', position: { x: 7, y: 7 }, type: PieceType.PAWN, team: TeamType.OPPONENT },
];
