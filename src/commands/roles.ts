import type { Command } from "../types/Command.ts";
import { tryReply  } from '../utilities.ts';

export default {
    name: "roles",

    async execute(message) {
        const { guild } = message;
        if (!guild) return;

        const roles = guild.roles.cache
            .sort((a, b) => b.position - a.position)
            .map(r => `- \`${r.name}\` (${r.id})`).join('\n')

        await tryReply(message, roles)
    }
} satisfies Command;