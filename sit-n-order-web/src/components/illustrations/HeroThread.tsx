/**
 * The hero thesis: one unbroken line from the QR square on the table, through
 * the diner's phone and the kitchen ticket, to the printed bill.
 *
 * It is a single <path> deliberately — the product's claim is that these four
 * moments are one continuous flow rather than four disconnected tools, and the
 * drawing makes that claim literally.
 */

const AMBER = "#f59e0b";

export function HeroThread({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 420 340"
      className={className}
      aria-hidden="true"
      role="presentation"
    >
      {/* The thread. One path, drawn end to end. */}
      <path
        d="M64 46 C64 96 118 92 132 118 C150 150 96 168 104 204 C112 240 190 226 232 214
           C286 198 302 150 330 132 C356 116 372 140 366 170 C360 202 322 214 318 246"
        fill="none"
        stroke={AMBER}
        strokeWidth="2"
        strokeLinecap="round"
        className="stroke-draw"
        style={{ transitionDuration: "2.4s" }}
      />

      {/* 1 — the QR on the table */}
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="34" y="16" width="60" height="60" rx="6" className="stroke-draw" />
      </g>
      <g fill={AMBER}>
        <rect x="44" y="26" width="13" height="13" rx="2" />
        <rect x="71" y="26" width="13" height="13" rx="2" />
        <rect x="44" y="53" width="13" height="13" rx="2" />
        <rect x="71" y="53" width="5" height="5" rx="1" opacity="0.6" />
        <rect x="79" y="61" width="5" height="5" rx="1" opacity="0.6" />
      </g>

      {/* 2 — the phone */}
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="76" y="176" width="56" height="94" rx="9" className="stroke-draw" />
        <path d="M96 186h16" className="stroke-draw" />
        <path d="M86 212h36M86 226h22M86 246h36M86 258h16" className="stroke-draw" />
      </g>
      <rect x="86" y="200" width="7" height="7" rx="1.5" fill="none" stroke="#10b981" strokeWidth="1.5" />
      <circle cx="89.5" cy="203.5" r="1.6" fill="#10b981" />

      {/* 3 — the kitchen ticket */}
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="196" y="176" width="74" height="56" rx="6" className="stroke-draw" />
        <path d="M208 194h50M208 206h34M208 218h42" className="stroke-draw" strokeDasharray="3 4" />
      </g>
      <text
        x="233"
        y="167"
        textAnchor="middle"
        fontSize="9"
        fontFamily="var(--font-mono)"
        fontWeight="700"
        fill="currentColor"
        opacity="0.55"
      >
        KITCHEN
      </text>

      {/* 4 — the bill */}
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M292 244h52v82l-6.5-5-6.5 5-6.5-5-6.5 5-6.5-5-6.5 5-6.5-5-6.5 5V244z"
          className="stroke-draw"
        />
        <path d="M302 268h32M302 280h32" strokeDasharray="3 4" className="stroke-draw" />
        <path d="M302 296h32" strokeWidth="2" className="stroke-draw" />
      </g>
      <text
        x="318"
        y="311"
        textAnchor="middle"
        fontSize="9"
        fontFamily="var(--font-mono)"
        fontWeight="700"
        fill={AMBER}
      >
        ₹1,974
      </text>

      {/* Stage markers. Placed on the thread itself so the eye follows the
          order of events rather than the order of the layout. */}
      <g fontFamily="var(--font-mono)" fontSize="8" fontWeight="700">
        <circle cx="132" cy="118" r="9" fill="#fff" stroke={AMBER} strokeWidth="1.5" />
        <text x="132" y="121" textAnchor="middle" fill={AMBER}>1</text>
        <circle cx="232" cy="214" r="9" fill="#fff" stroke={AMBER} strokeWidth="1.5" />
        <text x="232" y="217" textAnchor="middle" fill={AMBER}>2</text>
        <circle cx="330" cy="132" r="9" fill="#fff" stroke={AMBER} strokeWidth="1.5" />
        <text x="330" y="135" textAnchor="middle" fill={AMBER}>3</text>
      </g>
    </svg>
  );
}
