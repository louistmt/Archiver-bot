import { produceDefinitionList, produceExecsMap } from "../libs/cmds.mjs";
import archiveCmd from "./cmd-archive.mjs";
import cancelCmd from "./cmd-cancel.mjs";
import catCmd from "./cmd-cat.mjs";
import configCmd from "./config/index.mjs";
import jobsCmd from "./cmd-jobs.mjs";
import exportCmd from "./export/index.mjs";
import exportCatCmd from "./export-category.mjs";

export const execsMap = produceExecsMap(
    archiveCmd,
    cancelCmd,
    catCmd,
    configCmd,
    jobsCmd,
    exportCmd,
    exportCatCmd
);

export const definitionsList = produceDefinitionList(
    archiveCmd,
    cancelCmd,
    catCmd,
    configCmd,
    jobsCmd,
    exportCmd,
    exportCatCmd
);