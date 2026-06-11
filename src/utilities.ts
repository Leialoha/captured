import { PartialTextBasedChannelFields, MessagePayload, MessageCreateOptions, Message } from "npm:discord.js@14";

type ErrorConstructors =
    | (new ( message?: string ) => Error)
    | (new ( message: string, ...args: any) => Error);

export async function catchErrorTyped<T, E extends ErrorConstructors>(
    promise: Promise<T>,
    errorsToCatch?: E[],
): Promise<[undefined, T] | [InstanceType<E>]> {
    return await promise
        .then((data) => [undefined, data] as [undefined, T])
        .catch((error) => {
            if (errorsToCatch?.some((e) => error instanceof e)) return [error];
            if (errorsToCatch === undefined) return [error];
            throw error;
        });
}

export async function safeExecute(
    promise: Promise<unknown>,
): Promise<unknown> {
    return await promise.then(() => undefined)
        .catch(console.error);
}

export async function tryMessage(
    channel: PartialTextBasedChannelFields,
    options: string | MessagePayload | MessageCreateOptions
) {
    await safeExecute(channel.send(options));
}


export async function tryReply(
    message: Message,
    options: string | MessagePayload | MessageCreateOptions
) {
    await safeExecute(message.reply(options));
}

export function getFails<T>( ...checks: ([boolean, T])[] ): undefined | T[] {
    const results = checks.filter(([check]) => check);
    if (results.length === 0) return undefined;
    return results.map(([, result]) => result);
}