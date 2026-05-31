export type BattleFormat = 'singles' | 'doubles';
export type BattlePhase = 'idle' | 'lobby' | 'waiting' | 'active' | 'finished';

export interface BattleConfig {
  level: number;
  teamSize: number;
  useItems: boolean;
  itemQuantity: number;
  format: BattleFormat;
  maxPlayers: number;
  generation: number | null;
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
  ready?: boolean;
}

export interface JoinRoomResponse {
  success?: boolean;
  error?: string;
  roomKey?: string;
  battleConfig?: BattleConfig | null;
  status?: string;
  users?: string[];
  maxPlayers?: number;
}
