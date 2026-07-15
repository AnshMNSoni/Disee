import { useState, useRef, useEffect } from 'react';

/**
 * LogoAnimation — plays the .mov intro video once, then fades
 * to the static Logo.png. Both elements are non-selectable and
 * non-interactive.
 *
 * Props:
 *   videoSrc  – path to the animation video (default: /logo-animation.mov)
 *   logoSrc   – imported static logo image
 *   className – optional extra classes
 */
export default function LogoAnimation({ videoSrc = '/logo-animation.webm', logoSrc, className = '' }) {
  const [phase, setPhase] = useState('video'); // 'video' | 'fadingOut' | 'static'
  const videoRef = useRef(null);

  // When video ends → start cross-fade to static logo
  const handleEnded = () => {
    setPhase('fadingOut');
    // After the fade-out transition (600ms), switch to purely static
    setTimeout(() => setPhase('static'), 650);
  };

  // If video fails to load / play, skip straight to static
  const handleError = () => setPhase('static');

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    // Attempt autoplay (muted so browser allows it)
    vid.play().catch(() => setPhase('static'));
  }, []);

  const noSelect = {
    userSelect: 'none',
    WebkitUserSelect: 'none',
    pointerEvents: 'none',
    WebkitUserDrag: 'none',
    draggable: false,
  };

  return (
    <div
      className={className}
      style={{ position: 'relative', display: 'inline-block', ...noSelect }}
      aria-hidden="true"
    >
      {/* ── Video layer ── */}
      {phase !== 'static' && (
        <video
          ref={videoRef}
          src={videoSrc}
          muted
          playsInline
          onEnded={handleEnded}
          onError={handleError}
          style={{
            display: 'block',
            height: '192px',          // h-48 equivalent
            width: 'auto',
            objectFit: 'contain',
            opacity: phase === 'fadingOut' ? 0 : 1,
            transition: 'opacity 0.6s ease',
            ...noSelect,
          }}
        />
      )}

      {/* ── Static logo layer — always rendered beneath / after video ── */}
      {logoSrc && (
        <img
          src={logoSrc}
          alt="Disee logo"
          style={{
            display: 'block',
            height: '192px',
            width: 'auto',
            objectFit: 'contain',
            // When video is playing: invisible but taking same space
            // so layout doesn't jump when we swap
            position: phase === 'static' ? 'static' : 'absolute',
            top: 0,
            left: 0,
            opacity: phase === 'static' ? 1 : (phase === 'fadingOut' ? 1 : 0),
            transition: 'opacity 0.6s ease',
            ...noSelect,
          }}
        />
      )}
    </div>
  );
}
