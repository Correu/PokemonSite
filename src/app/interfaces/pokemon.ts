export interface Pokemon {
    id: number;
    name: string;
    baseExperience: number;
    height: number;
    isDefault: boolean;
    order: number;
    weight: number;
    abilities: { isHidden: boolean, slot: number, ability: { name: string, url: string } };
    forms: { name: string, url: string };
    gameIndicies: { gameIndex: number, version: { name: string, url: string } };
    heldItems: { item: { name: string, url: string }, versionDetails: { rarity: string, version: { name: string, url: string } } };
    locationAreaEncounters: string;
    moves: { move: { name: string, url: string }, versionGroupDetails: { levelLearnedAt: number, versionGroup: { name: string, url: string } }, moveLearnMethod: { name: string, url: string } };
    species: { name: string, url: string };
    sprites: { backDefault: string, backFemale: string, backShiny: string, backShinyFemale: string, frontDefault: string, frontFemale: string, frontShiny: string, frontShinyFemale: string, other: { dreamWorld: { frontDefault: string, frontFemale: string }, home: { frontDefault: string, frontFemale: string, frontShiny: string, frontShinyFemale: string }, officialArtwork: { frontDefault: string } }, versions: { generationI: { redBlue: { backDefault: string, backGray: string, frontDefault: string, frontGray: string }, yellow: { frontDefault: string, frontGray: string, backDefault: string, backGray: string } }, generationII: { crystal: { backDefault: string, backShiny: string, frontDefault: string, frontShiny: string }, gold: { backDefault: string, backShiny: string, frontDefault: string, frontShiny: string }, silver: { backDefault: string, backShiny: string, frontDefault: string, frontShiny: string } }, generationIII: {emerald: {frontDefault: string, frontShiny: string}, fireRedLeafGreen: {backDefault: string, backShiny: string, frontDefault: string, frontShiny: string}, rubySapphire: {backDefault: string, backShiny: string, frontDefault: string, frontShiny: string}}, generationIV: {diamondPearl: {backDefault: string, backFemale: string, backShiny: string, backShinyFemale: string, frontDefault: string, frontFemale: string, frontShiny: string, frontShinyFemale: string}, heartGoldSoulSilver: {backDefault: string, backShiny: string, frontDefault: string, frontShiny: string}, platinum: {backDefault: string, backShiny: string, frontDefault: string, frontShiny: string}}, generationV: {} } };

}