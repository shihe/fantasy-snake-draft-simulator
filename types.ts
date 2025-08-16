export interface Player {
  rank: number;
  name: string;
  position: string;
}

export type DraftBoardData = Record<string, (Player | null)[]>;

export type DataSource = 'Sleeper' | 'Yahoo' | 'ESPN' | 'Custom';