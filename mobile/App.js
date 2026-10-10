import 'react-native-gesture-handler';
import React from 'react';
import * as WebBrowser from 'expo-web-browser';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from './src/context/AppContext';
import AppNavigator from './src/navigation/AppNavigator';
import { MobileAdPopup } from './src/components/common/MobileAdPopup';

WebBrowser.maybeCompleteAuthSession({ skipRedirectCheck: true });

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="light" backgroundColor="#07040d" />
        <AppNavigator />
        <MobileAdPopup />
      </AppProvider>
    </SafeAreaProvider>
  );
}
