"use client";

import { motion } from "framer-motion";
import { Zap, Clock, Star, ArrowRight } from "lucide-react";

interface ComingSoonProps {
  feature: string;
  description?: string;
  expectedDate?: string;
}

export default function ComingSoon({
  feature,
  description = "This feature is currently being integrated. Stay tuned for updates!",
  expectedDate = "Q1 2024",
}: ComingSoonProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="neon-glass-strong p-12 rounded-2xl border border-neon-purple/30 text-center max-w-2xl w-full"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-neon-purple to-neon-blue rounded-full flex items-center justify-center neon-glow-purple"
        >
          <Zap className="w-10 h-10 text-white" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-4xl font-bold mb-4 neon-text-gradient"
        >
          {feature}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-gray-300 text-lg mb-8 leading-relaxed"
        >
          {description}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center space-x-6 mb-8"
        >
          <div className="flex items-center space-x-2 text-neon-blue">
            <Clock className="w-5 h-5" />
            <span className="text-sm font-medium">
              Expected: {expectedDate}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-neon-green">
            <Star className="w-5 h-5" />
            <span className="text-sm font-medium">High Priority</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="space-y-4"
        >
          <button className="btn-neon-purple w-full sm:w-auto">
            <span>Get Notified When Ready</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>

          <div className="text-sm text-gray-400">
            Want to be the first to know? We'll send you an update when this
            feature launches.
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-8 pt-8 border-t border-white/10"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-neon-blue">50+</div>
              <div className="text-xs text-gray-400">Features Planned</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-neon-green">24/7</div>
              <div className="text-xs text-gray-400">Development</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-neon-purple">
                AI-First
              </div>
              <div className="text-xs text-gray-400">Approach</div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
