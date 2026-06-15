import { useState } from 'react';

export function useSpeech() {
  const [listening, setListening] = useState(false);

  const speak = (text) => {
    // Speech implementation
  };

  return { speak, listening };
}
