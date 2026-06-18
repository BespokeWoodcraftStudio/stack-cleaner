import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Claude Inventory Tool",
    short_name: "Claude Inventory",
    description:
      "See, organize, and clean up your Claude skills, plugins, MCP servers, and agents: split by global vs. project. Runs locally, sends nothing.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf7f1",
    theme_color: "#faf7f1",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/apple-icon", type: "image/png", sizes: "180x180" },
    ],
  };
}
