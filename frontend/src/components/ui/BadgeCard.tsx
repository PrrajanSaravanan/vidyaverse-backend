'use client';

import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface BadgeCardProps {
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earned?: boolean;
  earnedAt?: Date;
  xpValue?: number;
  progress?: number; // 0-100 for progress towards earning
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export default function BadgeCard({
  name,
  description,
  icon,
  rarity,
  earned = false,
  earnedAt,
  xpValue,
  progress,
  onClick,
  size = 'md'
}: BadgeCardProps) {
  const rarityColors = {
    common: 'from-gray-400 to-gray-600',
    rare: 'from-blue-400 to-blue-600',
    epic: 'from-purple-400 to-purple-600',
    legendary: 'from-yellow-400 to-yellow-600',
  };

  const rarityBorders = {
    common: 'border-gray-300',
    rare: 'border-blue-300',
    epic: 'border-purple-300',
    legendary: 'border-yellow-300',
  };

  const sizeClasses = {
    sm: 'w-16 h-20',
    md: 'w-20 h-24',
    lg: 'w-24 h-28',
  };

  const iconSizes = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-4xl',
  };

  return (
    <motion.div
      className={clsx(
        'relative cursor-pointer group',
        sizeClasses[size]
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      {/* Badge Container */}
      <div
        className={clsx(
          'relative w-full h-full rounded-lg border-2 p-2 flex flex-col items-center justify-center',
          earned ? 'opacity-100' : 'opacity-60 grayscale',
          rarityBorders[rarity],
          earned && 'shadow-lg'
        )}
      >
        {/* Background Gradient */}
        <div
          className={clsx(
            'absolute inset-0 rounded-lg opacity-20',
            'bg-gradient-to-br',
            rarityColors[rarity]
          )}
        />
        
        {/* Badge Icon */}
        <div className={clsx('relative z-10', iconSizes[size])}>
          {icon}
        </div>
        
        {/* Rarity Indicator */}
        <div className="absolute top-1 right-1">
          <div
            className={clsx(
              'w-2 h-2 rounded-full',
              rarity === 'common' && 'bg-gray-400',
              rarity === 'rare' && 'bg-blue-400',
              rarity === 'epic' && 'bg-purple-400',
              rarity === 'legendary' && 'bg-yellow-400 animate-pulse'
            )}
          />
        </div>
        
        {/* Progress Bar (if not earned) */}
        {!earned && progress !== undefined && progress > 0 && (
          <div className="absolute bottom-1 left-1 right-1">
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div
                className={clsx(
                  'h-1 rounded-full bg-gradient-to-r',
                  rarityColors[rarity]
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
        
        {/* Earned Checkmark */}
        {earned && (
          <div className="absolute -top-1 -right-1 bg-success-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
            ✓
          </div>
        )}
        
        {/* Legendary Glow Effect */}
        {earned && rarity === 'legendary' && (
          <div className="absolute inset-0 rounded-lg animate-pulse">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 rounded-lg blur-sm" />
          </div>
        )}
      </div>
      
      {/* Tooltip */}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
        <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap">
          <div className="font-semibold">{name}</div>
          <div className="text-gray-300">{description}</div>
          {xpValue && (
            <div className="text-yellow-400">+{xpValue} XP</div>
          )}
          {earnedAt && (
            <div className="text-gray-400 text-xs">
              Earned {earnedAt.toLocaleDateString()}
            </div>
          )}
          {!earned && progress !== undefined && (
            <div className="text-blue-400">
              Progress: {progress}%
            </div>
          )}
          {/* Tooltip Arrow */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-gray-900" />
        </div>
      </div>
    </motion.div>
  );
}