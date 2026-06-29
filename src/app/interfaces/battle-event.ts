export interface BattleConfigEventPayload {
  level: number;
  itemQuantity: number;
  useItems: boolean;
  teamSize: number;
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
  playerCount?: number;
  maxPlayers?: number;
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
  | BattleReadyPayload
  | BattleTeamLockPayload
  | BattleStateUpdatePayload
  | BattleForfeitPayload;

export interface BattleCombatMove {
  id: number;
  name: string;
  power: number | null;
  type: string | null;
  damageClass: string | null;
  priority: number;
  maxPp: number;
  currentPp: number;
}

export interface BattleCombatBattler {
  speciesId: string;
  name: string;
  displayName: string;
  level: number;
  maxHp: number;
  currentHp: number;
  frontSprite: string;
  backSprite: string;
  isFainted: boolean;
  stats: {
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
  };
  moves: BattleCombatMove[];
}

export interface BattleTeamLockPayload {
  battlers: BattleCombatBattler[];
}

export interface BattleActiveView {
  speciesId: string;
  name: string;
  displayName: string;
  level: number;
  maxHp: number;
  currentHp: number;
  frontSprite: string;
  backSprite: string;
  isFainted: boolean;
  moves?: BattleCombatMove[];
}

export interface BattleStateUpdatePayload {
  turn: number;
  message: string;
  actives: Record<string, BattleActiveView | null>;
  teamRemaining: Record<string, number>;
  awaitingMoves: string[];
  lockedPlayers: string[];
  winnerId: string | null;
  battleStarted?: boolean;
  lastAction?: {
    attackerId: string;
    moveName: string;
    damage: number;
    targetId: string;
    targetFainted: boolean;
  };
}

export type BattleForfeitPayload = Record<string, never>;

export type GameEventType =
  | 'battle:config'
  | 'battle:turn'
  | 'battle:matchStart'
  | 'battle:ready'
  | 'battle:readyState'
  | 'battle:countdown'
  | 'battle:teamLock'
  | 'battle:stateUpdate'
  | 'battle:forfeit';

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
      e.type === 'battle:countdown' ||
      e.type === 'battle:teamLock' ||
      e.type === 'battle:stateUpdate' ||
      e.type === 'battle:forfeit') &&
    e.payload !== null &&
    typeof e.payload === 'object'
  );
}
