'use client';

import { motion } from 'framer-motion';

interface WorkflowCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
  buttonText: string;
  buttonColor: string;
  onStart: () => void;
  disabled?: boolean;
}

export default function WorkflowCard({
  icon,
  title,
  description,
  features,
  buttonText,
  buttonColor,
  onStart,
  disabled = false
}: WorkflowCardProps) {
  return (
    <motion.div
      className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-all duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      {/* Icon */}
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center shadow-inner">
          {icon}
        </div>
      </div>

      {/* Title */}
      <h2 className="text-2xl font-bold text-gray-800 text-center mb-4">{title}</h2>

      {/* Description */}
      <p className="text-gray-600 text-center mb-6 leading-relaxed">{description}</p>

      {/* Features */}
      <div className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <div key={index} className="flex items-center space-x-3">
            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-gray-700 text-sm">{feature}</span>
          </div>
        ))}
      </div>

      {/* Button */}
      <motion.button
        onClick={onStart}
        disabled={disabled}
        className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 ${buttonColor} ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg transform hover:scale-105'
        }`}
        whileHover={!disabled ? { scale: 1.02 } : {}}
        whileTap={!disabled ? { scale: 0.98 } : {}}
      >
        {buttonText}
      </motion.button>
    </motion.div>
  );
}
