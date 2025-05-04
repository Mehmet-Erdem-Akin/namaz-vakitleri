'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { CurrentPrayer, NextPrayer } from '../../types';

interface TimeDisplayProps {
  currentPrayer: CurrentPrayer | null;
  nextPrayer: NextPrayer | null;
  countdown: string;
  isLoading: boolean;
}

const TimeDisplay = ({ currentPrayer, nextPrayer, countdown, isLoading }: TimeDisplayProps) => {
  const [isDaytime, setIsDaytime] = useState(true);
  const [timeOfDay, setTimeOfDay] = useState<'dawn' | 'day' | 'dusk' | 'night'>('day');

  // Bulut animasyonu için ref
  const cloudAnimationRef = useRef<NodeJS.Timeout | null>(null);

  // Animasyon değerleri için state
  const [cloudOffsets, setCloudOffsets] = useState({
    cloud1: { x: 0, speed: 0.03 },
    cloud2: { x: 0, speed: 0.02 },
    cloud3: { x: 0, speed: 0.015 },
    cloud4: { x: 0, speed: 0.025 },
  });

  // Kayan yıldız state'i
  const [shootingStars, setShootingStars] = useState<
    Array<{
      id: number;
      left: number;
      top: number;
      duration: number;
      delay: number;
      size: number;
    }>
  >([]);

  // Yıldız konumları ve özellikleri - useMemo ile sabitlendi
  const normalStars = useMemo(() => {
    return Array.from({ length: 70 }).map(() => ({
      size: Math.random() * 1.8 + 0.6, // Daha büyük yıldızlar (0.6-2.4px arası)
      opacity: Math.random() * 0.4 + 0.6,
      animationDuration: Math.random() * 30 + 40,
      top: Math.random() * 80,
      left: Math.random() * 100,
      delay: Math.random() * 15,
    }));
  }, []);

  // Parlak yıldızlar - useMemo ile sabitlendi
  const brightStars = useMemo(() => {
    return Array.from({ length: 10 }).map(() => ({
      animationDuration: Math.random() * 25 + 35,
      top: Math.random() * 70,
      left: Math.random() * 100,
      delay: Math.random() * 15,
    }));
  }, []);

  useEffect(() => {
    // Günün saatine göre görünümü belirle
    const updateTimeOfDay = () => {
      const currentHour = new Date().getHours();

      if (currentHour >= 5 && currentHour < 7) {
        setTimeOfDay('dawn'); // Şafak
        setIsDaytime(true);
      } else if (currentHour >= 7 && currentHour < 17) {
        setTimeOfDay('day'); // Gündüz
        setIsDaytime(true);
      } else if (currentHour >= 17 && currentHour < 19) {
        setTimeOfDay('dusk'); // Gün batımı
        setIsDaytime(true);
      } else {
        setTimeOfDay('night'); // Gece
        setIsDaytime(false);
      }
    };

    updateTimeOfDay();
    const interval = setInterval(updateTimeOfDay, 60000); // Her dakika kontrol et

    return () => clearInterval(interval);
  }, []);

  // Zaman bilgisine göre arkaplan renkleri
  const getBgColor = () => {
    switch (timeOfDay) {
      case 'dawn':
        return 'from-orange-300 via-pink-300 to-blue-400';
      case 'day':
        return 'from-sky-300 via-blue-300 to-sky-100';
      case 'dusk':
        return 'from-orange-400 via-pink-400 to-purple-500';
      case 'night':
        return 'from-slate-900 via-indigo-950 to-indigo-900';
      default:
        return 'from-sky-300 via-blue-300 to-sky-100';
    }
  };

  // Glow efektleri için renkler
  const getGlowColor = () => {
    switch (timeOfDay) {
      case 'dawn':
        return 'rgba(253, 186, 116, 0.7)'; // turuncu-pembe
      case 'day':
        return 'rgba(253, 224, 71, 0.7)'; // sarı-parlak
      case 'dusk':
        return 'rgba(251, 146, 60, 0.7)'; // turuncu
      case 'night':
        return 'rgba(167, 139, 250, 0.6)'; // mor-parıltılı
      default:
        return 'rgba(253, 224, 71, 0.7)'; // sarı-parlak
    }
  };

  // Gökyüzü arkaplanı için ek CSS
  const getSkyStyle = () => {
    if (!isDaytime) {
      return {
        background: 'radial-gradient(ellipse at center, #0c164d 0%, #1a1c51 40%, #000428 100%)',
        overflow: 'hidden',
      };
    }

    // Gündüz için ek efektler
    switch (timeOfDay) {
      case 'dawn':
        return {
          background: 'linear-gradient(to bottom, #ff9e7d, #ffbfa3, #c4d7f2)',
        };
      case 'day':
        return {
          background: 'linear-gradient(to bottom, #87ceeb, #b5d8f0, #e6f3fc)',
        };
      case 'dusk':
        return {
          background: 'linear-gradient(to bottom, #ff7e5f, #feb47b, #c471f5)',
        };
      default:
        return {
          background: 'linear-gradient(to bottom, #87ceeb, #b5d8f0, #e6f3fc)',
        };
    }
  };

  // Bulut animasyonları
  useEffect(() => {
    if (isDaytime) {
      // Önceki interval'ı temizle
      if (cloudAnimationRef.current) {
        clearInterval(cloudAnimationRef.current);
      }

      // Bulut hareketleri için interval
      cloudAnimationRef.current = setInterval(() => {
        setCloudOffsets(prev => {
          const newOffsets = { ...prev };

          // Her bulut için hesapla
          Object.keys(newOffsets).forEach(cloudKey => {
            const cloud = newOffsets[cloudKey as keyof typeof newOffsets];
            cloud.x += cloud.speed;

            // Ekrandan çıkınca başa dön
            if (cloud.x > 100) {
              cloud.x = -20;
            }
          });

          return newOffsets;
        });
      }, 50);

      // Component unmount olunca interval'ı temizle
      return () => {
        if (cloudAnimationRef.current) {
          clearInterval(cloudAnimationRef.current);
        }
      };
    } else {
      // Gece modunda kayan yıldız efektleri
      // İlk kayan yıldızları oluştur
      createNewShootingStars();

      // Her 8 saniyede bir yeni kayan yıldızlar oluştur
      const shootingStarInterval = setInterval(() => {
        createNewShootingStars();
      }, 8000);

      return () => {
        clearInterval(shootingStarInterval);
      };
    }
  }, [isDaytime]);

  // Kayan yıldız oluşturma fonksiyonu
  const createNewShootingStars = () => {
    const newStars: Array<{
      id: number;
      left: number;
      top: number;
      duration: number;
      delay: number;
      size: number;
    }> = [];
    const starCount = Math.floor(Math.random() * 2) + 1; // 1-2 yıldız

    for (let i = 0; i < starCount; i++) {
      newStars.push({
        id: Date.now() + i,
        left: Math.random() * 70 + 10, // %10-%80 arası pozisyon
        top: Math.random() * 30 + 5, // %5-%35 arası pozisyon
        duration: Math.random() * 1.5 + 0.7, // 0.7-2.2 saniye arasında
        delay: Math.random() * 3, // 0-3 saniye gecikme
        size: Math.random() * 0.8 + 0.3, // 0.3-1.1 boyut çarpanı
      });
    }

    setShootingStars(prev => [...prev, ...newStars]);

    // 4 saniye sonra kayan yıldızları temizle
    setTimeout(() => {
      setShootingStars(prev =>
        prev.filter(star => !newStars.some(newStar => newStar.id === star.id))
      );
    }, 4000);
  };

  return (
    <div
      className={`relative h-60 rounded-xl overflow-hidden bg-gradient-to-b ${getBgColor()} shadow-lg mb-6`}
      style={getSkyStyle()}
    >
      {/* Güneş ışınları efekti - Gündüz ve şafak için */}
      {isDaytime && (timeOfDay === 'day' || timeOfDay === 'dawn') && (
        <div className="absolute inset-0 z-5 overflow-hidden">
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '300px',
              height: '300px',
              transform: 'translate(-50%, -50%)',
              background:
                'radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 70%)',
              animation: 'pulse 4s infinite ease-in-out',
            }}
          />
        </div>
      )}

      {/* Celestial object (sun or moon) */}
      <div className="absolute inset-0 flex items-center justify-center">
        {isDaytime ? (
          // Güneş
          <div
            className="bg-yellow-300 rounded-full w-24 h-24 relative z-10"
            style={{
              boxShadow: `0 0 60px 20px ${timeOfDay === 'day' ? 'rgba(253, 224, 71, 0.8)' : timeOfDay === 'dawn' ? 'rgba(253, 186, 116, 0.7)' : 'rgba(251, 146, 60, 0.7)'}`,
              animation: 'pulse 10s infinite ease-in-out',
            }}
          />
        ) : (
          // Ay ve kraterler
          <div className="relative">
            {/* Ana ay gövdesi */}
            <div
              className="bg-gray-200 rounded-full w-24 h-24 relative z-10"
              style={{
                boxShadow: '0 0 60px 20px rgba(167, 139, 250, 0.6)',
                animation: 'pulse 10s infinite ease-in-out',
              }}
            >
              {/* Ay yüzeyindeki kraterler */}
              <div className="absolute top-4 left-5 w-5 h-5 rounded-full bg-gray-300 opacity-80"></div>
              <div className="absolute top-14 left-16 w-3 h-3 rounded-full bg-gray-300 opacity-90"></div>
              <div className="absolute top-8 left-14 w-4 h-4 rounded-full bg-gray-300 opacity-85"></div>
              <div className="absolute top-16 left-7 w-6 h-6 rounded-full bg-gray-300 opacity-75"></div>

              {/* Gölge kısmı - yumuşak geçişli */}
              <div className="absolute inset-0 rounded-full overflow-hidden">
                <div
                  className="absolute top-0 right-0 w-full h-full"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent 30%, rgba(30, 41, 59, 0.4) 50%, rgba(30, 41, 59, 0.85) 70%, rgba(15, 23, 42, 0.95) 85%)',
                    borderRadius: '50%',
                  }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Realistic clouds using multiple overlapping elements and clip-path */}
      {isDaytime && (
        <div className="absolute inset-0 z-5">
          {/* Bulut 1 - Sol üst */}
          <div
            className="absolute"
            style={{
              top: '10%',
              left: `${5 + cloudOffsets.cloud1.x}%`,
              transition: 'left 0.1s linear',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: '150px',
                height: '60px',
              }}
            >
              {/* Ana bulut kütlesi */}
              <div
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  backgroundColor: 'white',
                  borderRadius: '50px',
                  boxShadow:
                    '0 0 15px rgba(255, 255, 255, 0.4), inset 0 -10px 20px rgba(0, 0, 0, 0.1), 0 5px 15px rgba(0, 0, 0, 0.1)',
                  opacity: 0.9,
                }}
              />

              {/* Bulut çıkıntıları - üst */}
              <div
                style={{
                  position: 'absolute',
                  left: '20px',
                  top: '-20px',
                  width: '50px',
                  height: '50px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  boxShadow: 'inset -3px -3px 10px rgba(0, 0, 0, 0.1)',
                  opacity: 0.95,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: '55px',
                  top: '-25px',
                  width: '65px',
                  height: '65px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  boxShadow: 'inset -3px -3px 10px rgba(0, 0, 0, 0.1)',
                  opacity: 0.9,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: '100px',
                  top: '-15px',
                  width: '45px',
                  height: '45px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  boxShadow: 'inset -3px -3px 10px rgba(0, 0, 0, 0.1)',
                  opacity: 0.95,
                }}
              />
            </div>
          </div>

          {/* Bulut 2 - Sağ üst */}
          <div
            className="absolute"
            style={{
              top: '20%',
              right: `${15 - cloudOffsets.cloud2.x}%`,
              transition: 'right 0.1s linear',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: '180px',
                height: '70px',
              }}
            >
              {/* Ana bulut kütlesi */}
              <div
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  backgroundColor: 'white',
                  borderRadius: '50px',
                  boxShadow:
                    '0 0 15px rgba(255, 255, 255, 0.4), inset 0 -10px 20px rgba(0, 0, 0, 0.1), 0 8px 20px rgba(0, 0, 0, 0.1)',
                  opacity: 0.9,
                }}
              />

              {/* Bulut çıkıntıları */}
              <div
                style={{
                  position: 'absolute',
                  left: '15px',
                  top: '-25px',
                  width: '60px',
                  height: '60px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  boxShadow: 'inset -3px -3px 10px rgba(0, 0, 0, 0.1)',
                  opacity: 0.9,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: '65px',
                  top: '-35px',
                  width: '80px',
                  height: '80px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  boxShadow: 'inset -3px -3px 10px rgba(0, 0, 0, 0.1)',
                  opacity: 0.95,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: '130px',
                  top: '-20px',
                  width: '50px',
                  height: '50px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  boxShadow: 'inset -3px -3px 10px rgba(0, 0, 0, 0.1)',
                  opacity: 0.9,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: '40px',
                  top: '-10px',
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  boxShadow: 'inset -3px -3px 10px rgba(0, 0, 0, 0.1)',
                  opacity: 0.9,
                }}
              />
            </div>
          </div>

          {/* Bulut 3 - Orta kısım */}
          <div
            className="absolute"
            style={{
              top: '35%',
              left: `${30 + cloudOffsets.cloud3.x}%`,
              transition: 'left 0.1s linear',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: '200px',
                height: '60px',
              }}
            >
              {/* Ana bulut kütlesi */}
              <div
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  backgroundColor: 'white',
                  borderRadius: '50px',
                  boxShadow:
                    '0 0 15px rgba(255, 255, 255, 0.4), inset 0 -10px 20px rgba(0, 0, 0, 0.1), 0 10px 20px rgba(0, 0, 0, 0.08)',
                  opacity: 0.9,
                }}
              />

              {/* Bulut çıkıntıları */}
              <div
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '-15px',
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  boxShadow: 'inset -3px -3px 10px rgba(0, 0, 0, 0.1)',
                  opacity: 0.95,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: '40px',
                  top: '-30px',
                  width: '70px',
                  height: '70px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  boxShadow: 'inset -3px -3px 10px rgba(0, 0, 0, 0.1)',
                  opacity: 0.9,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: '100px',
                  top: '-25px',
                  width: '60px',
                  height: '60px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  boxShadow: 'inset -3px -3px 10px rgba(0, 0, 0, 0.1)',
                  opacity: 0.95,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: '150px',
                  top: '-20px',
                  width: '50px',
                  height: '50px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  boxShadow: 'inset -3px -3px 10px rgba(0, 0, 0, 0.1)',
                  opacity: 0.95,
                }}
              />
            </div>
          </div>

          {/* Küçük bulut - Sol alt */}
          <div
            className="absolute"
            style={{
              top: '18%',
              left: `${65 + cloudOffsets.cloud4.x}%`,
              transition: 'left 0.1s linear',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: '100px',
                height: '40px',
              }}
            >
              {/* Ana bulut kütlesi */}
              <div
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  backgroundColor: 'white',
                  borderRadius: '30px',
                  boxShadow:
                    '0 0 10px rgba(255, 255, 255, 0.3), inset 0 -5px 10px rgba(0, 0, 0, 0.1), 0 5px 10px rgba(0, 0, 0, 0.05)',
                  opacity: 0.85,
                }}
              />

              {/* Bulut çıkıntıları */}
              <div
                style={{
                  position: 'absolute',
                  left: '15px',
                  top: '-10px',
                  width: '30px',
                  height: '30px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  boxShadow: 'inset -2px -2px 5px rgba(0, 0, 0, 0.1)',
                  opacity: 0.9,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: '40px',
                  top: '-15px',
                  width: '35px',
                  height: '35px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  boxShadow: 'inset -2px -2px 5px rgba(0, 0, 0, 0.1)',
                  opacity: 0.9,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: '70px',
                  top: '-8px',
                  width: '25px',
                  height: '25px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  boxShadow: 'inset -2px -2px 5px rgba(0, 0, 0, 0.1)',
                  opacity: 0.9,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Stars for night */}
      {!isDaytime && (
        <div className="absolute inset-0">
          {/* Normal yıldızlar - useMemo ile sabit konumlar */}
          {normalStars.map((star, i) => (
            <div
              key={i}
              className="absolute bg-white rounded-full"
              style={{
                width: `${star.size}px`,
                height: `${star.size}px`,
                top: `${star.top}%`,
                left: `${star.left}%`,
                opacity: star.opacity,
                animation: `twinkle ${star.animationDuration}s infinite cubic-bezier(0.4, 0.0, 0.6, 1.0)`,
                animationDelay: `${star.delay}s`,
              }}
            />
          ))}

          {/* Parlak yıldızlar - useMemo ile sabit konumlar */}
          {brightStars.map((star, i) => (
            <div
              key={`bright-${i}`}
              className="absolute"
              style={{
                top: `${star.top}%`,
                left: `${star.left}%`,
              }}
            >
              <div
                className="bg-white rounded-full"
                style={{
                  width: '2.5px',
                  height: '2.5px',
                  boxShadow: '0 0 3px 1px rgba(255,255,255,0.7)',
                  animation: `twinkle ${star.animationDuration}s infinite cubic-bezier(0.4, 0.0, 0.6, 1.0)`,
                  animationDelay: `${star.delay}s`,
                }}
              />
            </div>
          ))}

          {/* Kayan yıldızlar */}
          {shootingStars.map(star => (
            <div
              key={star.id}
              className="absolute"
              style={{
                top: `${star.top}%`,
                left: `${star.left}%`,
                opacity: 0, // Başlangıçta görünmez
                animation: `shootingStar ${star.duration}s ease-out forwards`,
                animationDelay: `${star.delay}s`,
              }}
            >
              <div
                style={{
                  width: `${2 * star.size}px`,
                  height: `${2 * star.size}px`,
                  background: 'white',
                  borderRadius: '50%',
                  boxShadow: `0 0 ${4 * star.size}px ${2 * star.size}px rgba(255, 255, 255, 0.8)`,
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    right: '0',
                    width: `${30 * star.size}px`,
                    height: `${1.5 * star.size}px`,
                    background: 'linear-gradient(to left, rgba(255,255,255,0.8), transparent)',
                    transform: 'translateY(-50%)',
                    transformOrigin: 'right center',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Prayer time information */}
      <div className="absolute inset-x-0 bottom-0 py-4 px-6 bg-black bg-opacity-40 backdrop-blur-sm text-white">
        <div className="flex justify-between items-end">
          <div>
            {isLoading ? (
              <div className="animate-pulse h-4 w-24 bg-gray-400 rounded mb-2" />
            ) : currentPrayer ? (
              <div>
                <p className="text-sm text-gray-200">Mevcut Vakit</p>
                <p className="text-xl font-semibold">{currentPrayer.name}</p>
              </div>
            ) : null}
          </div>

          <div className="text-right">
            {isLoading ? (
              <div className="animate-pulse h-4 w-24 bg-gray-400 rounded mb-2" />
            ) : nextPrayer ? (
              <div>
                <p className="text-sm text-gray-200">Sonraki Vakit</p>
                <p className="text-xl font-semibold">{nextPrayer.name}</p>
                <p className="text-2xl font-bold font-mono">{countdown}</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeDisplay;
