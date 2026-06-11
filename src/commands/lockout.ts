import { ChannelType } from "npm:discord.js@14";
import type { Command } from "../types/Command.ts";

export default {
    name: "lockout",

    async execute(message) {
        const guild = message.guild;
        if (!guild) return;

        const category = await guild.channels.create({
            name: "supplied",
            type: ChannelType.GuildCategory
        });

        const verify = await guild.channels.create({
            name: "verify",
            type: ChannelType.GuildText,
            parent: category.id
        });

        await verify.send(
            "Sending a message in this channel will mute you."
        );
    }
} satisfies Command;