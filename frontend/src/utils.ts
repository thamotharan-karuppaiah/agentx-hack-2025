/**
 * function to replace try/catch block with async await.
 * This resolves promise and returns
 * it with array of [error, response]
 */
export const parsePromise = <T>(
	promise: Promise<T>,
): Promise<[Error, undefined] | [undefined, T]> =>
	promise
		.then((response: T): [undefined, T] => [undefined, response])
		.catch((error: Error): [Error, undefined] => [error, undefined]);
