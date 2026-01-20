'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  DollarSign,
  UserPlus,
  Receipt,
  CheckCircle2,
  Bell,
  Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNotificationStore, type Notification } from '@/store/notificationStore';
import { notificationAPI } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { useDateFnsLocale } from '@/hooks/useDateFnsLocale';

interface NotificationDropdownProps {
  onClose: () => void;
  onNotificationRead: () => void;
}

export const NotificationDropdown = ({ onClose, onNotificationRead }: NotificationDropdownProps) => {
  const t = useTranslations('notifications');
  const dateFnsLocale = useDateFnsLocale();
  const { notifications, setNotifications, addNotification, markAsRead, markAllAsRead } = useNotificationStore();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await notificationAPI.getAll(20);
      setNotifications(response.data.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error(t('dropdown.errorLoading'));
    } finally {
      setLoading(false);
    }
  }, [setNotifications, t]);

  // Fetch notifications on mount and subscribe to Realtime
  useEffect(() => {
    fetchNotifications();

    // Subscribe to new notifications in real-time
    if (user?.id) {
      const subscription = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `userId=eq.${user.id}`,
          },
          (payload: any) => {
            const newNotification = payload.new as Notification;
            addNotification(newNotification);
            onNotificationRead();

            // Show toast for new notification
            toast.info(newNotification.title, {
              description: newNotification.message,
            });
          }
        )
        .subscribe();

      // Cleanup subscription on unmount
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user?.id, fetchNotifications, addNotification, onNotificationRead]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await notificationAPI.markAsRead(notification.id);
        markAsRead(notification.id);
        onNotificationRead();
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAllRead(true);
    try {
      await notificationAPI.markAllAsRead();
      markAllAsRead();
      onNotificationRead();
      toast.success(t('dropdown.allMarkedRead'));
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error(t('dropdown.errorMarkingRead'));
    } finally {
      setMarkingAllRead(false);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    const iconClass = "h-5 w-5 flex-shrink-0";
    switch (type) {
      case 'PAYMENT_RECEIVED':
        return <DollarSign className={`${iconClass} text-green-600`} />;
      case 'SHARED_EXPENSE_CREATED':
        return <Receipt className={`${iconClass} text-blue-600`} />;
      case 'GROUP_MEMBER_ADDED':
        return <UserPlus className={`${iconClass} text-purple-600`} />;
      case 'BALANCE_SETTLED':
        return <CheckCircle2 className={`${iconClass} text-emerald-600`} />;
      default:
        return <Bell className={`${iconClass} text-gray-600`} />;
    }
  };

  const unreadNotifications = notifications.filter(n => !n.isRead);

  return (
    <div
      className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[600px] flex flex-col"
      role="menu"
      aria-label={t('dropdown.title')}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50 rounded-t-lg">
        <div>
          <h3 id="notifications-title" className="text-lg font-semibold text-gray-900">{t('dropdown.title')}</h3>
          {unreadNotifications.length > 0 && (
            <p className="text-xs text-gray-500" aria-live="polite">
              {t('dropdown.newCount', { count: unreadNotifications.length })}
            </p>
          )}
        </div>

        {unreadNotifications.length > 0 && (
          <button
            type="button"
            onClick={handleMarkAllAsRead}
            disabled={markingAllRead}
            aria-busy={markingAllRead}
            aria-label={t('dropdown.markAll')}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
          >
            {markingAllRead ? t('dropdown.marking') : t('dropdown.markAll')}
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="overflow-y-auto flex-1" role="list" aria-labelledby="notifications-title">
        {loading ? (
          <div className="flex items-center justify-center py-12" role="status" aria-label="Loading notifications">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" aria-hidden="true" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <Bell className="h-12 w-12 text-gray-300 mb-3" aria-hidden="true" />
            <p className="text-gray-500 text-center">{t('dropdown.empty')}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                role="menuitem"
                onClick={() => handleNotificationClick(notification)}
                aria-label={`${notification.title}: ${notification.message}${!notification.isRead ? ' (unread)' : ''}`}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                  !notification.isRead ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex gap-3">
                  {/* Icon */}
                  <div className="mt-0.5" aria-hidden="true">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-sm text-gray-900">
                        {notification.title}
                      </p>
                      {!notification.isRead && (
                        <div
                          className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1.5"
                          aria-label="Unread"
                        />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                        locale: dateFnsLocale,
                      })}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {t('dropdown.viewAll')}
          </button>
        </div>
      )}
    </div>
  );
};
