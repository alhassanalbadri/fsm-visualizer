// useResizeObserver.ts
import { useEffect, RefObject } from "react";

const useResizeObserver = (
	ref: RefObject<HTMLElement>,
	callback: (width: number, height: number) => void,
	options?: ResizeObserverOptions
) => {
	useEffect(() => {
		if (!ref.current) return;

		const observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const { width, height } = entry.contentRect;
				callback(width, height);
			}
		});

		observer.observe(ref.current, options);

		return () => {
			observer.disconnect();
		};
	}, [ref, callback, options]);
};

export default useResizeObserver;
