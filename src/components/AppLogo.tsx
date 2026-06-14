export default function AppLogo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="100" height="100" rx="20" fill="url(#logo-grad)" />
      <rect x="18" y="18" width="20" height="20" rx="4" fill="white" />
      <rect x="46" y="18" width="20" height="20" rx="4" fill="white" />
      <rect x="18" y="46" width="20" height="20" rx="4" fill="white" />
      <rect x="46" y="46" width="20" height="20" rx="4" fill="white" opacity="0.5" />
      <rect x="74" y="18" width="8" height="8" rx="2" fill="white" />
      <rect x="74" y="34" width="8" height="8" rx="2" fill="white" />
      <rect x="74" y="50" width="8" height="8" rx="2" fill="white" />
      <rect x="34" y="74" width="8" height="8" rx="2" fill="white" />
      <rect x="50" y="74" width="8" height="8" rx="2" fill="white" />
      <rect x="18" y="74" width="8" height="8" rx="2" fill="white" />
      <rect x="46" y="74" width="8" height="8" rx="2" fill="white" opacity="0.6" />
      <rect x="62" y="62" width="8" height="8" rx="2" fill="white" opacity="0.6" />
      <rect x="74" y="66" width="8" height="8" rx="2" fill="white" opacity="0.7" />
      <defs>
        <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
    </svg>
  )
}
