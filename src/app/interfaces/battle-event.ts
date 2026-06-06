export interface BattleConfigEventPayload {
  level: number;
  itemQuantity: number;
  generation: number | null;
  useItems: boolean;
  teamSize?: number;
  maxPlayers?: number;
  format?: 'singles' | 'doubles';
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

export interface BattleReadyStatePayload {
  readyPlayerIds: string[];
  requiredCount: number;
  allReady: boolean;
}

export interface BattleCountdownPayload {
  seconds: number;
  endsAt: string;
}

/** Client → server: toggle ready (no fields required). */
export type BattleReadyPayload = Record<string, never>;

export type GameEventPayload =
  | BattleConfigEventPayload
  | BattleTurnEventPayload
  | BattleMatchStartPayload
  | BattleReadyStatePayload
  | BattleCountdownPayload
  | BattleReadyPayload;

export type GameEventType =
  | 'battle:config'
  | 'battle:turn'
  | 'battle:matchStart'
  | 'battle:ready'
  | 'battle:readyState'
  | 'battle:countdown';

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
      e.type === 'battle:matchStart' ||
      e.type === 'battle:ready' ||
      e.type === 'battle:readyState' ||
      e.type === 'battle:countdown') &&
    e.payload !== null &&
    typeof e.payload === 'object'
  );
}
