"use client";

import { useEffect, useState } from "react";

// iOS DeviceOrientationEvent için genişletilmiş tip
interface DeviceOrientationEventiOS extends DeviceOrientationEvent {
    webkitCompassHeading?: number;
}

// Safari requestPermission metodu için genişletilmiş tip
interface DeviceOrientationEventWithPermission extends EventTarget {
    requestPermission?: () => Promise<string>;
}

const QiblaCompass = () => {
    const [direction, setDirection] = useState<number | null>(null);
    const [qiblaAngle, setQiblaAngle] = useState<number | null>(null);
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [permissionGranted, setPermissionGranted] = useState<boolean>(false);

    useEffect(() => {
        // Tarayıcı desteğini kontrol et
        if (!window.DeviceOrientationEvent) {
            setErrorMessage("Cihazınız pusula özelliğini desteklemiyor.");
            return;
        }

        // Konum bilgisini al
        navigator.geolocation.getCurrentPosition(
            (position) => {
                // Kıble açısını hesapla (Kabe'nin koordinatları: 21.4225, 39.8262)
                const lat1 = position.coords.latitude * (Math.PI / 180);
                const lon1 = position.coords.longitude * (Math.PI / 180);
                const lat2 = 21.4225 * (Math.PI / 180);
                const lon2 = 39.8262 * (Math.PI / 180);

                // Kıble açısını hesapla
                const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
                const x = Math.cos(lat1) * Math.sin(lat2) -
                    Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
                let angle = Math.atan2(y, x) * (180 / Math.PI);
                angle = (angle + 360) % 360; // 0-360 arası dereceye dönüştür

                setQiblaAngle(angle);
                setPermissionGranted(true);
            },
            (error) => {
                console.error("Konum bilgisi alınamadı:", error);
                setErrorMessage("Konum bilgisi alınamadı. Lütfen konum izinlerini kontrol edin.");
            }
        );

        // Pusula verilerini dinle
        const handleOrientation = (event: DeviceOrientationEvent) => {
            const e = event as DeviceOrientationEventiOS;
            if (e.webkitCompassHeading) {
                // iOS için
                setDirection(e.webkitCompassHeading);
            } else if (event.alpha) {
                // Android için
                setDirection(360 - event.alpha);
            }
        };

        // iOS için izin isteği
        const requestPermission = async () => {
            const DeviceOrientationEventIOS = window.DeviceOrientationEvent as unknown as DeviceOrientationEventWithPermission;
            if (typeof DeviceOrientationEventIOS.requestPermission === 'function') {
                try {
                    const permissionState = await DeviceOrientationEventIOS.requestPermission();
                    if (permissionState === 'granted') {
                        window.addEventListener('deviceorientation', handleOrientation, true);
                        setPermissionGranted(true);
                    } else {
                        setErrorMessage("Pusula izni reddedildi.");
                    }
                } catch (error) {
                    console.error("İzin isteği sırasında hata:", error);
                    setErrorMessage("Pusula izni isteği sırasında hata oluştu.");
                }
            } else {
                // İzin gerekmiyorsa doğrudan kullan
                window.addEventListener('deviceorientation', handleOrientation, true);
                setPermissionGranted(true);
            }
        };

        // İzin gerekiyorsa iste
        const DeviceOrientationEventIOS = window.DeviceOrientationEvent as unknown as DeviceOrientationEventWithPermission;
        if (typeof DeviceOrientationEventIOS.requestPermission === 'function') {
            // Buton tıklama olayında izin isteği göster (iOS için)
            const button = document.getElementById('request-permission');
            if (button) {
                button.addEventListener('click', requestPermission);
            }
        } else {
            // İzin gerektirmeyen cihazlar için doğrudan kullan
            window.addEventListener('deviceorientation', handleOrientation, true);
        }

        return () => {
            window.removeEventListener('deviceorientation', handleOrientation, true);
        };
    }, []);

    // Kıble yönünü hesapla
    const calculateQiblaDirection = () => {
        if (direction === null || qiblaAngle === null) return 0;
        return qiblaAngle - direction;
    };

    // Qibla ok stilini hesapla
    const arrowStyle = {
        transform: `rotate(${calculateQiblaDirection()}deg)`,
        transition: 'transform 0.5s ease-out'
    };

    // İzin isteme durumu
    const DeviceOrientationEventIOS = window.DeviceOrientationEvent as unknown as DeviceOrientationEventWithPermission;
    if (typeof DeviceOrientationEventIOS.requestPermission === 'function' && !permissionGranted) {
        return (
            <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Kıble Pusulası</h2>
                <p className="text-gray-600 mb-4">Kıble yönünü görebilmek için pusula izni gerekiyor.</p>
                <button
                    id="request-permission"
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    Pusula İzni Ver
                </button>
            </div>
        );
    }

    // Hata mesajı varsa göster
    if (errorMessage) {
        return (
            <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Kıble Pusulası</h2>
                <p className="text-red-500">{errorMessage}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Kıble Pusulası</h2>

            <div className="relative w-64 h-64">
                {/* Pusula çemberi */}
                <div className="absolute inset-0 border-4 border-gray-300 rounded-full"></div>

                {/* Yön işaretleri */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="absolute top-4 text-center font-bold">K</div>
                    <div className="absolute right-4 text-center font-bold">D</div>
                    <div className="absolute bottom-4 text-center font-bold">G</div>
                    <div className="absolute left-4 text-center font-bold">B</div>
                </div>

                {/* Kıble oku */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div style={arrowStyle} className="w-1 h-32 bg-gradient-to-t from-red-600 to-transparent transform origin-bottom">
                        <div className="w-5 h-5 bg-red-600 rounded-full absolute -left-2 -top-2"></div>
                    </div>
                </div>
            </div>

            <div className="mt-4 text-center">
                <p className="text-gray-600">
                    {direction !== null ? `Pusula: ${Math.round(direction)}°` : 'Pusula verisi bekleniyor...'}
                </p>
                <p className="text-green-600 font-medium">
                    {qiblaAngle !== null ? `Kıble açısı: ${Math.round(qiblaAngle)}°` : 'Konum verisi bekleniyor...'}
                </p>
            </div>
        </div>
    );
};

export default QiblaCompass; 