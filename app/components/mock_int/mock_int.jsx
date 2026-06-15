import { useSpeech } from './useSpeech';

export default function MockInterview() {
  const { speak, listening } = useSpeech();

  return (
    <div className="mock-interview">
      <h1>Mock Interview</h1>
      {/* Mock interview content */}
    </div>
  );
}
