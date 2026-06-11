import { GuildChannel } from "npm:discord.js@14";
import type { Command } from "../types/Command.ts";
import { catchErrorTyped, getFails, tryReply  } from '../utilities.ts';

export default {
    name: "check",

    async execute(message, [ check ]) {
        const { channel, guild, author } = message;
        if (!(channel instanceof GuildChannel) || !guild) return;

        const [fetchMeErr, me] = await catchErrorTyped(guild.members.fetchMe());
        if (fetchMeErr) return await tryReply(message, `Error whilest fetching my data`);

        const [fetchErr, member] = await catchErrorTyped(guild.members.fetch(check ?? author));
        if (fetchErr) return await tryReply(message, `I can couldn't find this user`);

        const { highest: meHighest } = me.roles;
        const { highest } = member.roles;

        const checks = getFails(
            [member.permissions.has('Administrator'), `- Is owner or has admin permissions`],
            [meHighest.position < highest.position, `- My role (\`${meHighest.name}\`) is below their's (\`${highest.name}\`)`]
        )

        if (checks) {
            await tryReply(message, {
                content: `I wouldn't be able to timeout this user.\n` + checks.join('\n')
            });
        } else {
            await tryReply(message, { content: `I would be able to timeout this user.` });
        }

    }
} satisfies Command;