import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BarChart } from 'react-native-chart-kit';
import { useRides } from '../hooks/useRides';
import { averageGainPerKm, formatDateKey, sumCosts, sumGross, sumNet } from '../utils/rideMath';
import { buildDailySeries, filterByPeriod, Period } from '../utils/dateRanges';
import { formatCurrency } from '../utils/format';

const screenWidth = Dimensions.get('window').width - 40;
const chartWidth = screenWidth - 40;

export default function DriverDashboard() {
  const navigation = useNavigation<any>();
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
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#06B6D4" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>Análise dos seus ganhos por período</Text>
        </View>
      </View>

      <View style={styles.tabs}>
        {(['day', 'week'] as Period[]).map((value) => (
          <TouchableOpacity
            key={value}
            style={[styles.tab, period === value && styles.tabActive]}
            onPress={() => setPeriod(value)}
          >
            <Text style={[styles.tabText, period === value && styles.tabTextActive]}>
              {value === 'day' ? 'Dia' : 'Semana'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.quickActions}>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('DriverGoals')}
        >
          <MaterialCommunityIcons name="target" size={20} color="#06B6D4" />
          <Text style={styles.actionButtonText}>Metas</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Evolução do lucro</Text>
        <BarChart
          data={{
            labels: series.labels,
            datasets: [{ data: series.values.length ? series.values : [0] }],
          }}
          width={chartWidth}
          height={240}
          yAxisLabel='R$ '
          yAxisSuffix=''
          chartConfig={chartConfig}
          style={styles.chart}
          fromZero
          showBarTops
          withInnerLines={false}
          verticalLabelRotation={-20}
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
  backgroundGradientFrom: '#1E293B',
  backgroundGradientTo: '#1E293B',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(6, 182, 212, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
  fillShadowGradient: '#06B6D4',
  fillShadowGradientOpacity: 0.5,
  barPercentage: 0.6,
  propsForBackgroundLines: {
    strokeDasharray: '',
    stroke: 'rgba(6, 182, 212, 0.1)',
  },
};

const COLORS = {
  background: '#0F172A',
  card: '#1E293B',
  cardLight: '#334155',
  text: '#F1F5F9',
  textDark: '#CBD5E1',
  muted: '#94A3B8',
  primary: '#06B6D4',
  success: '#10B981',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    marginTop: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.muted,
    marginTop: 6,
    fontWeight: '500',
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: COLORS.cardLight,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(6, 182, 212, 0.2)',
  },
  tabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.muted,
    fontWeight: '700',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  tabTextActive: {
    color: COLORS.background,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.2)',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  actionButtonText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.1)',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  chart: {
    borderRadius: 20,
    alignSelf: 'center',
    marginVertical: 8,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    backgroundColor: COLORS.cardLight,
    borderRadius: 18,
    padding: 16,
    borderWidth: 2,
    borderColor: 'rgba(6, 182, 212, 0.2)',
  },
  metricLabel: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primary,
    marginTop: 8,
  },
  insightText: {
    fontSize: 14,
    color: COLORS.muted,
    marginBottom: 12,
    lineHeight: 20,
    fontWeight: '500',
  },
});
