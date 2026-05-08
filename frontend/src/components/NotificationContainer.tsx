/**
 * Notification Container Component
 * Renders toast notifications from the app store
 */

import React from 'react';
import { useAppStore } from '@/stores/appStore';
import type { Notification } from '@/types';

export function NotificationContainer() {
  const notifications = useAppStore((state) => state.notifications);
  const removeNotification = useAppStore((state) => state.removeNotification);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {notifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
}

interface NotificationToastProps {
  notification: Notification;
  onClose: () => void;
}

function NotificationToast({ notification, onClose }: NotificationToastProps) {
  const { type, title, message } = notification;

  const typeStyles = {
    success: 'bg-segre-green-bg border-segre-green text-segre-green',
    error: 'bg-segre-red-bg border-segre-red text-segre-red',
    warning: 'bg-segre-amber-bg border-segre-amber text-segre-amber',
    info: 'bg-segre-blue-bg border-segre-blue text-segre-blue',
  };

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-lg border-l-4 shadow-lg
        bg-segre-card min-w-[300px] max-w-sm
        animate-in slide-in-from-right duration-300
        ${typeStyles[type]}
      `}
      role="alert"
    >
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-current/20 flex items-center justify-center">
        <span className="text-sm">{icons[type]}</span>
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-segre-ink">{title}</p>
        <p className="text-sm text-segre-ink-2 mt-1">{message}</p>
      </div>
      
      <button
        onClick={onClose}
        className="flex-shrink-0 p-1 hover:bg-black/5 rounded transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
