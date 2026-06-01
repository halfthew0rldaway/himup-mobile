import React, { useState, useEffect, useRef } from 'react';
import { Loader2, ArrowDown } from 'lucide-react';
import { W } from '@/lib/design';

export const PullToRefresh: React.FC<{ onRefresh: () => Promise<void>; children: React.ReactNode }> = ({ onRefresh, children }) => {
  const [startY, setStartY] = useState(0);
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [offset, setOffset] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const MAX_PULL = 80;

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (el.scrollTop === 0 && !refreshing) {
        setStartY(e.touches[0].clientY);
      } else {
        setStartY(0);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!startY || refreshing) return;
      
      const y = e.touches[0].clientY;
      const dist = y - startY;

      // Only pull if scrolling down from top
      if (dist > 0 && el.scrollTop <= 0) {
        setPulling(true);
        // Exponential decay for tension effect
        const pullOffset = Math.min(dist * 0.4, MAX_PULL);
        setOffset(pullOffset);
        
        // Prevent default only when pulling down to avoid blocking normal scroll
        if (e.cancelable) e.preventDefault();
      }
    };

    const onTouchEnd = async () => {
      if (!startY || refreshing) return;
      
      if (offset > MAX_PULL * 0.7) {
        setRefreshing(true);
        setOffset(MAX_PULL * 0.6); // Hold position while refreshing
        try {
          await onRefresh();
        } finally {
          setRefreshing(false);
          setOffset(0);
          setPulling(false);
        }
      } else {
        // Cancel pull
        setOffset(0);
        setPulling(false);
      }
      setStartY(0);
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [startY, refreshing, offset, onRefresh]);

  return (
    <div ref={contentRef} style={{ height: '100%', overflowY: 'auto', position: 'relative', WebkitOverflowScrolling: 'touch' }}>
      <div 
        style={{ 
          position: 'absolute', 
          top: 0, left: 0, right: 0, 
          height: 60, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          opacity: (offset / MAX_PULL),
          transform: `translateY(${offset - 60}px)`,
          transition: pulling ? 'none' : 'transform 0.3s, opacity 0.3s',
          color: W.gray500,
          zIndex: 10
        }}
      >
        {refreshing ? (
          <Loader2 size={24} className="spin" color={W.orange500} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}>
            <ArrowDown size={18} style={{ transform: offset > MAX_PULL * 0.7 ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            {offset > MAX_PULL * 0.7 ? 'Release to refresh' : 'Pull down to refresh'}
          </div>
        )}
      </div>

      <div 
        style={{ 
          transform: `translateY(${offset}px)`, 
          transition: pulling ? 'none' : 'transform 0.3s',
          minHeight: '100%'
        }}
      >
        {children}
      </div>
    </div>
  );
};
