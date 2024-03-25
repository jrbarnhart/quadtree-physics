import { useCallback, useEffect, useRef, useState } from "react";
import animate from "./animate";
import useWindowSize from "./useWindowSize";
import HeadsUpDisplay from "./HUD";
import _ from "lodash";
import useParticles from "./useParticles";

const SimCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [canvasInitialized, setCanvasInitialized] = useState<boolean>(false);
  const [particlesInitialized, setParticlesInitialized] =
    useState<boolean>(false);
  const animationFrameRef = useRef<number | null>(null);
  const windowSize = useWindowSize();

  // Array buffer for particle data
  // x, y, vx, vy, m, r are float32 and colorRGB is four int8 for a total of 28 bytes / particle
  const initialParticleCount = 10;

  // Data view and methods for interacting with array buffer
  const particles = useParticles(initialParticleCount);

  // State for HUD
  const [mousePosX, setMousePosX] = useState<number | null>(null);
  const [mousePosY, setMousePosY] = useState<number | null>(null);
  const [totalParticles, setTotalParticles] = useState<number | null>(null);

  // State for toggling rect draws
  const [drawQuadtree, setDrawQuadtree] = useState<boolean>(false);

  // Handle mouse move by updating overlay with mouse position
  const throttleRef = useRef(
    _.throttle((event: React.MouseEvent) => {
      setMousePosX(event.clientX);
      setMousePosY(event.clientY);
    }, 200)
  );

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    throttleRef.current(event);
  }, []);

  // Handle clicks by creating a particle with random properties
  const handleClick = (event: React.MouseEvent) => {
    if (canvasRef.current) {
      // Get mouse position on canvas
      const rect = canvasRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Add to the particles using method

      // Update total particles state
      setTotalParticles((prev) => (prev ? prev + 10 : 10));
    }
  };

  // Initialize canvas
  useEffect(() => {
    // Set canvas context ref
    if (canvasRef.current) {
      contextRef.current = canvasRef.current.getContext("2d");
      setCanvasInitialized(true);
      console.log("Canvas intialized.");
    }
  }, []);

  // Initialize particle data
  useEffect(() => {
    if (canvasInitialized && !particlesInitialized && canvasRef.current) {
      // Randomize particle data
      particles.randomize(canvasRef.current.width, canvasRef.current.height);
      setParticlesInitialized(true);
    }
  }, [canvasInitialized, particles, particlesInitialized]);

  // Define animation loop
  const animationLoop = useCallback(() => {
    if (!canvasRef.current || !contextRef.current) return;

    animate({
      particleData: particles.data,
      canvasWidth: canvasRef.current.width,
      canvasHeight: canvasRef.current.height,
      ctx: contextRef.current,
      drawQuadtree,
    });

    animationFrameRef.current = requestAnimationFrame(() => {
      animationLoop();
    });
  }, [drawQuadtree, particles.data]);

  // Start the animation if canvas is initialized
  useEffect(() => {
    if (canvasInitialized && particlesInitialized) {
      // Start animation loop with requestAnimationFrame
      animationLoop();
      console.log("Animation started.");
    }
  }, [animationLoop, canvasInitialized, particlesInitialized]);

  return (
    <div className="relative">
      <canvas
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        height={windowSize.height}
        width={windowSize.width}
        className="bg-black"
        ref={canvasRef}
      ></canvas>
      <HeadsUpDisplay
        mousePosX={mousePosX}
        mousePosY={mousePosY}
        totalParticles={totalParticles}
        setDrawQuadtree={setDrawQuadtree}
      />
    </div>
  );
};

export default SimCanvas;
