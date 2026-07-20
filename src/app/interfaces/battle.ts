export type BattleFormat = 'singles' | 'doubles';
export type BattlePhase = 'idle' | 'lobby' | 'waiting' | 'teamSelect' | 'active' | 'finished';

/** Original 151 — battle roster is always Generation I. */
export const GEN1_POKEMON_COUNT = 151;

export type BattleItemType = 'healing' | 'stat' | 'status-cure' | 'revival';

export interface BattleConfig {
  level: number;
  teamSize: number;
  useItems: boolean;
  itemQuantity: number;
  format: BattleFormat;
  maxPlayers: number;
  allowedItemTypes?: BattleItemType[];
  itemSlotCount?: number;
  itemStackLimit?: number;
  totalItemPool?: number;
}

export interface BattleBattler {
  speciesId: string;
  name: string;
  displayName: string;
  level: number;
  currentHp: number;
  maxHp: number;
  gender: 'male' | 'female' | null;
  frontSprite: string;
  backSprite: string;
  isFainted: boolean;
}

export interface BattleFieldState {
  playerActive: BattleBattler | null;
  opponentActive: BattleBattler | null;
  message: string;
  turn: number;
}

export type BattleGameEventType =
  | 'battleConfig'
  | 'playerReady'
  | 'allPlayersConnected'
  | 'teamSelect'
  | 'battleStart'
  | 'battleState'
  | 'battleAction';

export interface BattleActionPayload {
  kind: 'fight' | 'bag' | 'switch' | 'run';
  message?: string;
}

export interface BattleGameEvent {
  type: BattleGameEventType;
  senderId?: string;
  config?: BattleConfig;
  field?: BattleFieldState;
  action?: BattleActionPayload;
  battler?: BattleBattler;
  ready?: boolean;
  users?: string[];
}

export interface JoinRoomResponse {
  success?: boolean;
  error?: string;
  roomKey?: string;
  battleConfig?: BattleConfig | null;
  status?: string;
  users?: string[];
  playerCount?: number;
  maxPlayers?: number;
  matchStarted?: boolean;
  readyForTeamSelect?: boolean;
  readyPlayerIds?: string[];
  countdownEndsAt?: string | null;
}
