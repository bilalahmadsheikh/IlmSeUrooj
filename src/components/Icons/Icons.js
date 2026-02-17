'use client';

/** Shared icon set - no emojis, SVG only for accessibility and consistency */

export function IconBookmark({ className, ariaHidden }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden={ariaHidden} width="1em" height="1em">
      <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
    </svg>
  );
}

export function IconClose({ className, ariaHidden }) {
  return (
    <svg className={className} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" aria-hidden={ariaHidden} width="1em" height="1em">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

export function IconCheck({ className, ariaHidden }) {
  return (
    <svg className={className} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" aria-hidden={ariaHidden} width="1em" height="1em">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

export function IconArrowRight({ className, ariaHidden }) {
  return (
    <svg className={className} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" aria-hidden={ariaHidden} width="1em" height="1em">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

export function IconArrowLeft({ className, ariaHidden }) {
  return (
    <svg className={className} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" aria-hidden={ariaHidden} width="1em" height="1em">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

export function IconChevronUp({ className, ariaHidden }) {
  return (
    <svg className={className} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" aria-hidden={ariaHidden} width="1em" height="1em">
      <path d="M18 15l-6-6-6 6" />
    </svg>
  );
}

export function IconChevronDown({ className, ariaHidden }) {
  return (
    <svg className={className} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" aria-hidden={ariaHidden} width="1em" height="1em">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function IconNote({ className, ariaHidden }) {
  return (
    <svg className={className} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" aria-hidden={ariaHidden} width="1em" height="1em">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  );
}

export function IconCelebrate({ className, ariaHidden }) {
  return (
    <svg className={className} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" aria-hidden={ariaHidden} width="1em" height="1em">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83M8 12a4 4 0 118 0 4 4 0 01-8 0z" />
    </svg>
  );
}

export function IconScholarship({ className, ariaHidden }) {
  return (
    <svg className={className} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" aria-hidden={ariaHidden} width="1em" height="1em">
      <path d="M12 14l9-5-9-5-9 5 9 5z" />
      <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    </svg>
  );
}
