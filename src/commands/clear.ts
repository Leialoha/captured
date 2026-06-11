import { GuildChannel } from "npm:discord.js@14";
import type { Command } from "../types/Command.ts";
import { catchErrorTyped, safeExecute } from '../utilities.ts';

export default {
    name: "clear",

    async execute(message, [size]) {
        const { channel } = message;
        if (!(channel instanceof GuildChannel)) return;
        const limit = Number.parseInt(size ?? '20', 10) ?? 20;

        const [fetchMsgsErr, messagesObj] = await catchErrorTyped(channel.messages.fetch({ limit }));
        if (fetchMsgsErr) return console.error(fetchMsgsErr);
    
        messagesObj.forEach(msg => safeExecute(msg.delete()));
    }
} satisfies Command;