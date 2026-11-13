import { useState } from 'react';
import { badgeTextColor, fallbackColor, getAirline, logoUrl } from '@flightflow/shared';

/** Round airline logo (when airline_logos: true) or a badge with the airline code. */
export function AirlineMark({ code, size }: { code: string; size: string }) {
  const [failed, setFailed] = useState(false);
  const info = getAirline(code);
  const src = info ? logoUrl(code) : null;
  if (!src || failed) {
    const bg = info?.color ?? fallbackColor(code);
    return (
      <span
        className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold"
        style={{
          width: size,
          height: size,
          fontSize: `calc(${size} * 0.36)`,
          background: bg,
          color: badgeTextColor(bg),
        }}
        aria-hidden="true"
      >
        {info?.iata ?? code.slice(0, 2)}
      </span>
    );
  }
  return (
    <img
      src={src}
      alt=""
      onError={() => setFailed(true)}
      className="shrink-0 rounded-full bg-white object-contain"
      style={{ width: size, height: size }}
    />
  );
}
