import { useState, useCallback, useEffect } from 'react';

interface PanZoomState {
	panOffset: { x: number; y: number };
	isPanning: boolean;
	panStart: { x: number; y: number } | null;
}

export const usePanZoom = (canvasWidth: number, canvasHeight: number) => {
	const [panZoomState, setPanZoomState] = useState<PanZoomState>({
		panOffset: { x: 0, y: 0 },
		isPanning: false,
		panStart: null,
	});

	const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
		if (e.button === 0) {
			setPanZoomState(prev => ({
				...prev,
				isPanning: true,
				panStart: { x: e.clientX, y: e.clientY },
			}));
		}
	}, []);

	const handleCanvasMouseUp = useCallback(() => {
		setPanZoomState(prev => ({ ...prev, isPanning: false, panStart: null }));
	}, []);

	const handleCanvasMouseMove = useCallback((e: MouseEvent) => {
		setPanZoomState(prev => {
			if (prev.isPanning && prev.panStart) {
				const dx = e.clientX - prev.panStart.x;
				const dy = e.clientY - prev.panStart.y;
				return {
					...prev,
					panOffset: { x: prev.panOffset.x + dx, y: prev.panOffset.y + dy },
					panStart: { x: e.clientX, y: e.clientY },
				};
			}
			return prev;
		});
	}, []);

	useEffect(() => {
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;

		const centerX = (viewportWidth / 2) - (canvasWidth / 2);
		const centerY = (viewportHeight / 2) - (canvasHeight / 2);

		setPanZoomState(prev => ({ ...prev, panOffset: { x: centerX, y: centerY } }));
	}, [canvasWidth, canvasHeight]);

	useEffect(() => {
		document.addEventListener('mousemove', handleCanvasMouseMove);
		document.addEventListener('mouseup', handleCanvasMouseUp);
		return () => {
			document.removeEventListener('mousemove', handleCanvasMouseMove);
			document.removeEventListener('mouseup', handleCanvasMouseUp);
		};
	}, [handleCanvasMouseMove, handleCanvasMouseUp]);

	return {
		...panZoomState,
		handleCanvasMouseDown,
	};
};
