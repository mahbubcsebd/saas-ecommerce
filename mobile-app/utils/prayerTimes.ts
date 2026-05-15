import { Coordinates, CalculationMethod, PrayerTimes, Madhab } from 'adhan';
import dayjs from 'dayjs';
import AsyncStorage from '@react-native-async-storage/async-storage';

// The 64 Districts of Bangladesh
export const BD_ZONES = [
  { id: 'dhaka', name: 'ঢাকা', latitude: 23.8103, longitude: 90.4125 },
  { id: 'faridpur', name: 'ফরিদপুর', latitude: 23.6071, longitude: 89.8429 },
  { id: 'gazipur', name: 'গাজীপুর', latitude: 24.0023, longitude: 90.4264 },
  { id: 'gopalganj', name: 'গোপালগঞ্জ', latitude: 23.0051, longitude: 89.8266 },
  { id: 'jamalpur', name: 'জামালপুর', latitude: 24.9375, longitude: 89.9378 },
  { id: 'kishoreganj', name: 'কিশোরগঞ্জ', latitude: 24.4331, longitude: 90.7783 },
  { id: 'madaripur', name: 'মাদারীপুর', latitude: 23.1641, longitude: 90.1897 },
  { id: 'manikganj', name: 'মানিকগঞ্জ', latitude: 23.8644, longitude: 90.0047 },
  { id: 'munshiganj', name: 'মুন্সিগঞ্জ', latitude: 23.4981, longitude: 90.4127 },
  { id: 'mymensingh', name: 'ময়মনসিংহ', latitude: 24.7471, longitude: 90.4203 },
  { id: 'narayanganj', name: 'নারায়ণগঞ্জ', latitude: 23.6337, longitude: 90.5000 },
  { id: 'narsingdi', name: 'নরসিংদী', latitude: 23.9322, longitude: 90.7154 },
  { id: 'netrokona', name: 'নেত্রকোনা', latitude: 24.8710, longitude: 90.7272 },
  { id: 'rajbari', name: 'রাজবাড়ী', latitude: 23.7574, longitude: 89.6445 },
  { id: 'shariatpur', name: 'শরীয়তপুর', latitude: 23.2423, longitude: 90.4348 },
  { id: 'sherpur', name: 'শেরপুর', latitude: 25.0205, longitude: 90.0153 },
  { id: 'tangail', name: 'টাঙ্গাইল', latitude: 24.2513, longitude: 89.9167 },
  { id: 'bogra', name: 'বগুড়া', latitude: 24.8465, longitude: 89.3778 },
  { id: 'joypurhat', name: 'জয়পুরহাট', latitude: 25.0968, longitude: 89.0227 },
  { id: 'naogaon', name: 'নওগাঁ', latitude: 24.7936, longitude: 88.9318 },
  { id: 'natore', name: 'নাটোর', latitude: 24.4206, longitude: 89.0006 },
  { id: 'nawabganj', name: 'নবাবগঞ্জ', latitude: 24.5965, longitude: 88.2775 },
  { id: 'pabna', name: 'পাবনা', latitude: 24.0049, longitude: 89.2501 },
  { id: 'rajshahi', name: 'রাজশাহী', latitude: 24.3636, longitude: 88.6241 },
  { id: 'sirajgonj', name: 'সিরাজগঞ্জ', latitude: 24.4534, longitude: 89.7007 },
  { id: 'dinajpur', name: 'দিনাজপুর', latitude: 25.6217, longitude: 88.6355 },
  { id: 'gaibandha', name: 'গাইবান্ধা', latitude: 25.3288, longitude: 89.5281 },
  { id: 'kurigram', name: 'কুড়িগ্রাম', latitude: 25.8054, longitude: 89.6362 },
  { id: 'lalmonirhat', name: 'লালমনিরহাট', latitude: 25.9923, longitude: 89.2847 },
  { id: 'nilphamari', name: 'নীলফামারী', latitude: 25.9318, longitude: 88.8400 },
  { id: 'panchagarh', name: 'পঞ্চগড়', latitude: 26.3411, longitude: 88.5542 },
  { id: 'rangpur', name: 'রংপুর', latitude: 25.7439, longitude: 89.2752 },
  { id: 'thakurgaon', name: 'ঠাকুরগাঁও', latitude: 26.0337, longitude: 88.4617 },
  { id: 'habiganj', name: 'হবিগঞ্জ', latitude: 24.3749, longitude: 91.4155 },
  { id: 'maulvibazar', name: 'মৌলভীবাজার', latitude: 24.4830, longitude: 91.7685 },
  { id: 'sunamganj', name: 'সুনামগঞ্জ', latitude: 25.0658, longitude: 91.3950 },
  { id: 'sylhet', name: 'সিলেট', latitude: 24.8949, longitude: 91.8687 },
  { id: 'bagerhat', name: 'বাগেরহাট', latitude: 22.6516, longitude: 89.7859 },
  { id: 'chuadanga', name: 'চুয়াডাঙ্গা', latitude: 23.6402, longitude: 88.8418 },
  { id: 'jessore', name: 'যশোর', latitude: 23.1664, longitude: 89.2081 },
  { id: 'jhenaidah', name: 'ঝিনাইদহ', latitude: 23.5448, longitude: 89.1540 },
  { id: 'khulna', name: 'খুলনা', latitude: 22.8456, longitude: 89.5403 },
  { id: 'kushtia', name: 'কুষ্টিয়া', latitude: 23.9013, longitude: 89.1205 },
  { id: 'magura', name: 'মাগুরা', latitude: 23.4873, longitude: 89.4198 },
  { id: 'meherpur', name: 'মেহেরপুর', latitude: 23.7622, longitude: 88.6318 },
  { id: 'narail', name: 'নড়াইল', latitude: 23.1725, longitude: 89.5126 },
  { id: 'satkhira', name: 'সাতক্ষীরা', latitude: 22.7185, longitude: 89.0705 },
  { id: 'bandarban', name: 'বান্দরবান', latitude: 22.1953, longitude: 92.2251 },
  { id: 'brahmanbaria', name: 'ব্রাহ্মণবাড়িয়া', latitude: 23.9571, longitude: 91.1119 },
  { id: 'chandpur', name: 'চাঁদপুর', latitude: 23.2333, longitude: 90.6667 },
  { id: 'chittagong', name: 'চট্টগ্রাম', latitude: 22.3569, longitude: 91.7832 },
  { id: 'comilla', name: 'কুমিল্লা', latitude: 23.4683, longitude: 91.1799 },
  { id: 'coxs_bazar', name: 'কক্সবাজার', latitude: 21.4272, longitude: 92.0058 },
  { id: 'feni', name: 'ফেনী', latitude: 23.0159, longitude: 91.3976 },
  { id: 'khagrachari', name: 'খাগড়াছড়ি', latitude: 23.1193, longitude: 91.9847 },
  { id: 'lakshmipur', name: 'লক্ষ্মীপুর', latitude: 22.9425, longitude: 90.8412 },
  { id: 'noakhali', name: 'নোয়াখালী', latitude: 22.8696, longitude: 91.0993 },
  { id: 'rangamati', name: 'রাঙ্গামাটি', latitude: 22.7324, longitude: 92.2985 },
  { id: 'barguna', name: 'বরগুনা', latitude: 22.1534, longitude: 90.1257 },
  { id: 'barisal', name: 'বরিশাল', latitude: 22.7010, longitude: 90.3535 },
  { id: 'bhola', name: 'ভোলা', latitude: 22.6859, longitude: 90.6482 },
  { id: 'jhalokati', name: 'ঝালকাঠি', latitude: 22.6416, longitude: 90.1987 },
  { id: 'patuakhali', name: 'পটুয়াখালী', latitude: 22.3592, longitude: 90.3340 },
  { id: 'pirojpur', name: 'পিরোজপুর', latitude: 22.5841, longitude: 89.9720 },
];

export function toBengaliNumerals(num: string | number) {
  const bnNumerals = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/\d/g, (match) => bnNumerals[parseInt(match, 10)]);
}

export function formatTimeBn(date: Date | null | undefined): string {
  if (!date) return '--:--';
  const time = dayjs(date).format('hh:mm');
  return toBengaliNumerals(time);
}

export function formatTimePeriodBn(date: Date | null | undefined): string {
    if (!date) return '';
    const hour = date.getHours();
    if (hour >= 4 && hour < 12) return 'সকাল';
    if (hour >= 12 && hour < 16) return 'দুপুর';
    if (hour >= 16 && hour < 18) return 'বিকাল';
    if (hour >= 18 && hour < 20) return 'সন্ধ্যা';
    return 'রাত';
}

export async function getDynamicPrayerTimes(locationId: string = 'dhaka', date: Date = new Date()) {
  const zone = BD_ZONES.find((z) => z.id === locationId) || BD_ZONES[0];
  const dateStr = dayjs(date).format('DD-MM-YYYY');
  const cacheKey = `@api_prayer_${locationId}_${dateStr}`;
  
  let timings: any = null;

  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      timings = JSON.parse(cached);
    } else {
      const res = await fetch(`https://api.aladhan.com/v1/timings/${dateStr}?latitude=${zone.latitude}&longitude=${zone.longitude}&method=1`);
      const json = await res.json();
      if (json.code === 200) {
        timings = json.data.timings;
        await AsyncStorage.setItem(cacheKey, JSON.stringify(timings));
      }
    }
  } catch (e) {
    console.error('API Fetch failed', e);
  }

  if (!timings) return null;

  const parseTime = (timeStr: string) => {
     // sometimes API gives "04:45 (BST)", split by space
     const [hourStr, minStr] = timeStr.split(' ')[0].split(':'); 
     return dayjs(date).hour(parseInt(hourStr)).minute(parseInt(minStr)).second(0).toDate();
  };

  const fajr = parseTime(timings.Fajr);
  const sunrise = parseTime(timings.Sunrise);
  const dhuhr = parseTime(timings.Dhuhr);
  const asr = parseTime(timings.Asr);
  const sunset = parseTime(timings.Sunset);
  const maghrib = parseTime(timings.Maghrib);
  const isha = parseTime(timings.Isha);

  const now = new Date();
  const nowMs = now.getTime();

  const periods = [
    { id: 'fajr', start: fajr.getTime(), end: sunrise.getTime(), name: 'ফজর' },
    { id: 'duha', start: sunrise.getTime(), end: dhuhr.getTime(), name: 'দুহা' },
    { id: 'dhuhr', start: dhuhr.getTime(), end: asr.getTime(), name: 'যোহর' },
    { id: 'asr', start: asr.getTime(), end: sunset.getTime(), name: 'আসর' },
    { id: 'maghrib', start: maghrib.getTime(), end: isha.getTime(), name: 'মাগরিব' },
    { id: 'isha', start: isha.getTime(), end: fajr.getTime() + 86400000, name: 'ইশা' },
  ];

  let currentTitle = 'তাহাজ্জুদ';
  let targetTime = fajr.getTime();
  let countdownLabel = 'ফজর শুরু হতে বাকি';

  for (const p of periods) {
    if (nowMs >= p.start && nowMs < p.end) {
      currentTitle = p.name;
      targetTime = p.end;
      if (p.id === 'duha') {
        countdownLabel = 'যোহর শুরু হতে বাকি';
      } else {
        countdownLabel = 'শেষ হতে বাকি';
      }
      break;
    }
  }

  return {
    fajr, sunrise, dhuhr, asr, sunset, maghrib, isha,
    sehriEnd: dayjs(fajr).subtract(1, 'minute').toDate(), 
    prohibited: {
      sunrise: { start: sunrise, end: dayjs(sunrise).add(15, 'minute').toDate() },
      zawaal: { start: dayjs(dhuhr).subtract(15, 'minute').toDate(), end: dhuhr },
      sunset: { start: dayjs(sunset).subtract(15, 'minute').toDate(), end: sunset }
    },
    currentTitle,
    targetTime: new Date(targetTime),
    countdownLabel,
  };
}

export function getPrayerTimes(locationId: string = 'dhaka', date: Date = new Date()) {
  const zone = BD_ZONES.find((z) => z.id === locationId) || BD_ZONES[0];
  const coords = new Coordinates(zone.latitude, zone.longitude);
  const params = CalculationMethod.Karachi();
  params.madhab = Madhab.Hanafi; 
  
  const prayerTimes = new PrayerTimes(coords, date, params);

  return {
    fajr: prayerTimes.fajr,
    sunrise: prayerTimes.sunrise,
    dhuhr: prayerTimes.dhuhr,
    asr: prayerTimes.asr,
    sunset: prayerTimes.maghrib,
    maghrib: prayerTimes.maghrib,
    isha: prayerTimes.isha,
    
    // Custom calculations roughly corresponding to Bangladesh standard practices
    sehriEnd: dayjs(prayerTimes.fajr).subtract(1, 'minute').toDate(), 
    
    prohibited: {
      sunrise: {
        start: prayerTimes.sunrise,
        end: dayjs(prayerTimes.sunrise).add(15, 'minute').toDate()
      },
      zawaal: {
        start: dayjs(prayerTimes.dhuhr).subtract(15, 'minute').toDate(),
        end: prayerTimes.dhuhr
      },
      sunset: {
        start: dayjs(prayerTimes.maghrib).subtract(15, 'minute').toDate(),
        end: prayerTimes.maghrib
      }
    },
    
    currentPrayer: prayerTimes.currentPrayer(),
    nextPrayer: prayerTimes.nextPrayer(),
    timeForNextPrayer: prayerTimes.timeForPrayer(prayerTimes.nextPrayer()),
    rawDetails: prayerTimes
  };
}
