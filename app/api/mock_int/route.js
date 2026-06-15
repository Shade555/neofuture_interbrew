export async function GET(request) {
  return new Response(
    JSON.stringify({ message: 'Mock interview endpoint' }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

export async function POST(request) {
  return new Response(
    JSON.stringify({ message: 'Mock interview endpoint' }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
