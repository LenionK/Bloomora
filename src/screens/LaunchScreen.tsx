import { StyleSheet, Text, View } from 'react-native';
import Logo from '../components/Logo';
import { colors } from '../theme';

export default function LaunchScreen() {
  return (
    <View style={styles.container}>
      <Logo color={colors.primary} detailColor={colors.background} size={200} />
      <Text style={styles.name}>Bloomora</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 160,
    backgroundColor: colors.background,
  },
  name: {
    marginTop: 8,
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.text,
  },
});
