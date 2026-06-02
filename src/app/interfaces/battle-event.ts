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

export interface BattleMatchStartPayload {
  roomKey: string;
  startedAt: string;
  hostSocketId: string;
}

export type GameEventPayload =
  | BattleConfigEventPayload
  | BattleTurnEventPayload
  | BattleMatchStartPayload;

export type GameEventType =
  | 'battle:config'
  | 'battle:turn'
  | 'battle:matchStart';

export interface GameEventEnvelope {
  type: GameEventType;
  version: 1;
  payload: GameEventPayload;
}
