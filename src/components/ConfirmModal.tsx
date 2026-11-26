import { StyleSheet } from 'react-native';
import { Text } from './AppText';
import { useStrings } from '../i18n/LanguageContext';
import { colors } from '../theme';
import Button from './Button';
import ModalShell from './ModalShell';

type Props = {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
  // Deletes or resets data, so the confirm button is red.
  isDestructive?: boolean;
};

export default function ConfirmModal({
  title,
  message,
  confirmLabel,
  onConfirm,
  onClose,
  isDestructive = false,
}: Props) {
  const t = useStrings();

  return (
    <ModalShell
      actions={
        <>
          <Button label={t.common.cancel} onPress={onClose} variant="text" />
          <Button
            color={isDestructive ? colors.danger : colors.primary}
            label={confirmLabel}
            onPress={onConfirm}
          />
        </>
      }
      color={colors.primary}
      onClose={onClose}
      title={title}
    >
      <Text style={styles.message}>{message}</Text>
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  message: {
    color: colors.textSecondary,
  },
});
