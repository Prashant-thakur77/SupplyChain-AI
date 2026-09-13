import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SupplyChain AI",
    short_name: "SupplyChain AI",
    description: "Agentic control tower — decisions, reroutes and alerts for your supply chain.",
    start_url: "/decisions",
    display: "standalone",
    background_color: "#f7f6f2",
    theme_color: "#2748e8",
    icons: [{ src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  }
}
