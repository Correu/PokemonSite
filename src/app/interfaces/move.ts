export interface BattleMove {
  id: number;
  name: string;
  power: number | null;
  pp: number | null;
  accuracy: number | null;
  priority: number;
  damageClass: string | null;
  type: string | null;
  target: string | null;
  generation: string | null;
  effect: string;
  meta: BattleMoveMeta;
}

export interface BattleMoveMeta {
  ailment: string | null;
  category: string | null;
  minHits: number | null;
  maxHits: number | null;
  minTurns: number | null;
  maxTurns: number | null;
  drain: number | null;
  healing: number | null;
  critRate: number | null;
  ailmentChance: number | null;
  flinchChance: number | null;
  statChance: number | null;
}

export interface MovesCatalog {
  byId: Record<string, BattleMove>;
  orderedIds: number[];
  count: number;
}
  