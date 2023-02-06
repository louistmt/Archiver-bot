import type { SlashCommandBuilder, SlashCommandSubcommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";

type ExecuteFunction = (interaction: CommandInteraction) => Promise<void>;
export type Command = {definition: SlashCommandBuilder, execute: ExecuteFunction};
type SubCommand = {definition: SlashCommandSubcommandBuilder, execute: ExecuteFunction};
type ExecMap = Map<string, ExecuteFunction>

export function produceExecsMap(...commands: Command[]): ExecMap {
    const execsMap: ExecMap = new Map();

    for (let {definition, execute} of commands) {
        const {name} = definition;
        if (execsMap.has(name)) throw Error(`Failed to build exec map. Command '${name}' already exists.`);
        execsMap.set(name, execute);
    }

    return execsMap;
}

export function produceSubExecsMap(...subcommands: SubCommand[]): ExecMap {
    const execsMap: ExecMap = new Map();
    
    for (let {definition, execute} of subcommands) {
        const {name} = definition;
        if (execsMap.has(name)) throw Error(`Failed to build exec map. Command '${name}' already exists.`);
        execsMap.set(name, execute);
    }

    return execsMap;
}

export function produceDefinitionList(...commands: Command[]): SlashCommandBuilder[] {
    return commands.map(command => command.definition);
}