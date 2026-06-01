import { useEffect, useRef } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { ticketService } from '@/services';
import { useAuthStore } from '@/store/auth.store';

export const useTicketNotifications = () => {
  const { token } = useAuthStore();
  const knownTicketIds = useRef<Set<number>>(new Set());
  const initialized = useRef(false);

  useEffect(() => {
    if (!token) return;

    let interval: any;

    const setup = async () => {
      // Request permissions
      const perm = await LocalNotifications.requestPermissions();
      if (perm.display !== 'granted') return;

      // Create notification channel for Android 8.0+
      // importance: 5 = IMPORTANCE_HIGH → shows as heads-up overlay popup
      await LocalNotifications.createChannel({
        id: 'himup_tickets',
        name: 'Tiket Baru',
        description: 'Notifikasi untuk tiket IT support baru',
        importance: 5,
        visibility: 1,
        vibration: true,
        lights: true,
        lightColor: '#f97316',
      });

      const checkNewTickets = async () => {
        try {
          const res = await ticketService.getAll({ sort: 'desc', per_page: 10, page: 1 });
          const tickets = Array.isArray(res?.data) ? res.data : [];

          if (!initialized.current) {
            // First run: snapshot existing IDs so we don't notify old tickets
            tickets.forEach((t: any) => knownTicketIds.current.add(t.id));
            initialized.current = true;
            return;
          }

          const newTickets = tickets.filter((t: any) => !knownTicketIds.current.has(t.id));

          for (const ticket of newTickets) {
            knownTicketIds.current.add(ticket.id);

            await LocalNotifications.schedule({
              notifications: [
                {
                  title: '🔔 Tiket Baru Masuk',
                  body: `[${(ticket.priority || 'LOW').toUpperCase()}] ${ticket.ticket_number}: ${ticket.title}`,
                  id: ticket.id % 2147483647, // must be within int32 range
                  schedule: { at: new Date(Date.now() + 500) },
                  smallIcon: 'ic_stat_notify',
                  iconColor: '#f97316',
                  channelId: 'himup_tickets',
                  actionTypeId: '',
                  extra: { ticketId: String(ticket.id) },
                  ongoing: false,
                  autoCancel: true,
                }
              ]
            });
          }
        } catch {
          // Ignore network errors silently
        }
      };

      checkNewTickets();
      interval = setInterval(checkNewTickets, 15000);
    };

    setup();

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [token]);
};
