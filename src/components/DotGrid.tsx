import React, { useRef, useEffect, useState, useCallback } from 'react';

interface DotGridProps {
    totalDots: number;
    passedDots: number;
    onDotClick?: (index: number, x: number, y: number) => void;
    customDotSize?: number;
    customGap?: number;
    zoomedIndex?: number | null;
}

const DotGrid: React.FC<DotGridProps> = ({
    totalDots,
    passedDots,
    onDotClick,
    customDotSize,
    customGap,
    zoomedIndex
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    // Animation refs for high performance (bypass React state during frames)
    const zoomProgressRef = useRef(0);
    const targetProgressRef = useRef(0);
    const animationFrameRef = useRef<number>(0);
    const lastZoomedIndex = useRef<number | null>(null);
    const lastRenderTime = useRef<number>(0);

    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.clientWidth,
                    height: window.innerHeight
                });
            }
        };

        window.addEventListener('resize', updateDimensions);
        updateDimensions();

        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    // Helper to calculate grid metrics
    const getGridMetrics = useCallback((canvasWidth: number) => {
        const style = getComputedStyle(document.body);
        const resolvedDotSize = customDotSize || parseInt(style.getPropertyValue('--dot-size').trim()) || 6;
        const resolvedDotGap = customGap !== undefined ? customGap : (parseInt(style.getPropertyValue('--dot-gap').trim()) || 4);
        const effectiveDotWidth = resolvedDotSize + resolvedDotGap;

        // Add padding for hover effects (approx max hover scale + glow)
        const PADDING = 20;

        // Calculate columns based on available width minus padding
        const usableWidth = canvasWidth - (PADDING * 2);
        const cols = Math.max(1, Math.floor((usableWidth + resolvedDotGap) / effectiveDotWidth));

        return { cols, effectiveDotWidth, dotSize: resolvedDotSize, dotGap: resolvedDotGap, padding: PADDING };
    }, [customDotSize, customGap]);

    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!onDotClick || !canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const { cols, effectiveDotWidth, dotSize, padding } = getGridMetrics(rect.width);

        const x = e.clientX - rect.left - padding;
        const y = e.clientY - rect.top - padding;

        if (x < 0 || y < 0) return;

        const col = Math.floor(x / effectiveDotWidth);
        const row = Math.floor(y / effectiveDotWidth);

        const relX = x % effectiveDotWidth;
        const relY = y % effectiveDotWidth;

        if (relX <= dotSize && relY <= dotSize) {
            const index = row * cols + col;
            if (index >= 0 && index < totalDots) {
                onDotClick(index, e.clientX, e.clientY);
            }
        }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const { cols, effectiveDotWidth, dotSize, padding } = getGridMetrics(rect.width);

        const x = e.clientX - rect.left - padding;
        const y = e.clientY - rect.top - padding;

        if (x < 0 || y < 0) {
            setHoveredIndex(null);
            return;
        }

        const col = Math.floor(x / effectiveDotWidth);
        const row = Math.floor(y / effectiveDotWidth);

        const relX = x % effectiveDotWidth;
        const relY = y % effectiveDotWidth;

        if (relX <= dotSize && relY <= dotSize) {
            const index = row * cols + col;
            if (index >= 0 && index < totalDots) {
                setHoveredIndex(index);
                return;
            }
        }
        setHoveredIndex(null);
    };

    const handleMouseLeave = () => {
        setHoveredIndex(null);
    };

    // Get computed styles once or on change
    const getColors = useCallback(() => {
        const style = getComputedStyle(document.body);
        return {
            past: style.getPropertyValue('--color-past').trim() || '#555',
            today: style.getPropertyValue('--color-today').trim() || '#00ff88',
            future: style.getPropertyValue('--color-future').trim() || '#222'
        };
    }, []);

    // Main drawing function - can be called by animation loop or re-renders
    const draw = useCallback((progress: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const colors = getColors();
        const availableWidth = dimensions.width || canvas.clientWidth;
        const { cols, effectiveDotWidth, dotSize, dotGap, padding } = getGridMetrics(availableWidth);

        const rows = Math.ceil(totalDots / cols);
        const gridHeight = rows * effectiveDotWidth - dotGap;
        const totalHeight = gridHeight + (padding * 2);

        // Zoom logic
        const focusIdx = zoomedIndex ?? lastZoomedIndex.current;
        let zoomX = 0;
        let zoomY = 0;
        let scale = 1;

        if (focusIdx !== null && progress > 0) {
            const col = focusIdx % cols;
            const row = Math.floor(focusIdx / cols);
            const targetX = col * effectiveDotWidth + (dotSize / 2);
            const targetY = row * effectiveDotWidth + (dotSize / 2);

            const targetScale = Math.min(availableWidth, totalHeight) / ((effectiveDotWidth || 1) * 3) || 15;
            scale = 1 + (targetScale - 1) * progress;

            const centerX = availableWidth / 2;
            const centerY = totalHeight / 2;

            zoomX = (centerX - (targetX + padding) * scale) * progress;
            zoomY = (centerY - (targetY + padding) * scale) * progress;
        }

        // Setup canvas (pixels)
        const pixelRatio = window.devicePixelRatio || 1;
        if (canvas.width !== availableWidth * pixelRatio || canvas.height !== totalHeight * pixelRatio) {
            canvas.width = availableWidth * pixelRatio;
            canvas.height = totalHeight * pixelRatio;
            canvas.style.width = `${availableWidth}px`;
            canvas.style.height = `${totalHeight}px`;
        }

        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        ctx.clearRect(0, 0, availableWidth, totalHeight);

        ctx.save();
        if (progress > 0) {
            ctx.translate(zoomX, zoomY);
            ctx.scale(scale, scale);
        }

        ctx.translate(padding, padding);
        const glowBlur = dotSize * 2;

        for (let i = 0; i < totalDots; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = col * effectiveDotWidth;
            const y = row * effectiveDotWidth;

            const isHovered = i === hoveredIndex;
            const currentDotRadius = isHovered ? (dotSize / 2) * 1.5 : (dotSize / 2);
            const cx = x + (dotSize / 2);
            const cy = y + (dotSize / 2);

            ctx.beginPath();
            ctx.arc(cx, cy, currentDotRadius, 0, Math.PI * 2);

            if (i < passedDots) {
                ctx.fillStyle = colors.past;
                ctx.shadowBlur = 0;
            } else if (i === passedDots) {
                ctx.fillStyle = colors.today;
                ctx.shadowColor = colors.today;
                ctx.shadowBlur = glowBlur;
            } else {
                ctx.fillStyle = colors.future;
                ctx.shadowBlur = 0;
            }

            if (isHovered) {
                if (i !== passedDots) {
                    ctx.fillStyle = i < passedDots ? '#888' : '#444';
                    ctx.shadowBlur = 0;
                } else {
                    ctx.shadowBlur = glowBlur * 1.5;
                }
            }

            ctx.fill();
            ctx.shadowBlur = 0;
        }
        ctx.restore();
    }, [dimensions, getGridMetrics, totalDots, passedDots, zoomedIndex, hoveredIndex, getColors]);

    // Animation Loop
    useEffect(() => {
        const target = zoomedIndex !== null ? 1 : 0;
        if (typeof zoomedIndex === 'number') lastZoomedIndex.current = zoomedIndex;

        targetProgressRef.current = target;

        const animate = (time: number) => {
            if (!lastRenderTime.current) lastRenderTime.current = time;
            const delta = time - lastRenderTime.current;
            lastRenderTime.current = time;

            const current = zoomProgressRef.current;
            const diff = targetProgressRef.current - current;

            if (Math.abs(diff) < 0.001) {
                zoomProgressRef.current = targetProgressRef.current;
                draw(zoomProgressRef.current);
                animationFrameRef.current = 0;
                return;
            }

            // Smooth interpolation (dampening)
            // progress = current + (target - current) * factor
            // factor based on time for frame-rate independence
            const speed = 0.15; // adjust for faster/slower feel
            const factor = 1 - Math.pow(1 - speed, delta / 16);

            zoomProgressRef.current = current + diff * factor;
            draw(zoomProgressRef.current);

            animationFrameRef.current = requestAnimationFrame(animate);
        };

        if (animationFrameRef.current === 0) {
            lastRenderTime.current = 0;
            animationFrameRef.current = requestAnimationFrame(animate);
        }

        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = 0;
        };
    }, [zoomedIndex, draw]);

    // Initial and hover draw
    useEffect(() => {
        draw(zoomProgressRef.current);
    }, [draw]);

    return (
        <div ref={containerRef} style={{
            width: '100%',
            minHeight: '100px',
            display: 'flex',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 10,
            overflow: 'visible'
        }}>
            <canvas
                ref={canvasRef}
                className={onDotClick ? 'interactive' : ''}
                onClick={handleCanvasClick}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{
                    cursor: onDotClick ? 'pointer' : 'default',
                    overflow: 'visible'
                }}
            />
            <style>{`
                /* Removed global active scale to prevent entire grid from reacting to clicks */
            `}</style>
        </div>
    );
};

export default DotGrid;
