import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6"
      style={{ background: '#F4F2FF' }}>
      <div className="text-center max-w-md w-full">

        {/* Animated 404 number */}
        <motion.div
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative mb-8 select-none">
          <div className="text-[120px] font-black leading-none tracking-tight"
            style={{ color: 'rgba(91,0,232,0.08)' }}>
            404
          </div>
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, delay: 0.5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{ background: 'white', border: '2px solid rgba(91,0,232,0.15)', boxShadow: '0 12px 40px rgba(91,0,232,0.14)' }}>
              <Compass className="w-9 h-9 text-[#5B00E8]" strokeWidth={1.5} />
            </div>
          </motion.div>
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}>
          <h1 className="text-[28px] font-extrabold text-[#0D0D0D] mb-3 tracking-tight">
            Lost in the architecture
          </h1>
          <p className="text-[14px] text-[#6B7280] mb-8 leading-relaxed">
            This page doesn't exist — or the blueprint was never built.
            <br />Head back and design something great.
          </p>
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/dashboard"
            className="flex items-center justify-center gap-2 h-11 px-6 rounded-xl text-[14px] font-semibold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #5B00E8, #7C3AED)', boxShadow: '0 4px 20px rgba(91,0,232,0.35)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 28px rgba(91,0,232,0.5)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(91,0,232,0.35)'; }}>
            <Home className="w-4 h-4" />
            Go to Dashboard
          </Link>
          <button onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 h-11 px-6 rounded-xl text-[14px] font-semibold text-[#374151] transition-all"
            style={{ background: 'white', border: '1.5px solid rgba(91,0,232,0.18)', boxShadow: '0 2px 8px rgba(91,0,232,0.06)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F4F2FF'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'white'; }}>
            <ArrowLeft className="w-4 h-4" />
            Go back
          </button>
        </motion.div>

        {/* Helpful links */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.4 }}
          className="mt-10 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[12px]">
          <span className="text-[#9CA3AF]">Were you looking for —</span>
          <Link to="/builder"    className="font-medium text-[#5B00E8] hover:underline">Builder</Link>
          <Link to="/analytics"  className="font-medium text-[#5B00E8] hover:underline">Analytics</Link>
          <Link to="/playground" className="font-medium text-[#5B00E8] hover:underline">Playground</Link>
          <Link to="/settings"   className="font-medium text-[#5B00E8] hover:underline">Settings</Link>
        </motion.div>
      </div>
    </div>
  );
}
