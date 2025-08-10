import {UAParser} from "ua-parser-js";
import geoip from "geoip-lite";

export interface DeviceInfo {
  device: "desktop" | "mobile" | "tablet";
  browser: string;
  os: string;
  country?: string;
  city?: string;
}

export const detectDevice = (
  userAgent: string,
  ipAddress: string
): DeviceInfo => {
  const result = new UAParser().setUA(userAgent).getResult();

  // Determine device type
  let device: "desktop" | "mobile" | "tablet" = "desktop";
  if (result.device.type === "mobile") {
    device = "mobile";
  } else if (result.device.type === "tablet") {
    device = "tablet";
  }

  // Get location info
  const geo = geoip.lookup(ipAddress);

  return {
    device,
    browser: `${result.browser.name || "Unknown"} ${
      result.browser.version || ""
    }`.trim(),
    os: `${result.os.name || "Unknown"} ${result.os.version || ""}`.trim(),
    country: geo?.country || undefined,
    city: geo?.city || undefined,
  };
};

export const getClientIP = (req: any): string => {
  return (
    req.headers["x-forwarded-for"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
    "127.0.0.1"
  );
};
