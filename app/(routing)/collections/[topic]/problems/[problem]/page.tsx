import React from "react";
import Link from "next/link";

type Props = {
  params: {
    topic: string;
    problem: string;
  };
};

function humanize(slug?: string | null) {
  if (!slug) return "Untitled";
  return String(slug)
    .split("-")
    .map((s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : ""))
    .join(" ");
}

export default function ProblemPage({ params }: Props) {
  const { topic, problem } = params || { topic: undefined, problem: undefined };
  const title = humanize(problem);
  const topicTitle = humanize(topic);

  const sections = ["Theory", "Examples", "Videos", "Quiz", "Projects"];

  return (
    <div className="p-6 min-h-[calc(100vh-4rem)] pt-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="text-2xl font-semibold">{title}</div>
            <div className="text-sm opacity-80">{topicTitle} • {title}</div>
          </div>
          <div className="flex items-center gap-3">
            <Link href={`/collections/${topic}`} className="px-3 py-1 rounded bg-white/5">Back</Link>
          </div>
        </div>

        <div className="space-y-4">
          {sections.map((s) => (
            <section key={s} className="rounded-md p-6 bg-black/40 border border-white/10">
              <h3 className="text-lg font-medium mb-2">{s}</h3>
              <p className="text-sm opacity-80">Placeholder content for {s.toLowerCase()} of {title}.</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
