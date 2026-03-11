import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const NotificationBell = () => {
    const [unreadCount, setUnreadCount] = useState(0);
    const navigate = useNavigate();

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUnreadCount(response.data.filter(n => !n.is_read).length);
        } catch (error) {
            console.error('Error fetching notifications (NotificationBell):', error);
        }
    };

    useEffect(() => {
        fetchNotifications();

        // Listen for when notifications are marked as read on other pages
        window.addEventListener('notificationRead', fetchNotifications);

        const interval = setInterval(fetchNotifications, 10000); // Poll every 10s

        return () => {
            clearInterval(interval);
            window.removeEventListener('notificationRead', fetchNotifications);
        };
    }, []);

    return (
        <div className="relative">
            <button
                onClick={() => navigate('/notifications')}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer flex items-center justify-center"
                aria-label="Notifications"
            >
                <div className="relative flex items-center justify-center">
                    <Bell size={20} className="text-gray-600 dark:text-gray-300" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 text-[10px] font-bold leading-none text-white bg-red-600 rounded-full border-[1.5px] border-white dark:border-gray-800">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </div>
            </button>
        </div>
    );
};

export default NotificationBell;
