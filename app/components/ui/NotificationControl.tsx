'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    checkNotificationPermission,
    requestNotificationPermission,
    registerServiceWorker,
    schedulePrayerNotification,
} from '../../services/notificationService';
import { PrayerTime } from '../../types';

interface NotificationControlProps {
    prayerTimes?: PrayerTime;
    cityName: string;
}

const NotificationControl: React.FC<NotificationControlProps> = ({ prayerTimes, cityName }) => {
    const [hasPermission, setHasPermission] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isServiceWorkerActive, setIsServiceWorkerActive] = useState<boolean>(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(false);

    // İzinleri kontrol et
    useEffect(() => {
        const checkPermissions = async () => {
            setIsLoading(true);

            // Browser bildirim izinlerini kontrol et
            const hasPerm = checkNotificationPermission();
            setHasPermission(hasPerm);

            // Service worker aktif mi kontrol et
            const isSwActive = 'serviceWorker' in navigator;
            setIsServiceWorkerActive(isSwActive);

            // Kullanıcı tercihi - localStorage'da sakla
            const storedPref = localStorage.getItem('prayer-notifications-enabled');
            setNotificationsEnabled(storedPref === 'true');

            setIsLoading(false);
        };

        checkPermissions();
    }, []);

    // Bildirimleri etkinleştir
    const handleEnableNotifications = async () => {
        setIsLoading(true);

        try {
            // Bildirim iznini iste
            const permissionGranted = await requestNotificationPermission();
            setHasPermission(permissionGranted);

            if (permissionGranted) {
                // Service worker'ı kaydet
                const swRegistered = await registerServiceWorker();

                if (swRegistered) {
                    setIsServiceWorkerActive(true);
                    setNotificationsEnabled(true);
                    localStorage.setItem('prayer-notifications-enabled', 'true');

                    // Bildirim planla (varsa)
                    scheduleNotifications();
                }
            }
        } catch (error) {
            console.error('Bildirim etkinleştirme hatası:', error);
        }

        setIsLoading(false);
    };

    // Bildirimleri kapat
    const handleDisableNotifications = () => {
        setNotificationsEnabled(false);
        localStorage.setItem('prayer-notifications-enabled', 'false');
    };

    // Mevcut namaz vakitlerini planla
    const scheduleNotifications = useCallback(() => {
        if (!prayerTimes || !notificationsEnabled) return;

        const prayerMap: { [key: string]: string } = {
            fajr: 'İmsak',
            sunrise: 'Güneş',
            dhuhr: 'Öğle',
            asr: 'İkindi',
            maghrib: 'Akşam',
            isha: 'Yatsı',
        };

        // Tüm vakitler için bildirim planla
        Object.entries(prayerTimes).forEach(([key, time]) => {
            const prayerName = prayerMap[key] || key;
            if (time) {
                schedulePrayerNotification(prayerName, time, cityName);
            }
        });
    }, [prayerTimes, notificationsEnabled, cityName]);

    // Namaz vakitleri değiştiğinde bildirimleri yeniden planla
    useEffect(() => {
        if (notificationsEnabled && prayerTimes) {
            scheduleNotifications();
        }
    }, [prayerTimes, notificationsEnabled, cityName, scheduleNotifications]);

    // Test bildirimi için fonksiyon
    const handleSendTestNotification = () => {
        console.log('Test bildirimi gönderme düğmesine tıklandı');

        // Tarayıcı bildirim desteği kontrolü
        if (!('Notification' in window)) {
            alert('Bu tarayıcı bildirimleri desteklemiyor!');
            console.error("Bildirim API'si bulunamadı - tarayıcı desteklemiyor");
            return;
        }

        // İzin kontrolü
        if (Notification.permission !== 'granted') {
            alert('Bildirim izni verilmedi! Lütfen önce bildirimleri etkinleştirin.');
            console.log('Bildirim izni durumu:', Notification.permission);
            return;
        }

        try {
            // Şu anki vakti bul
            const now = new Date();
            const currentHour = now.getHours().toString().padStart(2, '0');
            const currentMinute = now.getMinutes().toString().padStart(2, '0');
            const currentTime = `${currentHour}:${currentMinute}`;

            console.log('Test bildirimi gönderiliyor:', {
                prayerName: 'Test',
                prayerTime: currentTime,
                cityName,
            });

            // Test bildirimini doğrudan oluştur (servis kullanmadan)
            const iconUrl = '/icons/prayer-icon.svg';

            const notification = new Notification(`Test Bildirimi`, {
                body: `${cityName} için test bildirimi - ${currentTime}`,
                icon: iconUrl,
                requireInteraction: true,
            });

            notification.onclick = () => {
                console.log('Bildirime tıklandı');
                window.focus();
                notification.close();
            };

            console.log('Bildirim oluşturuldu:', notification);
        } catch (error: unknown) {
            console.error("Bildirim oluşturma hatası:", error);
            if (error instanceof Error) {
                alert(`Bildirim oluşturulamadı: ${error.message}`);
            } else {
                alert('Bildirim oluşturulamadı');
            }
        }
    };

    // Bildirim butonu render
    return (
        <div className="mt-4 mb-2">
            {isLoading ? (
                <div className="flex justify-center">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : !hasPermission || !isServiceWorkerActive ? (
                <button
                    onClick={handleEnableNotifications}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors"
                >
                    Namaz Vakti Bildirimlerini Etkinleştir
                </button>
            ) : (
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <span className="text-sm">Namaz Vakti Bildirimleri</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={notificationsEnabled}
                                onChange={() =>
                                    notificationsEnabled ? handleDisableNotifications() : handleEnableNotifications()
                                }
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                    {/* Test Butonu */}
                    <button
                        onClick={handleSendTestNotification}
                        className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 py-2 px-4 rounded-lg transition-colors text-sm"
                    >
                        Test Bildirimi Gönder
                    </button>
                </div>
            )}
        </div>
    );
};

export default NotificationControl;
