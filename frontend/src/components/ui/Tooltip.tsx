import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  content: string;
  placement?: TooltipPlacement;
  delay?: number;
  children: React.ReactNode;
}

const OFFSETS: Record<TooltipPlacement, { top?: string; bottom?: string; left?: string; right?: string; transform: string }> = {
  top:    { bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)' },
  bottom: { top: 'calc(100% + 8px)',    left: '50%', transform: 'translateX(-50%)' },
  left:   { right: 'calc(100% + 8px)', top: '50%',  transform: 'translateY(-50%)' },
  right:  { left: 'calc(100% + 8px)',  top: '50%',  transform: 'translateY(-50%)' },
};

const ENTER_DIRECTION: Record<TooltipPlacement, object> = {
  top:    { y: 4 },
  bottom: { y: -4 },
  left:   { x: 4 },
  right:  { x: -4 },
};

/**
 * Lightweight accessible tooltip — wraps any element with a hover/focus
 * label. Uses Framer Motion for smooth fade+slide entrance.
 *
 * @example
 * <Tooltip content="Copy to clipboard">
 *   <button>Copy</button>
 * </Tooltip>
 */
export function Tooltip({ content, placement = 'top', delay = 200, children }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = () => {
    timeoutRef.current = setTimeout(() => setVisible(true), delay);
  };

  const hide = () => {
    clearTimeout(timeoutRef.current);
    setVisible(false);
  };

  const pos = OFFSETS[placement];
  const enter = ENTER_DIRECTION[placement];

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}

      <AnimatePresence>
        {visible && (
          <motion.div
            role="tooltip"
            initial={{ opacity: 0, ...enter }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, ...enter }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 pointer-events-none whitespace-nowrap"
            style={{ ...pos }}
          >
            <div
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold leading-none"
              style={{
                background: '#0D0D0D',
                color: '#FFFFFF',
                boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
              }}
            >
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
