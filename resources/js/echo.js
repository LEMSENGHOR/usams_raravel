
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { tokenStorage } from '@/modules/utils/tokenStorage';

window.Pusher = Pusher;

const apiBase = window.USAMS?.apiBase ?? '/api';

window.Echo = new Echo({
    broadcaster: 'reverb',

    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: Number(import.meta.env.VITE_REVERB_PORT ?? 80),
    wssPort: Number(import.meta.env.VITE_REVERB_PORT ?? 443),
forceTLS: false,
enabledTransports: ['ws'],
    authEndpoint: `${apiBase}/broadcasting/auth`,

    // Get the latest token when a private channel is authorized.
    authorizer: (channel) => ({
        authorize: (socketId, callback) => {
            const token = tokenStorage.get();

            if (!token) {
                callback(true, new Error('Authentication token not found.'));
                return;
            }

            fetch(`${apiBase}/broadcasting/auth`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    socket_id: socketId,
                    channel_name: channel.name,
                }),
            })
                .then(async (response) => {
                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(
                            data.message || 'Broadcast authentication failed.'
                        );
                    }

                    callback(false, data);
                })
                .catch((error) => {
                    console.error('Private channel authorization failed:', error);
                    callback(true, error);
                });
        },
    }),
});
