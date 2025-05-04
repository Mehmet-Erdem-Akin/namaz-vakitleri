/**
 * Namaz vakitleri için bildirim servisi
 * Tarayıcı Notification API kullanılarak oluşturulmuştur
 */

// Bildirim izni kontrolü
export const checkNotificationPermission = (): boolean => {
    if (!("Notification" in window)) {
        console.log("Bu tarayıcı bildirim desteklemiyor");
        return false;
    }

    return Notification.permission === "granted";
};

// Bildirim izni isteme
export const requestNotificationPermission = async (): Promise<boolean> => {
    if (!("Notification" in window)) {
        console.log("Bu tarayıcı bildirim desteklemiyor");
        return false;
    }

    if (Notification.permission === "granted") {
        console.log("Bildirim izni zaten verilmiş");
        return true;
    }

    if (Notification.permission !== "denied") {
        console.log("Bildirim izni isteniyor...");
        try {
            const permission = await Notification.requestPermission();
            console.log("Bildirim izni sonucu:", permission);
            return permission === "granted";
        } catch (error) {
            console.error("Bildirim izni isteme hatası:", error);
            return false;
        }
    }

    console.log("Bildirim izni reddedilmiş durumda");
    return false;
};

// Service Worker kaydı
export const registerServiceWorker = async (): Promise<boolean> => {
    if ("serviceWorker" in navigator) {
        try {
            const registration = await navigator.serviceWorker.register("/sw.js", {
                scope: "/"
            });

            console.log("Service Worker başarıyla kaydedildi:", registration.scope);
            return true;
        } catch (error) {
            console.error("Service Worker kaydı başarısız:", error);
            return false;
        }
    }

    console.log("Service Worker bu tarayıcıda desteklenmiyor");
    return false;
};

// Namaz vakti için bildirim gönderme
export const schedulePrayerNotification = (
    prayerName: string,
    prayerTime: string,
    cityName: string
): void => {
    const [hours, minutes] = prayerTime.split(":").map(Number);

    const now = new Date();
    const scheduledTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        hours,
        minutes
    );

    // Eğer zaman geçtiyse, bildirimi ertele
    if (scheduledTime < now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const timeUntilNotification = scheduledTime.getTime() - now.getTime();

    // Bildirim zamanlaması
    setTimeout(() => {
        sendPrayerNotification(prayerName, prayerTime, cityName);
    }, timeUntilNotification);

    console.log(`${prayerName} vakti için bildirim zamanlandı: ${prayerTime} (${cityName})`);
};

// Namaz vakti bildirimi gönderme
export const sendPrayerNotification = (
    prayerName: string,
    prayerTime: string,
    cityName: string
): void => {
    console.log("sendPrayerNotification çağrıldı:", { prayerName, prayerTime, cityName });

    if (!("Notification" in window)) {
        console.error("Bu tarayıcı bildirimleri desteklemiyor");
        return;
    }

    if (Notification.permission !== "granted") {
        console.error("Bildirim gönderilemedi: İzin yok", Notification.permission);
        return;
    }

    try {
        // Icon ve badge görüntüleri (projenizde uygun iconları ekleyin)
        const iconUrl = "/icons/prayer-icon.svg";
        const badgeUrl = "/icons/badge-icon.svg";

        console.log("Bildirim oluşturuluyor:", { prayerName, iconUrl });

        const notification = new Notification(`${prayerName} Vakti`, {
            body: `${cityName} için ${prayerName} vakti geldi: ${prayerTime}`,
            icon: iconUrl,
            badge: badgeUrl,
            silent: false, // Ses çıkarsın
            tag: `prayer-${prayerName.toLowerCase()}`, // Aynı tag ile gelen bildirimler birbirini ezer
            requireInteraction: true // Kullanıcı etkileşimi olmadan kapanmaz
        });

        notification.onclick = () => {
            console.log("Bildirime tıklandı");
            window.focus();
            notification.close();
        };

        console.log("Bildirim başarıyla oluşturuldu");
    } catch (error: any) {
        console.error("Bildirim oluşturma hatası:", error);
    }
}; 