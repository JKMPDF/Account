import React, { useState, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import type { Notification as NotificationType } from '../types';

interface NotificationProps {
  notification: NotificationType;
}

const Notification: React.FC<NotificationProps> = ({ notification }) => {
  const { removeNotification } = useNotifications();
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => removeNotification(notification.id), 300); // Wait for animation
    }, 5000);

    return () => clearTimeout(timer);
  }, [notification.id, removeNotification]);

  const handleClose = () => {
    setExiting(true);
    setTimeout(() => removeNotification(notification.id), 300);
  };

  const baseClasses = "relative w-full p-4 pr-10 rounded-lg shadow-lg border text-white transition-all duration-300 ease-in-out backdrop-blur-sm";
  const typeClasses = {
    success: 'bg-green-600/90 border-green-500',
    error: 'bg-red-600/90 border-red-500',
    info: 'bg-sky-600/90 border-sky-500',
  };

  const animationClasses = exiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0';

  return (
    <div className={`${baseClasses} ${typeClasses[notification.type]} ${animationClasses}`}>
      <p className="text-sm font-medium">{notification.message}</p>
      <button
        onClick={handleClose}
        className="absolute top-1/2 right-2 -translate-y-1/2 p-1 rounded-full hover:bg-white/20"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export default Notification;