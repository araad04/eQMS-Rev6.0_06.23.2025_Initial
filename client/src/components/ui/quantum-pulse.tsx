import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface QuantumPulseProps {
  className?: string;
  intensity?: number; // 1-10
  color?: string;
  pulseColor?: string;
  size?: "sm" | "md" | "lg";
  active?: boolean;
}

/**
 * Quantum Pulse Component
 * 
 * A futuristic visual element that creates a pulsing particle effect
 * simulating quantum entanglement. Can be used as status indicators,
 * data processing visualizations, or decorative elements.
 */
export function QuantumPulse({
  className,
  intensity = 5,
  color = "#6366F1",
  pulseColor = "#C4B5FD",
  size = "md",
  active = true
}: QuantumPulseProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);
  
  // Size mapping
  const sizeMap = {
    sm: { width: 60, height: 60, particleCount: 20 },
    md: { width: 100, height: 100, particleCount: 40 },
    lg: { width: 150, height: 150, particleCount: 60 }
  };
  
  const { width, height, particleCount } = sizeMap[size];
  
  // Particle class
  class Particle {
    x: number;
    y: number;
    radius: number;
    baseRadius: number;
    vx: number;
    vy: number;
    phase: number;
    phaseSpeed: number;
    entangled: Particle | null = null;
    
    constructor(x: number, y: number, radius: number) {
      this.x = x;
      this.y = y;
      this.radius = radius;
      this.baseRadius = radius;
      this.vx = (Math.random() - 0.5) * 0.3 * intensity;
      this.vy = (Math.random() - 0.5) * 0.3 * intensity;
      this.phase = Math.random() * Math.PI * 2;
      this.phaseSpeed = 0.03 + Math.random() * 0.03;
    }
    
    update(ctx: CanvasRenderingContext2D, width: number, height: number) {
      // Update position
      this.x += this.vx;
      this.y += this.vy;
      
      // Bounce off edges
      if (this.x < this.radius || this.x > width - this.radius) {
        this.vx = -this.vx;
      }
      
      if (this.y < this.radius || this.y > height - this.radius) {
        this.vy = -this.vy;
      }
      
      // Update phase
      this.phase += this.phaseSpeed;
      if (this.phase > Math.PI * 2) {
        this.phase -= Math.PI * 2;
      }
      
      // Pulsate size based on phase
      this.radius = this.baseRadius * (1 + 0.2 * Math.sin(this.phase));
      
      // Draw particle
      const gradient = ctx.createRadialGradient(
        this.x, this.y, 0,
        this.x, this.y, this.radius
      );
      
      gradient.addColorStop(0, color + "FF");
      gradient.addColorStop(0.6, color + "60");
      gradient.addColorStop(1, color + "00");
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw entanglement line if particle is entangled
      if (this.entangled) {
        const distance = Math.sqrt(
          Math.pow(this.x - this.entangled.x, 2) + 
          Math.pow(this.y - this.entangled.y, 2)
        );
        
        // Only draw connections if particles are within range
        if (distance < width / 3) {
          const opacity = 1 - (distance / (width / 3));
          
          ctx.strokeStyle = pulseColor + Math.floor(opacity * 255).toString(16).padStart(2, '0');
          ctx.lineWidth = 0.5 * opacity;
          
          ctx.beginPath();
          ctx.moveTo(this.x, this.y);
          
          // Create a bezier curve with a control point that oscillates based on the phase
          const midX = (this.x + this.entangled.x) / 2;
          const midY = (this.y + this.entangled.y) / 2;
          
          // Offset the control point perpendicular to the line direction
          const dx = this.entangled.x - this.x;
          const dy = this.entangled.y - this.y;
          const perpX = -dy;
          const perpY = dx;
          const len = Math.sqrt(perpX * perpX + perpY * perpY);
          
          const curveMagnitude = 15 * Math.sin((this.phase + this.entangled.phase) / 2);
          const ctrlX = midX + (perpX / len) * curveMagnitude;
          const ctrlY = midY + (perpY / len) * curveMagnitude;
          
          ctx.quadraticCurveTo(ctrlX, ctrlY, this.entangled.x, this.entangled.y);
          ctx.stroke();
        }
      }
    }
  }
  
  // Initialize animation
  useEffect(() => {
    if (!active) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Set canvas size
    canvas.width = width;
    canvas.height = height;
    
    // Create particles
    particlesRef.current = [];
    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const radius = 1 + Math.random() * 2;
      particlesRef.current.push(new Particle(x, y, radius));
    }
    
    // Create entanglements (connect pairs of particles)
    for (let i = 0; i < particlesRef.current.length; i += 2) {
      if (i + 1 < particlesRef.current.length) {
        particlesRef.current[i].entangled = particlesRef.current[i + 1];
        particlesRef.current[i + 1].entangled = particlesRef.current[i];
      }
    }
    
    // Animation function
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      particlesRef.current.forEach(particle => {
        particle.update(ctx, width, height);
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    // Cleanup
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [active, color, pulseColor, height, intensity, width, particleCount]);
  
  return (
    <div className={cn("relative inline-block", className)}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="quantum-pulse"
      />
    </div>
  );
}