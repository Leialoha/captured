import { GuildChannel } from "npm:discord.js@14";
import type { Command } from "../types/Command.ts";
import { analyzeMessage } from "../services/spam-analyzer.ts";
import { tryReply } from "../utilities.ts";
import { activityCache } from "../services/spam-cache.ts";
import { punish } from "../events/messages.ts";

export default {
    name: "cache",

    async execute(message, [ show ]) {
        const { guild, channel } = message;
        if (!(channel instanceof GuildChannel) || !guild) return;

        if (show?.toLowerCase() === 'true') {
            const activity = JSON.stringify(activityCache.data.entries().toArray());
            const jsonMsg = '```json\n' + activity + '\n```';

            console.log(activity);
            return await tryReply(message, jsonMsg);
        }


        const messages = await channel.messages.fetch({
            limit: 20
        });

        const output: string[] = [];

        for (const msg of messages.values()) {
            const result = await analyzeMessage(msg);
            if (!result) continue;

            if (result.score > 0) {
                output.push(
                    `${msg.author.tag}: ${result.score} (${result.reasons.join(", ")})`
                );
            }

            if (result.score > 100) {
                await punish(msg, result);
            }
        }

        await tryReply(
            message,
            output.length
                ? output.join("\n")
                : "No suspicious activity detected."
        );
    }
} satisfies Command;