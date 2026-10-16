import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
if (Capacitor.isNativePlatform()) {
  document.documentElement.classList.add('native-app');
  App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) window.history.back();
    else App.minimizeApp();
  });
}
