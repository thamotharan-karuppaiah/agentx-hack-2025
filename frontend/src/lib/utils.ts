import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/** Debounce function */
type DebouncedFunction<T extends any[]> = {
  (this: any, ...args: T): void;
  cancel: () => void;
}

export function debounce<T extends any[]>(
	func: (...args: T) => void,
	wait: number,
): DebouncedFunction<T> {
	let timeout: NodeJS.Timeout;

	const debounced = function (this: any, ...args: T) {
		clearTimeout(timeout);
		timeout = setTimeout(() => func.apply(this, args), wait);
	} as DebouncedFunction<T>;

	debounced.cancel = () => {
		clearTimeout(timeout);
	};

	return debounced;
}
/** End of Debounce function */
