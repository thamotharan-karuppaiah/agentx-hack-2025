import { useState, useEffect } from 'react';
import { useReactFlow } from 'reactflow';

export const useZoomHandling = () => {
    const reactFlowInstance = useReactFlow();
    const [zoom, setZoom] = useState(50);

    useEffect(() => {
        const { zoom } = reactFlowInstance.getViewport();
        setZoom(Math.round(zoom * 100));
    }, [reactFlowInstance.getViewport()]);

    const handleWheel = (event: React.WheelEvent) => {
        if (event.ctrlKey || event.metaKey) {
            const { deltaY } = event;
            const { x, y, zoom } = reactFlowInstance.getViewport();
            const newZoom = deltaY > 0
                ? Math.max(0.2, zoom - 0.1)
                : Math.min(2, zoom + 0.1);
            reactFlowInstance.setViewport({ x, y, zoom: newZoom });
        }
        else {
            // scroll down / up canvas, dont zoom , only move the canvas vertically
            const { deltaY } = event;
            const { x, y, zoom } = reactFlowInstance.getViewport();
            const newY = y - deltaY;
            reactFlowInstance.setViewport({ x, y: newY, zoom });
        }
    };

    return {
        zoom,
        setZoom,
        handleWheel,
    };
}; 