type BrandMarkProps = {
  className?: string
}

let gradientSeq = 0

/**
 * Ícone "A" da marca Allugme em SVG: substitui o antigo bloco colorido em CSS
 * para ter um traço nítido em qualquer resolução e um único ponto de manutenção.
 * O texto ao lado do ícone deve começar em "llugme" (sem o "A") para que o
 * conjunto se leia como uma palavra única — "A" (ícone) + "llugme".
 */
export function BrandMark({ className }: BrandMarkProps) {
  const gradientId = `brand-mark-gradient-${(gradientSeq++).toString(36)}`

  return (
    <svg
      className={className}
      viewBox="0 0 34 34"
      role="img"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradientId} x1="10%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%" stopColor="#0f766e" />
          <stop offset="100%" stopColor="#0b5a54" />
        </linearGradient>
      </defs>
      <rect width="34" height="34" rx="11" fill={`url(#${gradientId})`} />
      <text
        x="50%"
        y="53%"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#fff"
        fontFamily="Fraunces, Georgia, serif"
        fontWeight="700"
        fontSize="18"
      >
        A
      </text>
    </svg>
  )
}
