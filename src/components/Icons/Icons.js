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

export function IconExternalLink({ className, ariaHidden }) {
  return (
    <svg className={className} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" aria-hidden={ariaHidden} width="1em" height="1em">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

export function IconCalendar({ className, ariaHidden }) {
  return (
    <svg className={className} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" aria-hidden={ariaHidden} width="1em" height="1em">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

export function IconShield({ className, ariaHidden }) {
  return (
    <svg className={className} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" aria-hidden={ariaHidden} width="1em" height="1em">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

export function IconLinkedIn({ className, ariaHidden }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden={ariaHidden} width="1em" height="1em">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

export function IconUsers({ className, ariaHidden }) {
  return (
    <svg className={className} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" aria-hidden={ariaHidden} width="1em" height="1em">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}
