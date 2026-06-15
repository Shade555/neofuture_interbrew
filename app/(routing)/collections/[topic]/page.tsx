'use client';

export default function TopicPage({ params }: { params: { topic: string } }) {
  return (
    <main>
      <h1>Topic: {params.topic}</h1>
    </main>
  );
}
