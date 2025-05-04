/**
 * API yapılandırma dosyası
 * API anahtarı çevresel değişkenlerden okunur. Bu değişkenleri projenizin .env.local dosyasında ayarlayabilirsiniz:
 * NEXT_PUBLIC_COLLECT_API_KEY=your_api_key_here
 * 
 * Bu dosya .gitignore'a eklenmiştir ve versiyon kontrolünden hariç tutulmalıdır.
 */

// Çevresel değişkenden API anahtarını al, yoksa hard-coded değeri kullan
// Gerçek projede sadece çevresel değişkenden alınmalıdır
const API_KEY = 'apikey ' + process.env.NEXT_PUBLIC_COLLECT_API_KEY || "";

export const API_CONFIG = {
    COLLECT_API_KEY: API_KEY
};

/**
 * .env.local Dosyasını Oluşturma:
 * 1. Proje kök dizininde .env.local adında bir dosya oluşturun
 * 2. İçine şu satırı ekleyin: NEXT_PUBLIC_COLLECT_API_KEY=
 * 3. Sunucuyu yeniden başlatın (npm run dev)
 */ 