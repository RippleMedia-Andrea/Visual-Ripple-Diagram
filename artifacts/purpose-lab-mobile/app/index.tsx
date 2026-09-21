import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AuthScreen } from '@/components/AuthScreen';
import { JourneyScreen } from '@/components/JourneyScreen';
import { useAuth } from '@/providers/AuthProvider';
import { useColors } from '@/hooks/useColors';

export default function HomeScreen() {
  const colors = useColors();
  const { token, isReady } = useAuth();
  if (!isReady) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.deepTeal }]}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }
  return token ? <JourneyScreen /> : <AuthScreen />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});