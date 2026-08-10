/**
 * Monoline illustrations.
 *
 * House rules, so six scenes read as one hand:
 *   · 1.5px strokes, round caps and joins, no fills except one amber accent
 *   · currentColor for structure, so a scene inherits its container's colour
 *   · every scene is aria-hidden — the surrounding copy carries the meaning
 *   · paths that should animate carry className="stroke-draw"
 *
 * Each scene depicts something the product actually does. Nothing here shows a
 * feature that does not exist.
 */

const S = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const AMBER = "#f59e0b";

type SceneProps = { className?: string };

/** A QR stand on a table — where every order begins. */
export function SceneQrTable({ className }: SceneProps) {
  return (
    <svg viewBox="0 0 240 200" className={className} aria-hidden="true" role="presentation">
      <g {...S}>
        {/* table */}
        <ellipse cx="120" cy="150" rx="78" ry="20" className="stroke-draw" />
        <path d="M120 150v34" className="stroke-draw" />
        <path d="M96 190h48" className="stroke-draw" />
        {/* QR card standing on it */}
        <rect x="86" y="44" width="68" height="82" rx="5" className="stroke-draw" />
        <path d="M120 126v14" className="stroke-draw" />
      </g>
      {/* QR glyph — amber, the single focal element */}
      <g fill={AMBER}>
        <rect x="96" y="54" width="15" height="15" rx="2" opacity="0.9" />
        <rect x="129" y="54" width="15" height="15" rx="2" opacity="0.9" />
        <rect x="96" y="87" width="15" height="15" rx="2" opacity="0.9" />
        <rect x="129" y="87" width="6" height="6" rx="1" opacity="0.55" />
        <rect x="138" y="96" width="6" height="6" rx="1" opacity="0.55" />
        <rect x="120" y="78" width="6" height="6" rx="1" opacity="0.55" />
      </g>
      <text
        x="120"
        y="118"
        textAnchor="middle"
        fontSize="9"
        fontFamily="var(--font-mono)"
        fill="currentColor"
        opacity="0.55"
      >
        TABLE 4
      </text>
    </svg>
  );
}

/** A phone showing the menu, with the veg mark diners look for first. */
export function ScenePhoneMenu({ className }: SceneProps) {
  return (
    <svg viewBox="0 0 240 200" className={className} aria-hidden="true" role="presentation">
      <g {...S}>
        <rect x="78" y="20" width="84" height="160" rx="12" className="stroke-draw" />
        <path d="M108 30h24" className="stroke-draw" />
        {/* menu rows */}
        <path d="M90 60h60M90 74h38" className="stroke-draw" />
        <path d="M90 100h60M90 114h44" className="stroke-draw" />
        <path d="M90 140h60M90 154h32" className="stroke-draw" />
      </g>
      {/* veg / non-veg indicators, as the app renders them */}
      <g fill="none" strokeWidth="1.5">
        <rect x="90" y="46" width="9" height="9" rx="1.5" stroke="#10b981" />
        <circle cx="94.5" cy="50.5" r="2" fill="#10b981" />
        <rect x="90" y="86" width="9" height="9" rx="1.5" stroke="#ef4444" />
        <circle cx="94.5" cy="90.5" r="2" fill="#ef4444" />
        <rect x="90" y="126" width="9" height="9" rx="1.5" stroke="#10b981" />
        <circle cx="94.5" cy="130.5" r="2" fill="#10b981" />
      </g>
      <rect x="132" y="70" width="18" height="8" rx="4" fill={AMBER} opacity="0.9" />
    </svg>
  );
}

/** The kitchen display: three columns, tickets moving left to right. */
export function SceneKitchen({ className }: SceneProps) {
  return (
    <svg viewBox="0 0 240 200" className={className} aria-hidden="true" role="presentation">
      <g {...S}>
        <rect x="20" y="30" width="200" height="130" rx="8" className="stroke-draw" />
        <path d="M86 30v130M154 30v130" className="stroke-draw" />
        <path d="M100 170h40M120 160v10" className="stroke-draw" />
        {/* tickets */}
        <rect x="30" y="44" width="46" height="30" rx="4" className="stroke-draw" />
        <rect x="30" y="82" width="46" height="30" rx="4" className="stroke-draw" />
        <rect x="98" y="44" width="46" height="30" rx="4" className="stroke-draw" />
        <rect x="166" y="44" width="44" height="30" rx="4" className="stroke-draw" />
      </g>
      {/* the ticket currently being cooked */}
      <rect x="98" y="44" width="46" height="30" rx="4" fill={AMBER} opacity="0.14" />
      <g fontFamily="var(--font-mono)" fontSize="7" fill="currentColor" opacity="0.6">
        <text x="53" y="26" textAnchor="middle">NEW</text>
        <text x="121" y="26" textAnchor="middle">COOKING</text>
        <text x="188" y="26" textAnchor="middle">READY</text>
      </g>
    </svg>
  );
}

/** A printed bill with the GST line the invoice actually carries. */
export function SceneBill({ className }: SceneProps) {
  return (
    <svg viewBox="0 0 240 200" className={className} aria-hidden="true" role="presentation">
      <g {...S}>
        <path
          d="M74 22h92v150l-11-8-11 8-11-8-11 8-11-8-11 8-11-8-11 8-4-3V22z"
          className="stroke-draw"
        />
        <path d="M88 54h64M88 70h64M88 86h48" className="stroke-draw" strokeDasharray="3 4" />
        <path d="M88 112h64" className="stroke-draw" />
        <path d="M88 132h64" strokeWidth="2" className="stroke-draw" />
      </g>
      <g fontFamily="var(--font-mono)" fontSize="8" fill="currentColor">
        <text x="120" y="42" textAnchor="middle" opacity="0.75">TAX INVOICE</text>
        <text x="88" y="126" opacity="0.6">GST 5%</text>
        <text x="152" y="126" textAnchor="end" opacity="0.6">₹94</text>
        <text x="88" y="150" fontWeight="700">TOTAL</text>
        <text x="152" y="150" textAnchor="end" fontWeight="700" fill={AMBER}>
          ₹1,974
        </text>
      </g>
    </svg>
  );
}

/** The revenue curve, drawn as the analytics page draws it. */
export function SceneAnalytics({ className }: SceneProps) {
  return (
    <svg viewBox="0 0 240 200" className={className} aria-hidden="true" role="presentation">
      <g {...S}>
        <path d="M34 40v112h176" className="stroke-draw" />
        <path d="M34 118h176M34 84h176" strokeDasharray="3 5" opacity="0.35" />
        <path
          d="M34 138c18-4 26-22 44-26s26 16 44 4 26-40 44-46 26 6 44 2"
          stroke={AMBER}
          strokeWidth="2"
          className="stroke-draw"
        />
      </g>
      <circle cx="210" cy="72" r="3.5" fill="#fff" stroke={AMBER} strokeWidth="2" />
      <g fontFamily="var(--font-mono)" fontSize="8" fill="currentColor" opacity="0.6">
        <text x="34" y="172">MON</text>
        <text x="210" y="172" textAnchor="end">SUN</text>
      </g>
    </svg>
  );
}

/** The table grid, occupied tables carrying a running total. */
export function SceneTables({ className }: SceneProps) {
  const cells = [
    { x: 28, y: 40, busy: false },
    { x: 96, y: 40, busy: true },
    { x: 164, y: 40, busy: false },
    { x: 28, y: 108, busy: true },
    { x: 96, y: 108, busy: false },
    { x: 164, y: 108, busy: false },
  ];
  return (
    <svg viewBox="0 0 240 200" className={className} aria-hidden="true" role="presentation">
      {cells.map((c, i) => (
        <g key={i}>
          <rect
            x={c.x}
            y={c.y}
            width="48"
            height="48"
            rx="8"
            {...S}
            className="stroke-draw"
          />
          {c.busy && (
            <rect x={c.x} y={c.y} width="48" height="48" rx="8" fill={AMBER} opacity="0.14" />
          )}
          <text
            x={c.x + 24}
            y={c.y + 22}
            textAnchor="middle"
            fontSize="10"
            fontFamily="var(--font-mono)"
            fontWeight="700"
            fill="currentColor"
          >
            T{i + 1}
          </text>
          <text
            x={c.x + 24}
            y={c.y + 36}
            textAnchor="middle"
            fontSize="7.5"
            fontFamily="var(--font-mono)"
            fill={c.busy ? AMBER : "currentColor"}
            opacity={c.busy ? 1 : 0.45}
          >
            {c.busy ? "₹840" : "free"}
          </text>
        </g>
      ))}
    </svg>
  );
}
