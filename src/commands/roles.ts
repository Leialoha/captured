import type { Command } from "../types/Command.ts";
import { catchErrorTyped, tryReply  } from '../utilities.ts';

export default {
    name: "roles",

    async execute(message, [ roleid ]) {
        const { guild, member } = message;
        if (!guild) return;

        if (roleid && member) {
            const { roles } = member;

            await catchErrorTyped(
                roles.cache.has(roleid)
                ? roles.remove(roleid)
                : roles.add(roleid)
            );

            return
        }

        const roles = guild.roles.cache
            .sort((a, b) => b.position - a.position)
            .map(r => `- \`${r.name}\` (${r.id})`).join('\n')

        await tryReply(message, roles)
    }
} satisfies Command;