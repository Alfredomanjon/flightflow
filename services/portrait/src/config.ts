// Portrait constants. Location and defaults come from config.yaml via /api/config.
import { config } from '@flightflow/shared';

export const REFRESH_MS = 2000;
export const ONLINE_TIMEOUT_MS = 8_000;

/** Ignore positions older than this (s). */
export const STALE_POS_S = 30;

/** A new plane only replaces one on screen if it is 10 % closer. */
export const SWAP_HYSTERESIS = 0.9;

export const CONTROLS_HIDE_MS = 3000;

export const MIN_RADIUS_KM = 5;
export const MAX_RADIUS_KM = 100;

export const receiver = () => config().receiver;
export const placeLabel = () => config().home_airport?.icao ?? '';

/** Phase of flight (landing / take-off): below this altitude (ft)... */
export const PHASE_MAX_ALT_FT = 10_000;
/** ...with at least this vertical rate (ft/min)... */
export const PHASE_MIN_RATE_FPM = 500;
/** ...held for this long (ms) before the label appears... */
export const PHASE_HOLD_MS = 10_000;
/** ...and kept until the condition has been lost for this long (ms). */
export const PHASE_RELEASE_MS = 6_000;
