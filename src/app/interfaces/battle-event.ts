export interface BattleConfigEventPayload {
  level: number;
  itemQuantity: number;
  generation: number | null;
  useItems: boolean;
}

export interface BattleTurnEventPayload {
  actorId: string;
  moveId: number;
  targetSlot: number;
  turnNumber: number;
}

export type GameEventPayload = BattleConfigEventPayload | BattleTurnEventPayload;

export interface GameEventEnvelope {
  type: 'battle:config' | 'battle:turn';
  version: 1;
  payload: GameEventPayload;
}
