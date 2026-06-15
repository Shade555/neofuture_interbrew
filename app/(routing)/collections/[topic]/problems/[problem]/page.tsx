'use client';

export default function ProblemPage({
  params,
}: {
  params: { topic: string; problem: string };
}) {
  return (
    <main>
      <h1>Problem: {params.problem}</h1>
      <p>Topic: {params.topic}</p>
    </main>
  );
}
