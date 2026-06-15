import { useState } from 'react';

export const useNotifications = (userId?: string, inviteId?: string) => {
  const [token] = useState<string | null>(null);
  const [permission] = useState<NotificationPermission>('denied');
  const [isLoading] = useState(false);

  const requestPermission = async () => {
    console.log('Les notifications web sont désactivées');
  };

  return { token, permission, requestPermission, isLoading };
};
