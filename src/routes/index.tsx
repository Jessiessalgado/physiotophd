import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

const DESCRIPTION =
  "Bridging Physiotherapy and Technology — Jessica Salgado shares research on neurorehabilitation with VR, robotics, biomechanics and digital health.";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Jessica Salgado — Physiotherapy & Rehab Technology" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Jessica Salgado — Physiotherapy & Rehab Technology" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://physiotophd.vercel.app/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://physiotophd.vercel.app/" }],
  }),
});

function Index() {
  useEffect(() => {
    window.location.replace("/index.html");
  }, []);
  return null;
}
