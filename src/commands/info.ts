import { GuildChannel } from "npm:discord.js@14";
import type { Command } from "../types/Command.ts";
import { catchErrorTyped, tryMessage, tryReply  } from '../utilities.ts';

export default {
    name: "info",

    async execute(message) {
        const { channel, guild, author } = message;
        if (!(channel instanceof GuildChannel) || !guild) return;

        const [fetchMsgsErr, $messages] = await catchErrorTyped(channel.messages.fetch({ limit: 20 }));
        if (fetchMsgsErr) return console.error(fetchMsgsErr);

        const shouldMute = $messages.some(message => 
            message.author.id === message.client.user.id
                && message.content.endsWith('mute you.')
        )

        if (!shouldMute) return;

        const [fetchMeErr, me] = await catchErrorTyped(guild.members.fetchMe());
        if (fetchMeErr) return console.error(fetchMeErr);

        const [fetchErr, member] = await catchErrorTyped(guild.members.fetch(author));
        if (fetchErr) return console.error(fetchErr);

        const [deleteErr] = await catchErrorTyped(message.delete());
        if (deleteErr) return await tryReply(message, 'I can not delete this message');

        if (member.permissions.has('Administrator'))
            return await tryMessage(channel, { content: `I can not timeout ${member}. Has admin permissions or is guild owner` });

        const { highest: $highest } = me.roles;
        const { highest } = member.roles;

        if ($highest.position < highest.position)
            return await tryMessage(channel, { content: `I can not timeout ${member}. Move my role (\`${$highest.name}\`) above their's (\`${highest.name}\`)` });

        const [timeoutErr] = await catchErrorTyped(member.timeout(60 * 60_000));
        if (timeoutErr) await tryMessage(channel, { content: `I can not timeout ${member}. Unknown reason.` });
    }
} satisfies Command;