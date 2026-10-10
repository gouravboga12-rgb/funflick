import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function navigate(name, params) {
  try {
    if (navigationRef.isReady()) {
      navigationRef.navigate(name, params);
    } else {
      setTimeout(() => {
        try {
          if (navigationRef.isReady()) {
            navigationRef.navigate(name, params);
          }
        } catch (e) {
          console.warn('Deferred navigate error:', e?.message);
        }
      }, 700);
    }
  } catch (err) {
    console.warn('Navigation error:', err?.message);
  }
}
