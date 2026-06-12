import { TTLCache } from "npm:@isaacs/ttlcache";

export interface MessageRecord {
    timestamp: number;
    content: string;
    mentions: MessageMentionsRecord;
    hashes: string[];

    guildId: string | null;
    channelId: string;
    messageId: string;
}

export interface MessageMentionsRecord {
    everyone: boolean,
    users: string[],
    roles: string[]
}

export interface UserActivity {
    messages: MessageRecord[];
}

export const activityCache = new TTLCache<string, UserActivity>({
    ttl: 5 * 60_000,
    max: 10_000
});

export function getActivity(userId: string): UserActivity {
    let activity = activityCache.get(userId);
    activity ??= { messages: [] };

    if (!activityCache.has(userId))
        activityCache.set(userId, activity);

    return activity;
}
