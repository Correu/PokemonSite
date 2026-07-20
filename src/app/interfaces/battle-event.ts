export type BattleItemType = 'healing' | 'stat' | 'status-cure' | 'revival';

export interface BattleConfigEventPayload {
  level: number;
  itemQuantity: number;
  useItems: boolean;
  teamSize: number;
  maxPlayers?: number;
  format?: 'singles' | 'doubles';
  allowedItemTypes?: BattleItemType[];
  itemSlotCount?: number;
  itemStackLimit?: number;
  totalItemPool?: number;
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

export type BattleSwitchPayload = { pokemonIndex: number; turnNumber: number };
export type BattleItemPayload = { itemId: number; turnNumber: number };
export type BattleRematchPayload = Record<string, never>;

export type GameEventPayload =
  | BattleConfigEventPayload
  | BattleTurnEventPayload
  | BattleMatchStartPayload
  | BattleReadyStatePayload
  | BattleCountdownPayload
  | BattleReadyPayload
  | BattleTeamLockPayload
  | BattleStateUpdatePayload
  | BattleForfeitPayload
  | BattleSwitchPayload
  | BattleItemPayload
  | BattleRematchPayload;

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
  types: string[];
  stats: {
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
  };
  moves: BattleCombatMove[];
  heldItem?: {
    id: number;
    name: string;
  } | null;
}

export interface BattleBagItem {
  id: number;
  name: string;
  quantity: number;
}

export interface BattleTeamLockPayload {
  battlers: BattleCombatBattler[];
  bagItems?: BattleBagItem[];
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
  statusConditions?: string[];
  confusionTurns?: number;
}

export interface BattleTeamMember {
  name: string;
  displayName: string;
  speciesId: string;
  currentHp: number;
  maxHp: number;
  isFainted: boolean;
  isActive: boolean;
  frontSprite: string | null;
  statusConditions?: string[];
  confusionTurns?: number;
}

export interface BattleBagSnapshot {
  id: number;
  name: string;
  remaining: number;
  effect?: string;
}

export interface BattleStateUpdatePayload {
  turn: number;
  message: string;
  actives: Record<string, BattleActiveView | null>;
  teamRemaining: Record<string, number>;
  teamSnapshot?: Record<string, BattleTeamMember[]>;
  bagSnapshot?: Record<string, BattleBagSnapshot[]>;
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
  | 'battle:forfeit'
  | 'battle:switch'
  | 'battle:item'
  | 'battle:rematch';

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
      e.type === 'battle:forfeit' ||
      e.type === 'battle:switch' ||
      e.type === 'battle:item' ||
      e.type === 'battle:rematch') &&
    e.payload !== null &&
    typeof e.payload === 'object'
  );
}
