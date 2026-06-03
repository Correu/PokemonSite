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

export function isGameEventEnvelope(
  event: unknown
): event is GameEventEnvelope {
  if (!event || typeof event !== 'object') {
    return false;
  }
  const e = event as GameEventEnvelope;
  return (
    e.version === 1 &&
    typeof e.type === 'string' &&
    (e.type === 'battle:config' ||
      e.type === 'battle:turn' ||
      e.type === 'battle:matchStart') &&
    e.payload !== null &&
    typeof e.payload === 'object'
  );
}
