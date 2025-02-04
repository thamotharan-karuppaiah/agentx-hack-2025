import { useCallback } from "react";
import { useToast } from "./use-toast";

/**
 * Hook to show a toast with a loading message and return a promise that resolves when the toast is dismissed.
 *
 * @returns {Object} An object with a show method that returns a promise and a dismiss method.
 * @example
 * Component = () => {
 *   const loader = useLoaderToast()
 *
 *   const save = async () => {
 *     loader.show("Loading...");
 *     await service.save(record);
 *     loader.success("Saved successfully");
 *   }
 *
 *   return <button onClick={save}>Save</button>;
 * }
 */
const useLoaderToast = () => {
	const { toast, dismiss } = useToast();

	/**
	 * Show a toast with a loading message and return a promise that resolves when the toast is dismissed.
	 *
	 * @param {string} loadingMessage - The message to show in the toast.
	 * @returns {Object} An object with a promise and a dismiss method.
	 */
	const show = useCallback(
		(loadingMessage?: string) => {
			const promise = new Promise((resolve, reject) => {
				if (loadingMessage) {
					toast({
						title: loadingMessage,
						variant: "default",
					});
				}

				return { resolve, reject };
			});

			return {
				promise,
				success: (successMessage?: string) => {
					dismiss();
					if (successMessage) {
						toast({
							title: successMessage,
							variant: "default",
						});
					}
				},
				error: (errorMessage?: string) => {
					dismiss();
					if (errorMessage) {
						toast({
							title: errorMessage,
							variant: "destructive",
						});
					}
				},
			};
		},
		[toast, dismiss],
	);

	return { show };
};

export default useLoaderToast;
