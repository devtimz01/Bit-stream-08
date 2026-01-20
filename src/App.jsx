import { useEffect } from 'react';
import { WebRTCConfig } from './utils/Rtc-config';

export default function App() {
  useEffect(() => {
   WebRTCConfig().catch(console.error);
  }, []);

  return <div>Streaming app</div>;
}