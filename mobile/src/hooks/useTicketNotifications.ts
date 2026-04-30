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
      await LocalNotifications.createChannel({
        id: 'tickets',
        name: 'New Tickets',
        description: 'Notifications for new IT support tickets',
        importance: 5,
        visibility: 1,
        vibration: true,
      });

      // Polling function
      const checkNewTickets = async () => {
        try {
          const res = await ticketService.getAll({ sort: 'desc', limit: 5 });
          const tickets = Array.isArray(res?.data) ? res.data : [];
          
          if (!initialized.current) {
            // First run: just save the IDs
            tickets.forEach((t: any) => knownTicketIds.current.add(t.id));
            initialized.current = true;
            return;
          }

          // Check for new IDs
          const newTickets = tickets.filter((t: any) => !knownTicketIds.current.has(t.id));
          
          if (newTickets.length > 0) {
            for (const ticket of newTickets) {
              knownTicketIds.current.add(ticket.id);
              
              await LocalNotifications.schedule({
                notifications: [
                  {
                    title: 'New IT Ticket Assigned!',
                    body: `${ticket.ticket_number}: ${ticket.title}`,
                    id: ticket.id,
                    schedule: { at: new Date(Date.now() + 1000) },
                    sound: 'beep.wav',
                    smallIcon: 'ic_stat_icon_config_sample',
                    iconColor: '#f97316',
                    channelId: 'tickets',
                    actionTypeId: '',
                    extra: null,
                  }
                ]
              });
            }
          }
        } catch (err) {
          // Ignore network errors in polling
        }
      };

      // Initial check
      checkNewTickets();
      // Poll every 10 seconds
      interval = setInterval(checkNewTickets, 10000);
    };

    setup();

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [token]);
};
