import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StageApp } from "@/components/stage-app";
import { getScene, scenes } from "@/lib/scenes";

export function generateStaticParams() {
  return scenes.map((scene) => ({ slug: scene.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const scene = getScene(slug);
  if (!scene) return { title: "Scene" };
  return {
    title: scene.title,
    description: scene.logline,
  };
}

export default async function ScenePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!getScene(slug)) notFound();
  return <StageApp slug={slug} />;
}
