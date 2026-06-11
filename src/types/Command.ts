import type { Message } from "npm:discord.js@14";

export interface Command {
    name: string;
    execute(message: Message, args: string[]): Promise<unknown | void>;
}