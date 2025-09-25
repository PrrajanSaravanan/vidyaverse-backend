'use client';

import { motion } from 'framer-motion';

interface XPBarProps {
  currentXP: number;
  level: number;
  animated?: boolean;
  showDetails?: boolean;
}

export default function XPBar({ currentXP, level, animated = true, showDetails = true }: XPBarProps) {
  // Calculate XP for current level (every 100 XP = 1 level)
  const xpForCurrentLevel = (level - 1) * 100;
  const xpForNextLevel = level * 100;
  const progressXP = currentXP - xpForCurrentLevel;
  const neededXP = xpForNextLevel - xpForCurrentLevel;
  const progressPercentage = (progressXP / neededXP) * 100;

  const remainingXP = xpForNextLevel - currentXP;

  return (
    <div className="space-y-2">
      {showDetails && (
        <div className="flex justify-between items-center text-sm">
          <span className="font-semibold text-gray-700">Level {level}</span>
          <span className="text-gray-500">
            {progressXP}/{neededXP} XP
          </span>
        </div>
      )}
      
      <div className="relative">
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          {animated ? (
            <motion.div
              className="h-full bg-gradient-to-r from-warning-500 to-warning-600 rounded-full relative"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
            </motion.div>
          ) : (
            <div
              className="h-full bg-gradient-to-r from-warning-500 to-warning-600 rounded-full"
              style={{ width: `${progressPercentage}%` }}
            />
          )}
        </div>
        
        {/* Sparkle effect for high progress */}
        {progressPercentage > 80 && (
          <div className="absolute top-0 right-0 -translate-y-1">
            <span className="text-warning-500 animate-pulse">✨</span>
          </div>
        )}
      </div>
      
      {showDetails && (
        <div className="text-xs text-gray-500 text-center">
          {remainingXP > 0 ? `${remainingXP} XP to next level` : 'Level up!'}
        </div>
      )}
    </div>
  );
}