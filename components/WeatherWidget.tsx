import { Trip } from '@/app/_layout';
import { Palette } from '@/constants/theme';
import Feather from '@expo/vector-icons/Feather';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

type WeatherData = {
  current_weather: { temperature: number; weathercode: number };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
    weathercode: number[];
  };
};

function wmoIcon(code: number): string {
  if (code === 0) return 'sun';
  if (code <= 3) return 'cloud';
  if (code <= 48) return 'wind';
  if (code <= 67) return 'cloud-rain';
  if (code <= 77) return 'cloud-snow';
  if (code <= 82) return 'cloud-rain';
  if (code <= 86) return 'cloud-snow';
  return 'cloud-lightning';
}

function wmoDesc(code: number): string {
  if (code === 0) return 'Clear';
  if (code <= 3) return 'Partly cloudy';
  if (code <= 48) return 'Foggy';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Showers';
  if (code <= 86) return 'Snow showers';
  return 'Thunderstorm';
}

export default function WeatherWidget({ trip }: { trip: Trip }) {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const isPast = trip.endDate < today;
  const isOngoing = trip.startDate <= today && trip.endDate >= today;
  const daysUntilStart = (new Date(trip.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  const tooFarAway = daysUntilStart > 14;

  useEffect(() => {
    if (!trip.latitude || !trip.longitude || isPast || tooFarAway) return;
    setLoading(true);
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${trip.latitude}&longitude=${trip.longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&current_weather=true&timezone=auto`
    )
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [trip.latitude, trip.longitude]);

  if (!trip.latitude || isPast || tooFarAway) return null;

  const forecastDays = data
    ? data.daily.time
        .map((date, i) => ({ date, i }))
        .filter(({ date }) =>
          isOngoing
            ? date >= today && date <= trip.endDate
            : date >= trip.startDate && date <= trip.endDate
        )
    : [];

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionLabel}>Weather</Text>
        <Text style={styles.location}>{trip.destination}{trip.country ? `, ${trip.country}` : ''}</Text>
      </View>

      {loading && (
        <ActivityIndicator size="small" color={Palette.terracotta} style={{ marginVertical: 10 }} />
      )}

      {!loading && !error && data && isOngoing && (
        <View style={styles.currentRow}>
          <Feather name={wmoIcon(data.current_weather.weathercode) as any} size={20} color={Palette.terracotta} />
          <Text style={styles.currentTemp}>{Math.round(data.current_weather.temperature)}°C</Text>
          <Text style={styles.currentDesc}>{wmoDesc(data.current_weather.weathercode)}</Text>
        </View>
      )}

      {!loading && !error && data && forecastDays.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={isOngoing ? styles.forecastMargin : undefined}
          contentContainerStyle={styles.forecastRow}
        >
          {forecastDays.map(({ date, i }) => {
            const d = new Date(date + 'T12:00:00');
            const dayLabel = d.toLocaleDateString('en', { weekday: 'short' }).slice(0, 3);
            const dateNum = d.getDate();
            const high = Math.round(data.daily.temperature_2m_max[i]);
            const low = Math.round(data.daily.temperature_2m_min[i]);
            const precip = data.daily.precipitation_probability_max[i];
            const code = data.daily.weathercode[i];
            return (
              <View key={date} style={styles.dayCol}>
                <Text style={styles.dayName}>{dayLabel}</Text>
                <Text style={styles.dayDate}>{dateNum}</Text>
                <Feather name={wmoIcon(code) as any} size={16} color={Palette.terracotta} style={styles.dayIcon} />
                <Text style={styles.tempHigh}>{high}°</Text>
                <Text style={styles.tempLow}>{low}°</Text>
                {precip > 10 && <Text style={styles.precip}>{precip}%</Text>}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.cardBackground,
    borderColor: Palette.border,
    borderWidth: 0.5,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionLabel: {
    color: Palette.inkSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  location: {
    color: Palette.inkHint,
    fontSize: 11,
  },
  muted: {
    color: Palette.inkHint,
    fontSize: 12,
    fontStyle: 'italic',
    paddingBottom: 2,
  },
  currentRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 4,
  },
  currentTemp: {
    color: Palette.ink,
    fontSize: 22,
  },
  currentDesc: {
    color: Palette.inkSecondary,
    fontSize: 13,
  },
  forecastMargin: {
    marginTop: 12,
  },
  forecastRow: {
    gap: 4,
    paddingBottom: 2,
  },
  dayCol: {
    alignItems: 'center',
    borderColor: Palette.border,
    borderWidth: 0.5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    width: 54,
  },
  dayName: {
    color: Palette.inkSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  dayDate: {
    color: Palette.inkHint,
    fontSize: 10,
    marginBottom: 4,
    marginTop: 1,
  },
  dayIcon: {
    marginBottom: 4,
  },
  tempHigh: {
    color: Palette.ink,
    fontSize: 12,
    fontWeight: '600',
  },
  tempLow: {
    color: Palette.inkHint,
    fontSize: 11,
  },
  precip: {
    color: Palette.terracotta,
    fontSize: 10,
    marginTop: 2,
  },
});
