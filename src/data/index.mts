import Config from "../config.mjs";
import { PirateChest } from "../libs/pirate-chest/index.mjs";
import ServersConfig from "./server-config.mjs";

export const ServersConfigChest = PirateChest.open<ServersConfig>(Config.paths.serversConfig, new ServersConfig())