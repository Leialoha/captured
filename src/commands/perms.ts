import { GuildChannel } from "npm:discord.js@14";
import type { Command } from "../types/Command.ts";
import { tryReply } from "../utilities.ts";

export default {
    name: "perms",

    async execute(message) {
        const { guild, channel } = message;
        if (!(channel instanceof GuildChannel) || !guild) return;
        const { permissions } = await guild.members.fetchMe();

        tryReply(message, permissions.toArray().map(m => `- ${m}`).join('\n'))
    }
} satisfies Command;