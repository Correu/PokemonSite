export interface CatalogAbility {
  id: number;
  name: string;
  generation: string | null;
  effect: string;
}

export interface AbilitiesCatalog {
  byId: Record<string, CatalogAbility>;
  byName: Record<string, CatalogAbility>;
  orderedIds: number[];
  count: number;
}
