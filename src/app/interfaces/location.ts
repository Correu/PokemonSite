export interface Location {
    areas: Area[]
    game_indices: Index[]
    id: number
    name: string
    names: Name[]
    region: Region
  }
  
  export interface Area {
    name: string
    url: string
  }
  
  export interface Index {
    game_index: number
    generation: Generation
  }
  
  export interface Generation {
    name: string
    url: string
  }
  
  export interface Name {
    language: Language
    name: string
  }
  
  export interface Language {
    name: string
    url: string
  }
  
  export interface Region {
    name: string
    url: string
  }
  