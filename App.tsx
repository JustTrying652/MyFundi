import React, { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import Navigation from './src/navigation';

export default function App() {
  useEffect(() => {
    // Listen for notifications when app is open
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
    });

    return () => {
      subscription.remove();
      responseSubscription.remove();
    };
  }, []);

  return <Navigation />;
}