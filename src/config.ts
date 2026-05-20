import Conf from "conf";
import { randomUUID } from "crypto";
import type { Favorite } from "./types.js";

const store = new Conf<{ favorites: Favorite[] }>({
  projectName: "initmyrepo",
  defaults: { favorites: [] },
});

export const config = {
  getFavorites: (): Favorite[] => store.get("favorites"),
  addFavorite: (f: Omit<Favorite, "id" | "addedAt">) => {
    const fav: Favorite = {
      ...f,
      id: randomUUID(),
      addedAt: new Date().toISOString(),
    };
    store.set("favorites", [...store.get("favorites"), fav]);
    return fav;
  },
  removeFavorite: (id: string): void => {
    store.set(
      "favorites",
      store.get("favorites").filter((f) => f.id !== id),
    );
  },
  getPath: (): string => store.path,
};
