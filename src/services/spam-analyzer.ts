import { Collection, Message } from "npm:discord.js@14";
import { activityCache, getActivity } from "../services/spam-cache.ts";
import { createHash } from "node:crypto";

interface SpamDetails {
    youngAccount: boolean;
    newMember: boolean;

    mentions: number;
    sameContent: number;
    duplicateImages: number;
    messageBurst: number;
}

export interface SpamResult {
    score: number;
    reasons: string[];

    details: SpamDetails
}

export async function analyzeMessage(message: Message<boolean> ): Promise<SpamResult | undefined> {
    const { author, content, mentions, attachments, channelId, id: messageId, guildId } = message;
    if (author.bot) return;

    const activity = getActivity(author.id);
    const normalized = normalize(content);
    const { everyone, roles, users } = mentions

    const $mentions = {
        everyone,
        roles: getKeys(roles),
        users: getKeys(users)
    }

    const hashes = await Promise.all(
        attachments.values()
            .filter(a => a.contentType?.startsWith("image/"))
            .map(a => hashImage(a.url))
    );

    activity.messages.push({
        timestamp: Date.now(),
        content: normalized,
        mentions: $mentions,
        hashes,

        guildId,
        channelId,
        messageId,
    });

    activity.messages = activity.messages.slice(-20);

    activityCache.set(author.id, activity);

    return calculateScore(activity, message);
}

export async function hashImage(url: string): Promise<string> {
    const response = await fetch(url);

    if (!response.ok)
        throw new Error(`Failed to download image: ${response.status}`);

    const buffer = await response.arrayBuffer();

    return createHash("sha256")
        .update(new Uint8Array(buffer))
        .digest("hex");
}

function calculateScore(activity: ReturnType<typeof getActivity>, message: Message<boolean>): SpamResult {
    const { messages } = activity;
    const { member, author, createdTimestamp: timestamp } = message;

    const user = member?.user || author;
    const join = member?.joinedTimestamp || timestamp;
    const age = user.createdTimestamp;

    const $CURRENT = Date.now();
    const $MONTH = 60_000 * 60 * 24 * 30; // last 30 days

    const newMember = ($CURRENT - join) < $MONTH;
    const youngAccount = ($CURRENT - age) < $MONTH;

    let score = 0;
    const reasons: string[] = [];

    const sameContent = resolveDuplicates(
        messages.map(({ content }) => content)
    );

    const mentions = resolveDuplicates(
        messages.flatMap(({ mentions }) => mentions.roles)
    );

    const duplicateImages = resolveDuplicates(
        messages.flatMap(({ hashes }) => hashes)
    )

    const messageBurst = messages.filter(
        m => Date.now() - m.timestamp < 5_000
    ).length;


    if (newMember) {
        score += 15;
        reasons.push('Joined within the month');
    }

    if (youngAccount) {
        score += 20;
        reasons.push('Account created within the month');
    }

    if (sameContent >= 3) {
        score += (5 * sameContent);
        reasons.push(`Repeated message (${sameContent})`);
    }

    if (mentions >= 3) {
        score += (10 * mentions);
        reasons.push(`Repeated mentions (${mentions})`);
    }

    if (duplicateImages >= 1) {
        score += 20 * duplicateImages;
        reasons.push(`Repeated attachment (${duplicateImages})`);
    }

    if (messageBurst >= 5) {
        score += 5 * (messageBurst - 2);
        reasons.push(`Message burst (${messageBurst} / 5s)`);
    }

    return { score, reasons, details: {
        youngAccount,
        newMember,

        mentions,
        sameContent,
        duplicateImages,
        messageBurst,
    } };
}

function getKeys<T>(collection: Collection<string, T>) {
    return collection.keys().toArray().sort();
}

function normalize(content: string): string {
    return content
        .toLowerCase()
        .replace(/https?:\/\/\S+/g, "{url}")
        .replace(/\s+/g, " ")
        .trim();
}


function resolveDuplicates<T extends string | number | symbol>(...arr: T[][]) {
    const duplicates = arr.flatMap(a => a)
        .reduce((a, b) => {
            // Increment for each result
            a[b] = (a[b] ?? 0) + 1;
            return a;
        }, {} as Record<T, number>);

    return (Object.entries(duplicates) as [T, number][])
        // if the key is a string, trim it 
        .map(([v, count]) => ([typeof v === 'string' ? v.trim() : v, count]) as const)
        // if counts are greater than 1 and keys are set, return the count
        .map(([v, count]) => (count > 1 && v) ? count : 0)
        // join the counts
        .reduce((a: number, b: number) => a + b, 0);
}
