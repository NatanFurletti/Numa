import { router } from 'expo-router';

import { PrivacyScreen } from '@/features/privacy/PrivacyScreen';

export default function Privacy() {
  return (
    <PrivacyScreen onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
  );
}
