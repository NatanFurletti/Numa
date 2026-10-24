import { router } from 'expo-router';

import { HomeScreen } from '@/features/home/HomeScreen';

export default function Index() {
  return <HomeScreen onStart={() => router.push('/play/L01-A')} />;
}
