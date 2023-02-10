export function produceExecsMap(...commands) {
    const execsMap = new Map();
    for (let { definition, execute } of commands) {
        const { name } = definition;
        if (execsMap.has(name))
            throw Error(`Failed to build exec map. Command '${name}' already exists.`);
        execsMap.set(name, execute);
    }
    return execsMap;
}
export function produceSubExecsMap(...subcommands) {
    const execsMap = new Map();
    for (let { definition, execute } of subcommands) {
        const { name } = definition;
        if (execsMap.has(name))
            throw Error(`Failed to build exec map. Command '${name}' already exists.`);
        execsMap.set(name, execute);
    }
    return execsMap;
}
export function produceDefinitionList(...commands) {
    return commands.map(command => command.definition);
}
