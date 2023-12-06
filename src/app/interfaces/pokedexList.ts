export interface PokedexList {
    count: number
    next: string
    previous: any
    results: Result[]
}

export interface Result {
    name: string
    url: string
}