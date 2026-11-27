import React, { useEffect, useRef, useState } from 'react';

export type TouchMovement = { x: number; y: number; running: boolean };

const CONTROL_QUERY = '(pointer: coarse), (max-width: 640px), (max-height: 500px)';
const IDLE = { x: 0, y: 0, running: false };

export function TouchJoystick({ movement, onStart }: {
  movement: React.RefObject<TouchMovement>;
  onStart: () => void;
}) {
  const baseRef = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ id: number; armed: boolean } | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const [armed, setArmed] = useState(false);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(CONTROL_QUERY);
    const reset = () => {
      gesture.current = null;
      movement.current = IDLE;
      setKnob(IDLE);
      setArmed(false);
      setLocked(false);
    };
    window.addEventListener('blur', reset);
    document.addEventListener('visibilitychange', reset);
    media.addEventListener('change', reset);
    return () => {
      movement.current = IDLE;
      window.removeEventListener('blur', reset);
      document.removeEventListener('visibilitychange', reset);
      media.removeEventListener('change', reset);
    };
  }, [movement]);

  const update = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = gesture.current;
    if (drag?.id !== e.pointerId || !baseRef.current) return;
    const rect = baseRef.current.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    const distance = Math.hypot(x, y);
    const radius = rect.width * 0.28;
    const scale = distance > radius ? radius / distance : 1;
    drag.armed = y < -rect.height * 0.62 && Math.abs(x) < -y * 0.55;
    setArmed(drag.armed);
    setKnob({ x: x * scale, y: y * scale });
    movement.current = distance > 7
      ? { x: x / distance, y: y / distance, running: drag.armed }
      : IDLE;
  };

  const finish = (e: React.PointerEvent<HTMLDivElement>, released: boolean) => {
    if (gesture.current?.id !== e.pointerId) return;
    if (released) update(e);
    const lock = released && gesture.current.armed;
    gesture.current = null;
    movement.current = lock ? { x: 0, y: -1, running: true } : IDLE;
    setKnob(IDLE);
    setArmed(false);
    setLocked(lock);
  };

  return (
    <div className="touch-controls">
      <button
        type="button"
        className="touch-sprint"
        disabled={!locked}
        data-armed={armed}
        onClick={() => {
          movement.current = IDLE;
          setLocked(false);
        }}
      >
        {locked ? 'Stop sprint' : armed ? 'Release to lock' : '↑ Sprint lock'}
      </button>
      <div
        ref={baseRef}
        className="touch-joystick"
        role="group"
        aria-label="Movement joystick. Drag up past the rim and release to lock sprint."
        onPointerDown={(e) => {
          if (gesture.current || e.button !== 0) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          gesture.current = { id: e.pointerId, armed: false };
          setLocked(false);
          onStart();
          update(e);
        }}
        onPointerMove={update}
        onPointerUp={(e) => finish(e, true)}
        onPointerCancel={(e) => finish(e, false)}
        onLostPointerCapture={(e) => finish(e, false)}
      >
        <span className="touch-joystick-knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
      </div>
    </div>
  );
}
