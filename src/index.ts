import { Client, GatewayIntentBits, Events, ChannelType } from 'npm:discord.js@14';
import { resolve } from 'node:path';
import { cwd } from 'node:process';
import {readdirSync} from 'node:fs';

const { DISCORD_TOKEN: token } = process.env;

// Create a new client instance
const client = new Client({ intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.MessageContent
] });

const EVENTS_DIR = resolve(cwd(), 'src', 'events');
const files = readdirSync(EVENTS_DIR, { recursive: true })
    .filter(file => typeof file === 'string');

for await (const file of files) {
    const event = (await import(`./events/${file}`)).default;

    if (event.once) client.once(event.name, (...args) => event.execute(...args));
    else  client.on(event.name, (...args) => event.execute(...args));
};


// client.on(Events.MessageCreate, async (message) => {
//     const { content, author, guild, channel } = message;
//     const { id: authorId } = author;

//     if (!content.startsWith('$')) return;
//     const [cmd, ...args] = content.substring(1).toLowerCase().split(' ');
    
//     if (cmd === 'lockout') {
//         if (authorId !== '217024555724570624') return;
//         const category = await guild?.channels.create({ type: ChannelType.GuildCategory, name: 'supplied' });
//         const channel = await guild?.channels.create({ type: ChannelType.GuildText, name: 'verify', parent: category });
//         await channel?.send({ content: 'Sending a message in this channel will mute you.' });
//     } else if (cmd === 'info') {
//         const messages = await channel.messages.fetch({ limit: 20 });
//         const shouldMute = messages.filter(message => message.author.id === message.client.user.id)
//             .some(message => message.content.endsWith('mute you.'));

//         if (shouldMute) {
//             const me = await guild?.members.fetchMe();
//             const member = await guild?.members.fetch(author.id);

//             if (!me || !member) return;

//             try {
//                 await message.delete();
//             } catch (e) {
//                 await message.reply('I can not delete this message');
//             }

//             const isAdmin = member.permissions.has('Administrator');
//             if (isAdmin) {
//                 channel.send({ content: `I can not timeout ${member}. Has admin permissions or is guild owner` });
//                 return;
//             }

//             const { highest: meHighest } = me.roles;
//             const { highest } = member.roles;

//             if (meHighest.position < highest.position) {
//                 channel.send({ content: `I can not timeout ${member}. Move my role (\`${meHighest.name}\`) above their's (\`${highest.name}\`)` });
//                 return;
//             }

//             try {
//                 await member?.timeout(5_000);
//             } catch (err) {
//                 channel.send({ content: `I can not timeout ${member}. Unknown reason` })
//                 console.error(err);
//             }
//         }
//     }

//     console.log(message.channelId);
// });

// Log in to Discord with your client's token
client.login(token);