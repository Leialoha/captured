import { Events, Message } from "npm:discord.js@14";
import { resolve } from 'node:path';
import { cwd } from 'node:process';
import { readdirSync } from 'node:fs';
import { Command } from '../types/Command.ts';

const commands = new Map<string, Command>();

for await (const file of readdirSync(resolve(cwd(), 'src', 'commands'), { recursive: true })) {
    const module = await import(`../commands/${file}`);
    const command: Command = module.default;

    commands.set(command.name, command);
};


export default {
    name: Events.MessageCreate,

    async execute(message: Message) {
        const { author, content } = message;
        if (author.bot) return;
        if (!content.startsWith("$")) return;

        const [name, ...args] = content.slice(1).split(/\s+/);
        const command = commands.get(name.toLowerCase());

        if (!command) return;

        try {
            await command.execute(message, args);
        } catch (error) {
            console.error(error);
        }
    }
};