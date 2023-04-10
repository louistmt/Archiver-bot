import Config from "../config.mjs";
import { PirateChest } from "../libs/pirate-chest-deprecated/index.mjs";
import ServersConfig from "./server-config.mjs";
import { default as serversConfigSolver } from "./server-config-mig.mjs";

export const ServersConfigChest = PirateChest.open<ServersConfig>(Config.paths.serversConfig, new ServersConfig(), serversConfigSolver);