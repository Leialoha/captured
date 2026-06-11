import { Client, Events } from "npm:discord.js@14";

export default {
    name: Events.ClientReady,
    once: true,

    // When the client is ready, run this code (only once).
    // The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
    // It makes some properties non-nullable.
    execute({ user }: Client<true>) {
        console.log(`Ready! Logged in as ${user.tag}`);
    }
};