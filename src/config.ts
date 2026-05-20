import Conf from "conf";
import { randomUUID } from "crypto";
import type { Favorite, PackageManager } from "./types.js";

export interface Prefs {
  lastPm?: PackageManager;
  defaultGit?: boolean;
  defaultVsCode?: boolean;
}

const store = new Conf<{ favorites: Favorite[]; prefs: Prefs }>({
  projectName: "initmyrepo",
  defaults: { favorites: [], prefs: {} },
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
  getPrefs: (): Prefs => store.get("prefs"),
  savePrefs: (patch: Partial<Prefs>): void => {
    store.set("prefs", { ...store.get("prefs"), ...patch });
  },
  getPath: (): string => store.path,
};
