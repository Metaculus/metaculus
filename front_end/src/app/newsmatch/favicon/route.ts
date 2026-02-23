import { NextRequest, NextResponse } from "next/server";
import dns from "dns/promises";
import net from "net";

function isPrivateIp(ip: string): boolean {
  // IPv4 private and special ranges
  const v4 = net.isIP(ip) === 4 ? ip : null;
  if (v4) {
    const parts = v4.split(".").map((p) => parseInt(p, 10));
    if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) {
      return true;
    }
    const [a, b] = parts;
    // 10.0.0.0/8
    if (a === 10) return true;
    // 172.16.0.0/12
    if (a === 172 && b >= 16 && b <= 31) return true;
    // 192.168.0.0/16
    if (a === 192 && b === 168) return true;
    // 127.0.0.0/8 loopback
    if (a === 127) return true;
    // 169.254.0.0/16 link-local
    if (a === 169 && b === 254) return true;
  }

  // IPv6 loopback and unique local (fc00::/7), link-local (fe80::/10)
  const v6 = net.isIP(ip) === 6 ? ip.toLowerCase() : null;
  if (v6) {
    if (v6 === "::1") return true;
    if (v6.startsWith("fc") || v6.startsWith("fd")) return true;
    if (v6.startsWith("fe8") || v6.startsWith("fe9") || v6.startsWith("fea") || v6.startsWith("feb")) return true;
  }

  return false;
}

export const GET = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "URL parameter is required" },
      { status: 400 }
    );
  }
  let validatedUrl: string;

  try {
    const parsed = new URL(url);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return NextResponse.json(
        { error: "Only http and https URLs are allowed" },
        { status: 400 }
      );
    }

    const hostname = parsed.hostname;
    if (!hostname) {
      return NextResponse.json(
        { error: "Invalid URL hostname" },
        { status: 400 }
      );
    }

    try {
      const addresses = await dns.lookup(hostname, { all: true });
      const hasPrivate = addresses.some((addr) => isPrivateIp(addr.address));
      if (hasPrivate) {
        return NextResponse.json(
          { error: "URL resolves to a disallowed internal address" },
          { status: 400 }
        );
      }
    } catch (dnsError) {
      console.error("DNS lookup failed for favicon URL:", dnsError);
      return NextResponse.json(
        { error: "Failed to resolve favicon host" },
        { status: 400 }
      );
    }

    validatedUrl = parsed.toString();
  } catch (e) {
    return NextResponse.json(
      { error: "Invalid URL parameter" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(validatedUrl, {
      headers: {
        Cookie: "",
        Accept: "image/*",
      },
      credentials: "omit",
      cache: "force-cache",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch favicon: ${response.statusText}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get("content-type") || "image/x-icon";

    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error("Error proxying favicon:", error);
    return NextResponse.json(
      { error: "Failed to fetch favicon" },
      { status: 500 }
    );
  }
};
