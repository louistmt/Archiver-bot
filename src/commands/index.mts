import { produceDefinitionList, produceExecsMap } from "../libs/cmds.mjs";
import archiveCmd from "./cmd-archive.mjs";
import cancelCmd from "./cmd-cancel.mjs";
import catCmd from "./cmd-cat.mjs";
import configCmd from "./config/index.mjs";
import jobsCmd from "./cmd-jobs.mjs";

export const execsMap = produceExecsMap(
    archiveCmd,
    cancelCmd,
    catCmd,
    configCmd,
    jobsCmd
);

export const definitionsList = produceDefinitionList(
    archiveCmd,
    cancelCmd,
    catCmd,
    configCmd,
    jobsCmd
);