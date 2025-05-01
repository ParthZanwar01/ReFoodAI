import { View, type ViewProps, StyleSheet } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';
import { cloud, mist } from '@/constants/Colors'; // Import colors

export type CardProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function Card({ style, lightColor, darkColor, ...otherProps }: CardProps) {
  const backgroundColor = useThemeColor({ light: lightColor || cloud, dark: darkColor || mist }, 'background');

  return (
    <View
      style={[
        styles.card,
        { backgroundColor },
        style,
      ]}
      {...otherProps}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 5,
  },
}); 