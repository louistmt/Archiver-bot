import { SlashCommandBuilder } from "@discordjs/builders";
import { PermissionFlagsBits } from "discord-api-types/v9";
import { CommandInteraction } from "discord.js";

import { Command } from "../libs/cmds.mjs";

import Archiver, { SendRpMsgsJob } from "../workers/archiver.mjs";
import { ServersConfigChest } from "../data/index.mjs";

const serversConfig = ServersConfigChest.get();

const definition = new SlashCommandBuilder()
definition.setName("jobs")
definition.setDescription("Prints info about the archival jobs in queue")
definition.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
definition.setDMPermission(false)

/**
     * **Archive jobs**\n
     * \n
     * Current job: ${jobName}\n
     * Messages Sent: ${calculation}/${total}\n
     * \n
     * **Jobs in queue (${number of jobs})**
     *   - ${channelName}
     *   - ${channelName}
     *   - ${channelName}
     *   - ${channelName}
     *   ... (if more than five are queued)
     * 
     */
async function execute(interaction: CommandInteraction) {
    const serverId = interaction.guildId;
    let {archiveServerId} = serversConfig.getOrCreate(serverId);

    if (archiveServerId.length === 0) archiveServerId = serverId;
    
    const allJobs = Archiver.jobs.filter((job) => !job.isStateImmutable() && job.data.serverId === archiveServerId)
    const firstJobs = allJobs.slice(0, 5);

    if (allJobs.length == 0) {
        await interaction.reply("No active archive jobs at the moment.");
        return;
    }

    const currentJob = allJobs[0];
    const response = [
        "**Archive Jobs**\n",
        `Current job: ${currentJob.data.srcChannelName}`
    ];

    if (currentJob.data.msgs) {
        const {msgs, msgCount} = currentJob.data as SendRpMsgsJob
        response.push(`Messages Sent: ${msgCount -msgs.length}/${msgCount}\n`);
    }

    response.push(`**Archive Queue (${allJobs.length})**`);

    for (let {data} of firstJobs) {
        const {srcChannelName, destCategoryName} = data as SendRpMsgsJob
        response.push(`- \`\`${srcChannelName}\`\` into \`\`${destCategoryName}\`\``);
    }

    if (allJobs.length > 5) response.push("...");

    await interaction.reply(response.join("\n"));
}

const jobsCmd: Command = {definition, execute};
export default jobsCmd;