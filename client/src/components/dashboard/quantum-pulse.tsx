interface QuantumPulseProps {
  intensity: number;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  pulseColor?: string;
  className?: string;
}

export function QuantumPulse({ 
  intensity, 
  size = 'md', 
  color = '#6366F1', 
  pulseColor = '#C4B5FD',
  className = '' 
}: QuantumPulseProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      <div 
        className="absolute inset-0 rounded-full animate-pulse"
        style={{ backgroundColor: pulseColor, opacity: 0.3 }}
      />
      <div 
        className="absolute inset-2 rounded-full animate-ping"
        style={{ backgroundColor: color, opacity: 0.6 }}
      />
      <div 
        className="absolute inset-4 rounded-full"
        style={{ backgroundColor: color }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-white">
          {intensity}
        </span>
      </div>
    </div>
  );
}