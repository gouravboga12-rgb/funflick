import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Search, Send, Bell } from 'lucide-react-native';
import { colors } from '../../theme/colors';

export const Header = ({ onSearchPress, onMessagesPress, title }) => {
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Image
          source={{ uri: 'https://funflick-theta.vercel.app/brand/funflick-logo.png' }}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.brandTitle}>{title || 'FunFlick'}</Text>
      </View>

      <View style={styles.actions}>
        {onSearchPress && (
          <TouchableOpacity onPress={onSearchPress} style={styles.iconBtn}>
            <Search size={20} color="#fff" />
          </TouchableOpacity>
        )}
        {onMessagesPress && (
          <TouchableOpacity onPress={onMessagesPress} style={styles.iconBtn}>
            <Send size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 54,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    width: 30,
    height: 30,
    borderRadius: 8,
  },
  brandTitle: {
    color: '#ffffff',
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
});
