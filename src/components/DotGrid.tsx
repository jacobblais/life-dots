import React, { useRef, useEffect, useState, useCallback } from 'react';

// Define the properties (props) this component accepts
interface DotGridProps {
    totalDots: number;
    passedDots: number;
    onDotClick?: (index: number, x: number, y: number) => void;
    customDotSize?: number;
    customGap?: number;
    zoomedIndex?: number | null;
    getDotColor?: (index: number) => string | null; // New prop for dynamic coloring
}

/**
 * DotGrid Component
 * This component renders a grid of dots using an HTML5 Canvas for performance.
 * We use Canvas instead of standard DOM elements (divs) because rendering hundreds
 * of individual DOM nodes can be slow, especially when animating them.
 */
const DotGrid: React.FC<DotGridProps> = ({
    totalDots,
    passedDots,
    onDotClick,
    customDotSize,
    customGap,
    zoomedIndex,
    getDotColor
}) => {
    // Refs allow us to access the actual DOM elements directly
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // State to store the dimensions of our drawing area
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    // State to track which dot is currently being hovered over
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    /**
     * Animation Refs
     * We use refs instead of state for animation values (like progress)
     * because updating React state causes a re-render.
     * We want to update these values 60 times a second without re-running the whole React component life-cycle.
     */
    const currentTransform = useRef({ x: 0, y: 0, k: 1 });
    const animationFrameRef = useRef<number>(0);
    const lastRenderTime = useRef<number>(0);

    /**
     * Effect: Resize Handler
     * This effect runs once on mount and sets up a listener to update dimensions when the window resizes.
     */
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.clientWidth,
                    height: window.innerHeight // Full screen height
                });
            }
        };

        window.addEventListener('resize', updateDimensions);
        updateDimensions();

        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    /**
     * Helper Function: Grid Metrics
     * Calculates how many columns fit on the screen, how big each dot is, etc.
     * `useCallback` ensures this function isn't re-created on every render.
     */
    const getGridMetrics = useCallback((canvasWidth: number) => {
        const style = getComputedStyle(document.body);
        // Get sizes from CSS variables or falls back to defaults
        const resolvedDotSize = customDotSize || parseInt(style.getPropertyValue('--dot-size').trim()) || 6;
        const resolvedDotGap = customGap !== undefined ? customGap : (parseInt(style.getPropertyValue('--dot-gap').trim()) || 4);
        const effectiveDotWidth = resolvedDotSize + resolvedDotGap;

        // Add padding around the edges of the canvas to safe-guard against glow/zoom cropping
        const PADDING = 40;

        // Calculate columns: (available width) / (dot width)
        const usableWidth = canvasWidth - (PADDING * 2);
        const cols = Math.max(1, Math.floor((usableWidth + resolvedDotGap) / effectiveDotWidth));

        return { cols, effectiveDotWidth, dotSize: resolvedDotSize, dotGap: resolvedDotGap, padding: PADDING };
    }, [customDotSize, customGap]);

    /**
     * Click Handler
     * Converts a click on the <canvas> (x,y pixels) into a specific dot index.
     */
    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!onDotClick || !canvasRef.current || zoomedIndex !== null) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const { cols, effectiveDotWidth, padding } = getGridMetrics(rect.width);

        // adjust click coordinates to be relative to the canvas content (minus padding)
        const x = e.clientX - rect.left - padding;
        const y = e.clientY - rect.top - padding;

        if (x < 0 || y < 0) return;

        // Simple math to find which row and column was clicked
        const col = Math.floor(x / effectiveDotWidth);
        const row = Math.floor(y / effectiveDotWidth);

        const index = row * cols + col;
        if (index >= 0 && index < totalDots) {
            onDotClick(index, e.clientX, e.clientY);
        }
    };

    /**
     * Mouse Move Handler
     * Used for hover effects. Now uses the full square hitbox for easier interaction.
     */
    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!canvasRef.current || zoomedIndex !== null) {
            if (hoveredIndex !== null) setHoveredIndex(null);
            return;
        }

        const rect = canvasRef.current.getBoundingClientRect();
        const { cols, effectiveDotWidth, padding } = getGridMetrics(rect.width);

        const x = e.clientX - rect.left - padding;
        const y = e.clientY - rect.top - padding;

        if (x < 0 || y < 0) {
            setHoveredIndex(null);
            return;
        }

        const col = Math.floor(x / effectiveDotWidth);
        const row = Math.floor(y / effectiveDotWidth);

        const index = row * cols + col;
        if (index >= 0 && index < totalDots) {
            setHoveredIndex(index);
            return;
        }
        setHoveredIndex(null);
    };

    const handleMouseLeave = () => {
        setHoveredIndex(null);
    };

    /**
     * Helper to get colors from CSS variables
     */
    const getColors = useCallback(() => {
        const style = getComputedStyle(document.body);
        return {
            past: style.getPropertyValue('--color-past').trim() || '#555',
            today: style.getPropertyValue('--color-today').trim() || '#00ff88',
            future: style.getPropertyValue('--color-future').trim() || '#222',
            bg: style.getPropertyValue('--color-bg').trim() || '#111'
        };
    }, []);

    /**
     * MAIN DRAW FUNCTION
     * This is where the magic happens. This function clears the canvas and re-draws every single dot
     * based on the current state. It is called repeatedly by the animation loop.
     */
    const draw = useCallback((transform: { x: number, y: number, k: number }) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const colors = getColors();
        const availableWidth = dimensions.width || canvas.clientWidth;
        const { cols, effectiveDotWidth, dotSize, dotGap, padding } = getGridMetrics(availableWidth);

        const rows = Math.ceil(totalDots / cols);
        const gridHeight = rows * effectiveDotWidth - dotGap;
        // Ensure the canvas is at least as tall as the window so centering works
        const totalHeight = Math.max(gridHeight + (padding * 2), window.innerHeight);

        // Resize canvas if needed (handling high DPI screens like Retinas)
        const pixelRatio = window.devicePixelRatio || 1;
        if (canvas.width !== availableWidth * pixelRatio || canvas.height !== totalHeight * pixelRatio) {
            canvas.width = availableWidth * pixelRatio;
            canvas.height = totalHeight * pixelRatio;
            canvas.style.width = `${availableWidth}px`;
            canvas.style.height = `${totalHeight}px`;
        }

        // Reset transform and clear screen
        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        ctx.clearRect(0, 0, availableWidth, totalHeight);

        ctx.save();

        // Apply interpolated transform
        ctx.translate(transform.x, transform.y);
        ctx.scale(transform.k, transform.k);

        ctx.translate(padding, padding); // Apply padding
        const glowBlur = dotSize * 2;


        // Loop through all dots and draw them
        const now = new Date();
        const secondsPassed = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
        const dayProgress = secondsPassed / 86400;

        for (let i = 0; i < totalDots; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = col * effectiveDotWidth;
            const y = row * effectiveDotWidth;

            const isHovered = i === hoveredIndex;
            const isSelected = i === zoomedIndex; // Only highlight the *actual* selected index

            // Calculate dot radius
            let currentDotRadius = dotSize / 2;

            // Make hovered dots 50% larger
            if (isHovered) {
                currentDotRadius *= 1.5;
            }

            // Grow selected dot slightly
            if (isSelected && transform.k > 1.1) {
                // Determine 'progress' roughly by how close scale is to target
                // For simplicity, just use a fixed growth when zoomed in
                currentDotRadius *= 1.3;
            }

            const cx = x + (dotSize / 2);
            const cy = y + (dotSize / 2);

            ctx.beginPath();
            ctx.arc(cx, cy, currentDotRadius, 0, Math.PI * 2);

            // COLOR DETERMINATION
            // 1. Check if a custom color is provided (Habit or Aggregation)
            const customColor = getDotColor ? getDotColor(i) : null;

            if (customColor) {
                ctx.fillStyle = customColor;
                ctx.shadowBlur = 0;

                // Optional: Add glow for custom colored dots (like green habits)
                if (customColor !== colors.past && customColor !== colors.future) {
                    // Calculate intensity for glow
                    ctx.shadowColor = customColor;
                    ctx.shadowBlur = dotSize;
                }
            } else {
                // 2. Default Coloring Logic

                // Color logic: Past = Grey, Today = Gradient, Future = Dark Grey
                if (i < passedDots) {
                    ctx.fillStyle = colors.past;
                    ctx.shadowBlur = 0;
                } else if (i === passedDots) {
                    // Gradient for 'Today' dot
                    const gradient = ctx.createLinearGradient(0, cy + currentDotRadius, 0, cy - currentDotRadius);

                    // Dark green for the future part (not used up)
                    const darkGreen = 'rgba(0, 255, 136, 0.25)';

                    // Passed part
                    gradient.addColorStop(0, colors.today);
                    gradient.addColorStop(dayProgress, colors.today);
                    // Future part
                    gradient.addColorStop(dayProgress, darkGreen);
                    gradient.addColorStop(1, darkGreen);

                    // DRAW GLOW: Draw an opaque circle behind to cast the full shadow
                    ctx.save();
                    ctx.fillStyle = colors.bg;
                    ctx.shadowColor = colors.today;
                    ctx.shadowBlur = glowBlur;
                    ctx.fill();
                    ctx.restore();

                    // DRAW FILL: Draw the gradient on top without shadow
                    ctx.fillStyle = gradient;
                    ctx.shadowBlur = 0;
                } else {
                    ctx.fillStyle = colors.future;
                    ctx.shadowBlur = 0;
                }
            }

            // Hover effects
            if (isHovered) {
                if (i !== passedDots && !customColor) {
                    ctx.fillStyle = i < passedDots ? '#888' : '#444';
                    ctx.shadowBlur = 0;
                } else if (customColor) {
                    ctx.shadowBlur = glowBlur * 1.5;
                } else {
                    ctx.shadowBlur = glowBlur * 1.5;
                }
            }

            ctx.fill();
            ctx.shadowBlur = 0; // Reset shadow for next dot
        }
        ctx.restore(); // Restore state (undo zoom transform)
    }, [dimensions, getGridMetrics, totalDots, passedDots, zoomedIndex, hoveredIndex, getColors, getDotColor]);

    /**
     * Animation Loop
     */
    useEffect(() => {
        const animate = (time: number) => {
            if (!lastRenderTime.current) lastRenderTime.current = time;
            const delta = time - lastRenderTime.current;
            lastRenderTime.current = time;

            // Determine Target Transform
            let targetK = 1;
            let targetX = 0;
            let targetY = 0;

            if (typeof zoomedIndex === 'number') {
                const canvas = canvasRef.current;
                const availableWidth = canvas ? canvas.clientWidth : window.innerWidth;
                const { cols, effectiveDotWidth, dotSize, padding } = getGridMetrics(availableWidth);

                const col = zoomedIndex % cols;
                const row = Math.floor(zoomedIndex / cols);

                // Center of the target dot in grid coordinates
                const dotCenterX = col * effectiveDotWidth + (dotSize / 2);
                const dotCenterY = row * effectiveDotWidth + (dotSize / 2);

                // Target Scale: Fit ~5 dots
                targetK = Math.min(availableWidth, window.innerHeight) / (effectiveDotWidth * 5);

                // Target Translation: Move dot center to screen center
                // Screen Center
                const rect = canvas ? canvas.getBoundingClientRect() : { left: 0, top: 0 };
                const centerX = (window.innerWidth / 2) - rect.left;
                const centerY = (window.innerHeight / 2) - rect.top;

                // We want: (dotCenterX + padding) * k + x = centerX
                // So: x = centerX - (dotCenterX + padding) * k
                targetX = centerX - (dotCenterX + padding) * targetK;
                targetY = centerY - (dotCenterY + padding) * targetK;
            }

            // Lerp current towards target
            // Using a spring-like lerp factor
            const speed = 0.12;
            const factor = 1 - Math.pow(1 - speed, delta / 16);

            const curr = currentTransform.current;

            // Stop when close enough
            if (Math.abs(curr.k - targetK) < 0.001 &&
                Math.abs(curr.x - targetX) < 0.5 &&
                Math.abs(curr.y - targetY) < 0.5) {

                if (curr.k !== targetK || curr.x !== targetX || curr.y !== targetY) { // Ensure we snap to target if not already there
                    currentTransform.current = { x: targetX, y: targetY, k: targetK };
                    draw(currentTransform.current);
                }
                animationFrameRef.current = 0; // Stop the loop
                return;
            }

            currentTransform.current = {
                x: curr.x + (targetX - curr.x) * factor,
                y: curr.y + (targetY - curr.y) * factor,
                k: curr.k + (targetK - curr.k) * factor
            };
            draw(currentTransform.current);
            animationFrameRef.current = requestAnimationFrame(animate);
        };

        // Always start loop
        animationFrameRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = 0;
        };
    }, [zoomedIndex, draw, getGridMetrics]); // changes in zoomedIndex will trigger re-mount of effect which restarts loop is fine


    // Initial draw on mount and when dependencies change (like getDotColor)
    useEffect(() => {
        draw(currentTransform.current);
    }, [draw]);

    // Auto-refresh every minute to update day progress
    useEffect(() => {
        const interval = setInterval(() => {
            draw(currentTransform.current);
        }, 60000);
        return () => clearInterval(interval);
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
        </div>
    );
};

export default DotGrid;
