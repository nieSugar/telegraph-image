import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

const defaults: Required<Pick<IconProps, 'size' | 'strokeWidth'>> = {
  size: 20,
  strokeWidth: 1.5,
};

const svgProps = (p: IconProps) => ({
  width: p.size ?? defaults.size,
  height: p.size ?? defaults.size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: p.strokeWidth ?? defaults.strokeWidth,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  className: p.className ?? '',
});

export const IconUploadCloud: React.FC<IconProps> = (p) => (
  <svg {...svgProps(p)}>
    <polyline points="16 16 12 12 8 16" />
    <line x1="12" y1="12" x2="12" y2="21" />
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    <polyline points="16 16 12 12 8 16" />
  </svg>
);

export const IconUpload: React.FC<IconProps> = (p) => (
  <svg {...svgProps(p)}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

export const IconCopy: React.FC<IconProps> = (p) => (
  <svg {...svgProps(p)}>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

export const IconExternalLink: React.FC<IconProps> = (p) => (
  <svg {...svgProps(p)}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

export const IconTrash: React.FC<IconProps> = (p) => (
  <svg {...svgProps(p)}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

export const IconHome: React.FC<IconProps> = (p) => (
  <svg {...svgProps(p)}>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

export const IconLogOut: React.FC<IconProps> = (p) => (
  <svg {...svgProps(p)}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export const IconLock: React.FC<IconProps> = (p) => (
  <svg {...svgProps(p)}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export const IconUser: React.FC<IconProps> = (p) => (
  <svg {...svgProps(p)}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export const IconArrowRight: React.FC<IconProps> = (p) => (
  <svg {...svgProps(p)}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

export const IconRefresh: React.FC<IconProps> = (p) => (
  <svg {...svgProps(p)}>
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

export const IconCheck: React.FC<IconProps> = (p) => (
  <svg {...svgProps(p)}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const IconX: React.FC<IconProps> = (p) => (
  <svg {...svgProps(p)}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const IconImage: React.FC<IconProps> = (p) => (
  <svg {...svgProps(p)}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

export const IconChevronLeft: React.FC<IconProps> = (p) => (
  <svg {...svgProps(p)}>
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

export const IconChevronRight: React.FC<IconProps> = (p) => (
  <svg {...svgProps(p)}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export const IconShield: React.FC<IconProps> = (p) => (
  <svg {...svgProps(p)}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

export const IconDiamond: React.FC<IconProps> = (p) => (
  <svg {...svgProps(p)}>
    <rect x="12" y="1" width="15.56" height="15.56" rx="2" transform="rotate(45 12 1)" />
  </svg>
);

export const IconAlertCircle: React.FC<IconProps> = (p) => (
  <svg {...svgProps(p)}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
