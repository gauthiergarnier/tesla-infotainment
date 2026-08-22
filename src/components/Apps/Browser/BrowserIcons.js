import React from 'react';

/**
 * Recreations of the browser chrome glyphs the car ships in
 * /usr/tesla/UI/assets/day/web/ — back, forward, refresh, stop, add (an
 * outline star, "add to favourites") and favorite (a folder with a filled
 * star, "open favourites"). The originals are 60x60 indexed PNGs; these are
 * drawn to the same 60x60 grid so the proportions and stroke weight match.
 *
 * They are redrawn rather than copied: the firmware art is Tesla's, and this
 * is a public repo.
 */

const box = {
  viewBox: '0 0 60 60',
  xmlns: 'http://www.w3.org/2000/svg',
  focusable: 'false',
  'aria-hidden': true,
};

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 4,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export const BackIcon = (props) => (
  <svg {...box} {...props}>
    <path d="M44 30H17" {...stroke} />
    <path d="M27 20 17 30l10 10" {...stroke} />
  </svg>
);

export const ForwardIcon = (props) => (
  <svg {...box} {...props}>
    <path d="M16 30h27" {...stroke} />
    <path d="M33 20l10 10-10 10" {...stroke} />
  </svg>
);

export const RefreshIcon = (props) => (
  <svg {...box} {...props}>
    {/* open circle with a gap at the top, arrowhead sitting in the gap */}
    <path d="M30 16A14 14 0 1 1 20.1 20.1" {...stroke} />
    <path d="M29 10l8.5 6-8.5 6z" fill="currentColor" stroke="none" />
  </svg>
);

export const StopIcon = (props) => (
  <svg {...box} {...props}>
    <path d="M20 20l20 20M40 20L20 40" {...stroke} />
  </svg>
);

export const AddFavoriteIcon = (props) => (
  <svg {...box} {...props}>
    <path
      d="M30 15.5l4.6 9.3 10.3 1.5-7.4 7.3 1.7 10.2-9.2-4.8-9.2 4.8 1.7-10.2-7.4-7.3 10.3-1.5z"
      {...stroke}
    />
  </svg>
);

export const AddedFavoriteIcon = (props) => (
  <svg {...box} {...props}>
    <path
      d="M30 15.5l4.6 9.3 10.3 1.5-7.4 7.3 1.7 10.2-9.2-4.8-9.2 4.8 1.7-10.2-7.4-7.3 10.3-1.5z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinejoin="round"
    />
  </svg>
);

export const FavoritesIcon = (props) => (
  <svg {...box} {...props}>
    {/* folder tab */}
    <path d="M21 17.5h18" {...stroke} strokeWidth="3.5" />
    {/* folder body */}
    <rect x="13.5" y="23" width="33" height="21" rx="3.5" {...stroke} />
    {/* star */}
    <path
      d="M30 28.5l2.5 5 5.6.8-4 3.9.9 5.5-5-2.6-5 2.6.9-5.5-4-3.9 5.6-.8z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

export const ExpandIcon = (props) => (
  <svg {...box} {...props}>
    <path d="M25 17H17v8M43 17h-8M43 25v-8M35 43h8v-8M17 35v8h8" {...stroke} />
  </svg>
);

export const CollapseIcon = (props) => (
  <svg {...box} {...props}>
    <path d="M17 25h8v-8M43 25h-8v-8M35 35h8M35 35v8M25 35h-8M25 35v8" {...stroke} />
  </svg>
);

export const CloseIcon = (props) => (
  <svg {...box} {...props}>
    <path d="M18 18l24 24M42 18L18 42" {...stroke} strokeWidth="4.5" />
  </svg>
);

export const LockIcon = (props) => (
  <svg {...box} {...props}>
    <rect x="19" y="28" width="22" height="16" rx="3" {...stroke} strokeWidth="3.5" />
    <path d="M24 28v-5a6 6 0 0 1 12 0v5" {...stroke} strokeWidth="3.5" />
  </svg>
);
