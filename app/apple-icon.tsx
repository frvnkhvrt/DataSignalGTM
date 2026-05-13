import { ImageResponse } from "next/og";

/** Same Lucide `Activity` path as `node_modules/lucide-react/dist/esm/icons/activity.js` (stroke scaled for touch icon). */
const ACTIVITY_PATH =
  "M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2";

/** `oklch(0.72 0.17 156)` (dark theme `--primary`) — RGB for Satori / ImageResponse. */
const BRAND_PRIMARY = "rgb(94, 228, 182)";

export const runtime = "edge";

export const size = { width: 180, height: 180 };

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: size.width,
          height: size.height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#000000",
        }}
      >
        <div
          style={{
            width: 132,
            height: 132,
            borderRadius: 33,
            background: "#000000",
            border: "2px solid rgba(94, 228, 182, 0.22)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="78" height="78" viewBox="0 0 24 24" fill="none">
            <path
              d={ACTIVITY_PATH}
              stroke={BRAND_PRIMARY}
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    ),
    { ...size },
  );
}
