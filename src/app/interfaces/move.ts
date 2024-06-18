export interface Move {
    id: number
    name: string
    accuracy: number
    effect_chance: any
    pp: number
    priority: number
    power: number
    contest_combos: ContestCombos
    contest_type: ContestType
    contest_effect: ContestEffect
    damage_class: DamageClass
    effect_entries: EffectEntry[]
    effect_changes: any[]
    generation: Generation
    meta: Meta
    names: Name[]
    past_values: any[]
    stat_changes: any[]
    super_contest_effect: SuperContestEffect
    target: Target
    type: Type
    learned_by_pokemon: LearnedByPokemon[]
    flavor_text_entries: FlavorTextEntry[]
  }
  
  export interface ContestCombos {
    normal: Normal
    super: Super
  }
  
  export interface Normal {
    use_before: UseBefore[]
    use_after: any
  }
  
  export interface UseBefore {
    name: string
    url: string
  }
  
  export interface Super {
    use_before: any
    use_after: any
  }
  
  export interface ContestType {
    name: string
    url: string
  }
  
  export interface ContestEffect {
    url: string
  }
  
  export interface DamageClass {
    name: string
    url: string
  }
  
  export interface EffectEntry {
    effect: string
    short_effect: string
    language: Language
  }
  
  export interface Language {
    name: string
    url: string
  }
  
  export interface Generation {
    name: string
    url: string
  }
  
  export interface Meta {
    ailment: Ailment
    category: Category
    min_hits: any
    max_hits: any
    min_turns: any
    max_turns: any
    drain: number
    healing: number
    crit_rate: number
    ailment_chance: number
    flinch_chance: number
    stat_chance: number
  }
  
  export interface Ailment {
    name: string
    url: string
  }
  
  export interface Category {
    name: string
    url: string
  }
  
  export interface Name {
    name: string
    language: Language2
  }
  
  export interface Language2 {
    name: string
    url: string
  }
  
  export interface SuperContestEffect {
    url: string
  }
  
  export interface Target {
    name: string
    url: string
  }
  
  export interface Type {
    name: string
    url: string
  }
  
  export interface LearnedByPokemon {
    name: string
    url: string
  }
  
  export interface FlavorTextEntry {
    flavor_text: string
    language: Language3
    version_group: VersionGroup
  }
  
  export interface Language3 {
    url: string
    name: string
  }
  
  export interface VersionGroup {
    url: string
    name: string
  }
  