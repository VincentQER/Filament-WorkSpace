let load: null | Promise<ReturnType<Module["getSqliteDb"]>> = null;

type Module = typeof import("../db-sqlite");

export function getSqlite(): Promise<ReturnType<Module["getSqliteDb"]>> {
  if (!load) load = import("../db-sqlite").then((m) => m.getSqliteDb());
  return load;
}
