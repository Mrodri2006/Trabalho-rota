import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { useRides } from '../hooks/useRides';
import { averageGainPerKm, formatDateKey, sumCosts, sumGross, sumNet } from '../utils/rideMath';
import { buildDailySeries, filterByPeriod, Period } from '../utils/dateRanges';
import { formatCurrency } from '../utils/format';

const screenWidth = Dimensions.get('window').width - 40;

export default function DriverDashboard() {
  const { rides } = useRides();
  const [period, setPeriod] = useState<Period>('week');

  const filtered = useMemo(() => filterByPeriod(rides, period), [rides, period]);
  const series = useMemo(() => buildDailySeries(filtered, period), [filtered, period]);

  const totals = useMemo(() => {
    const gross = sumGross(filtered);
    const costs = sumCosts(filtered);
    const net = sumNet(filtered);
    return { gross, costs, net };
  }, [filtered]);

  const avgPerKm = averageGainPerKm(filtered);

  const insights = useMemo(() => {
    if (filtered.length === 0) {
      return {
        bestDay: 'Ainda sem dados suficientes',
        costRate: '0%',
      };
    }

    const map = new Map<string, number>();
    filtered.forEach((ride) => {
      const key = formatDateKey(new Date(ride.dateISO));
      const current = map.get(key) ?? 0;
      map.set(key, current + (ride.gross - ride.costs));
    });

    let bestKey = '';
    let bestValue = -Infinity;
    map.forEach((value, key) => {
      if (value > bestValue) {
        bestValue = value;
        bestKey = key;
      }
    });

    const [year, month, day] = bestKey.split('-');
    const bestDay = bestKey
      ? `${day}/${month}/${year} (${formatCurrency(bestValue)})`
      : 'Ainda sem dados suficientes';

    const costRate = totals.gross > 0 ? `${Math.round((totals.costs / totals.gross) * 100)}%` : '0%';

    return { bestDay, costRate };
  }, [filtered, totals.costs, totals.gross]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>Análise dos seus ganhos por período</Text>
      </View>

      <View style={styles.tabs}>
        {(['day', 'week', 'month'] as Period[]).map((value) => (
          <TouchableOpacity
            key={value}
            style={[styles.tab, period === value && styles.tabActive]}
            onPress={() => setPeriod(value)}
          >
            <Text style={[styles.tabText, period === value && styles.tabTextActive]}>
              {value === 'day' ? 'Dia' : value === 'week' ? 'Semana' : 'Mês'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Evolução do lucro</Text>
        <LineChart
          data={{
            labels: series.labels,
            datasets: [{ data: series.values.length ? series.values : [0] }],
          }}
          width={screenWidth}
          height={220}
          yAxisLabel='R$ '
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Lucro no período</Text>
          <Text style={styles.metricValue}>{formatCurrency(totals.net)}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Média por km</Text>
          <Text style={styles.metricValue}>{formatCurrency(avgPerKm)}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Insights automáticos</Text>
        <Text style={styles.insightText}>Seu melhor dia de lucro foi {insights.bestDay}.</Text>
        <Text style={styles.insightText}>
          Seu ganho médio por km é {formatCurrency(avgPerKm)}.
        </Text>
        <Text style={styles.insightText}>
          Você gastou {insights.costRate} dos ganhos com custos.
        </Text>
      </View>
    </ScrollView>
  );
}

const chartConfig = {
  backgroundGradientFrom: '#FFFFFF',
  backgroundGradientTo: '#FFFFFF',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(28, 126, 214, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(71, 85, 105, ${opacity})`,
  propsForDots: {
    r: '4',
    strokeWidth: '2',
    stroke: '#1C7ED6',
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FA',
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#1C7ED6',
  },
  tabText: {
    color: '#334155',
    fontWeight: '600',
    fontSize: 13,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#1F2937',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  chart: {
    borderRadius: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  metricLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 6,
  },
  insightText: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 6,
  },
});
