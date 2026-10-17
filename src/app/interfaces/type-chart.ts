export interface TypeChart {
  types: string[];
  multipliers: Record<string, Record<string, number>>;
}

export interface TypeMatchupChip {
  type: string;
  multiplier: number;
}

export interface TypeMatchups {
  weakTo: TypeMatchupChip[];
  resists: TypeMatchupChip[];
  immuneTo: TypeMatchupChip[];
  strongAgainst: TypeMatchupChip[];
  notVeryEffective: TypeMatchupChip[];
}
