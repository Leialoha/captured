import { Events, Guild, Message } from "npm:discord.js@14";
import { analyzeMessage, SpamResult } from "../services/spam-analyzer.ts";
import { catchErrorTyped, safeExecute } from "../utilities.ts";
import { getActivity } from "../services/spam-cache.ts";

export default {
    name: Events.MessageCreate,

    async execute(message: Message<boolean>) {
        const { author } = message;
        const result = await analyzeMessage(message);
        if (!result) return;

        if (result.score > 0) {
            console.log(`${author.tag}: ${result.score} (${result.reasons.join(", ")})`);
        }
    
        if (result.score > 100) {
            punish(message, result);
        }
    }
};

export async function punish(message: Message<boolean>, result: SpamResult) {
    const { youngAccount, newMember } = result.details;
    const { author, member, client } = message;

    if (youngAccount && member)
        await safeExecute(member.ban({ reason: 'Likely bot account' }));
    else if (newMember && member)
        await safeExecute(member.kick('Likely bot account'));
    else if (member)
        await safeExecute(member.timeout(60 * 60_000, 'Likely bot account') );
    
    const { messages: records } = getActivity(author.id);

    while (true) {
        const record = records.shift();
        if (!record) break;

        let guild: Guild | null = null;

        if (record.guildId) {
            const [, $guild] = await catchErrorTyped(client.guilds.fetch(record.guildId));
            if ($guild) guild = $guild;
        }

        const channels = guild?.channels || client.channels;
        const [, channel] = await catchErrorTyped(channels.fetch(record.channelId));
        if (!channel?.isTextBased()) continue;

        const [, message] = await catchErrorTyped(channel.messages.fetch(record.messageId));
        if (!message) continue;

        const [, result] = (message.deletable) ? await catchErrorTyped(message.delete()) : [];
        if (!result) await safeExecute(message.react(':thumbs_down:'));
    }

}
