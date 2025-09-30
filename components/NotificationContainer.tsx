import React from 'react';
import { useNotifications } from '../context/NotificationContext';
import Notification from './Notification';

const NotificationContainer: React.FC = () => {
  const { notifications } = useNotifications();

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm space-y-3">
      {notifications.map((notification) => (
        <Notification key={notification.id} notification={notification} />
      ))}
    </div>
  );
};

export default NotificationContainer;