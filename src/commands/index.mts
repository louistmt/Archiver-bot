import { produceDefinitionList, produceExecsMap } from "../libs/cmds.mjs";
import archiveCmd from "./archive.mjs";
import cancelCmd from "./cancel.mjs";
import catCmd from "./cat.mjs";
import configCmd from "./config/index.mjs";
import jobsCmd from "./jobs.mjs";
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