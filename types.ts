
export type Player = 'X' | 'O' | null;

export enum GameMode {
  PVP = 'PVP',
  PVAI = 'PVAI'
}

export interface LeaderboardEntry {
  name: string;
  wins: number;
  draws: number;
  losses: number;
}

export interface GameState {
  board: Player[];
  xIsNext: boolean;
  winner: Player;
  winningLine: number[] | null;
  mode: GameMode;
  scores: { X: number; O: number; draws: number };
  isGameOver: boolean;
  aiThinking: boolean;
}

export const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
  [0, 4, 8], [2, 4, 6]             // Diagonals
];
