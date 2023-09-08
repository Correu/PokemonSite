export interface Pokemon {
    id: number;
    name: string;
    baseExperience: number;
    height: number;
    order: number;
    weight: number;
    abilities: Ability[];
    forms: Form[];
    heldItems: HeldItem[];
    moves: Move[];
    sprites: Sprite;
    stats: Stat[];
}

export interface Ability {
    name: string;
    url: string;
}

export interface Form {
    name: string;
    url: string;
}

export interface HeldItem {
    name: string;
    url: string;
}

export interface Move {
    name: string;
    url: string;
}

export interface Sprite {
    frontDefault: string;
    backDefault: string;
    frontShiny: string;
    backShiny: string;
}

export interface Stat {
    baseStat: number;
    effort: number;
    name: string;
    url: string;
}
