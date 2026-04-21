import { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useRides } from '../hooks/useRides';
import { Ride } from '../storage/rideStorage';
import { formatCurrency, formatNumber } from '../utils/format';
import { gainPerKm, netProfit, sumCosts, sumGross, sumNet } from '../utils/rideMath';
import { filterByPeriod } from '../utils/dateRanges';
import { auth } from '../firebase';
import { clearProfile } from '../storage/profileStorage';
import { clearRides } from '../storage/rideStorage';
import { deleteAllRidesFromCloud } from '../services/backup';

export default function DriverHome() {
  const navigation = useNavigation<any>();
  const { rides, createRide, userId, replaceRides } = useRides();
  const [distanceKm, setDistanceKm] = useState('');
  const [gross, setGross] = useState('');
  const [costs, setCosts] = useState('');
  const [date, setDate] = useState(new Date());
  const [pickerVisible, setPickerVisible] = useState(false);

  const parsedDistance = Number(distanceKm) || 0;
  const parsedGross = Number(gross) || 0;
  const parsedCosts = Number(costs) || 0;

  const previewRide: Ride = {
    id: 'preview',
    distanceKm: parsedDistance,
    gross: parsedGross,
    costs: parsedCosts,
    dateISO: date.toISOString(),
  };

  const totals = useMemo(() => {
    const dayRides = filterByPeriod(rides, 'day');
    const today = sumNet(dayRides);
    const week = sumNet(filterByPeriod(rides, 'week'));
    const month = sumNet(filterByPeriod(rides, 'month'));
    const todayGross = sumGross(dayRides);
    const todayCosts = sumCosts(dayRides);
    const todayDistance = dayRides.reduce((total, ride) => total + ride.distanceKm, 0);
    return { today, week, month, todayGross, todayCosts, todayDistance };
  }, [rides]);

  const handleSave = async () => {
    if (parsedDistance <= 0 || parsedGross <= 0) {
      alert('Informe distancia e valor recebido.');
      return;
    }

    const newRide: Ride = {
      id: `${Date.now()}`,
      distanceKm: parsedDistance,
      gross: parsedGross,
      costs: parsedCosts,
      dateISO: date.toISOString(),
    };

    await createRide(newRide);
    setDistanceKm('');
    setGross('');
    setCosts('');
    setDate(new Date());
  };

  const handleLogout = async () => {
    try {
      if (userId && userId !== 'guest') {
        await clearProfile(userId);
      }
      await auth.signOut();
    } catch {
      // segue para tela de login mesmo se algo falhar.
    } finally {
      navigation.replace('DriverLogin');
    }
  };

  const handleResetData = async () => {
    const confirm = globalThis.confirm
      ? globalThis.confirm('Tem certeza que deseja zerar todas as corridas?')
      : true;

    if (!confirm) return;

    try {
      if (userId && userId !== 'guest') {
        await deleteAllRidesFromCloud(userId);
      }
    } catch {
      // se falhar no Firestore, ainda zera localmente
    }

    await clearRides(userId);
    await replaceRides([]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>Minhas Corridas</Text>
          <Text style={styles.subtitle}>Registre e acompanhe seu lucro por km</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('DriverProfile')}
          >
            <MaterialCommunityIcons name="account-circle" size={28} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.secondaryButton, styles.dashboardButton]}
            onPress={() => navigation.navigate('DriverDashboard')}
          >
            <MaterialCommunityIcons name="view-dashboard-outline" size={18} color={COLORS.primary} />
            <Text style={styles.secondaryButtonText}>Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View><View style={styles.card}>
        <Text style={styles.cardTitle}>Registrar corrida</Text>
        <View style={styles.inputRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Distancia (km)</Text>
            <TextInput
              value={distanceKm}
              onChangeText={setDistanceKm}
              keyboardType='numeric'
              style={styles.input}
              placeholder='Ex: 12,5'
              placeholderTextColor='#94A3B8'
            />
          </View><View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Valor recebido</Text>
            <TextInput
              value={gross}
              onChangeText={setGross}
              keyboardType='numeric'
              style={styles.input}
              placeholder='R$ 45,00'
              placeholderTextColor='#94A3B8'
            />
          </View>
        </View><View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Custos da corrida</Text>
          <TextInput
            value={costs}
            onChangeText={setCosts}
            keyboardType='numeric'
            style={styles.input}
            placeholder='Combustivel, pedagio, etc.'
            placeholderTextColor='#94A3B8'
          />
        </View>

        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setPickerVisible(true)}
        >
          <Text style={styles.dateButtonText}>
            {date.toLocaleString('pt-BR')}
          </Text>
        </TouchableOpacity>

        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Ganho por km</Text>
            <Text style={styles.metricValue}>
              {formatCurrency(gainPerKm(previewRide))}
            </Text>
          </View><View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Lucro liquido</Text>
            <Text style={styles.metricValue}>
              {formatCurrency(netProfit(previewRide))}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={handleSave}>
          <Text style={styles.primaryButtonText}>Salvar corrida</Text>
        </TouchableOpacity>
      </View><View style={styles.dailyTotals}>
        <View style={styles.dailyCard}>
          <Text style={styles.summaryLabel}>Total do dia</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totals.todayGross)}</Text>
        </View><View style={styles.dailyCard}>
          <Text style={styles.summaryLabel}>Gasto no dia</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totals.todayCosts)}</Text>
        </View><View style={styles.dailyCard}>
          <Text style={styles.summaryLabel}>Km percorridos</Text>
          <Text style={styles.summaryValue}>{formatNumber(totals.todayDistance)} km</Text>
        </View>
      </View><View style={styles.listHeader}>
        <Text style={styles.cardTitle}>Ultimas corridas</Text>
        <View style={styles.listActions}>
          <TouchableOpacity onPress={() => navigation.navigate('DriverReports')}>
            <Text style={styles.linkText}>Relatorios</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.resetButton} onPress={handleResetData}>
            <Text style={styles.resetText}>Zerar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {rides.length === 0 ? (
        <Text style={styles.emptyText}>Nenhuma corrida registrada ainda.</Text>
      ) : (
        rides.slice(0, 6).map((ride) => (
          <View key={ride.id} style={styles.rideCard}>
            <View>
              <Text style={styles.rideTitle}>
                {formatNumber(ride.distanceKm)} km {formatCurrency(ride.gross)}
              </Text>
              <Text style={styles.rideSubtitle}>
                {new Date(ride.dateISO).toLocaleString('pt-BR')}
              </Text>
            </View><View style={styles.rideValues}>
              <Text style={styles.rideNet}>{formatCurrency(netProfit(ride))}</Text>
              <Text style={styles.ridePerKm}>
                {formatCurrency(gainPerKm(ride))} / km
              </Text>
            </View>
          </View>
        ))
      )}

      <DateTimePickerModal
        isVisible={pickerVisible}
        mode='datetime'
        date={date}
        onConfirm={(selected) => {
          setPickerVisible(false);
          setDate(selected);
        }}
        onCancel={() => setPickerVisible(false)}
      />
    </ScrollView>
  );
}

const COLORS = {
  background: '#0F172A',
  card: '#1E293B',
  cardLight: '#334155',
  text: '#F1F5F9',
  textDark: '#CBD5E1',
  muted: '#94A3B8',
  soft: '#475569',
  softAlt: '#1E293B',
  primary: '#06B6D4',
  primaryDark: '#0891B2',
  secondary: '#8B5CF6',
  success: '#10B981',
  danger: '#EF4444',
  accent: '#F59E0B',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 14,
    marginBottom: 28,
    gap: 12,
  },
  headerInfo: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 220,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
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
    marginTop: 8,
    fontWeight: '500',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.1)',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    flex: 1,
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    color: COLORS.muted,
    marginBottom: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: COLORS.cardLight,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: COLORS.text,
    borderWidth: 2,
    borderColor: 'rgba(6, 182, 212, 0.2)',
    fontSize: 15,
    fontWeight: '600',
  },
  dateButton: {
    backgroundColor: COLORS.cardLight,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 18,
    borderWidth: 2,
    borderColor: 'rgba(6, 182, 212, 0.2)',
  },
  dateButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  metricCard: {
    flex: 1,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 2,
    borderColor: 'rgba(6, 182, 212, 0.3)',
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
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryButtonText: {
    color: COLORS.background,
    fontWeight: '800',
    fontSize: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    backgroundColor: COLORS.cardLight,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dashboardButton: {
    shadowColor: COLORS.primary,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  logoutButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.danger,
  },
  logoutText: {
    color: '#FF6B6B',
    fontWeight: '700',
    fontSize: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.1)',
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 6,
  },
  dailyTotals: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  dailyCard: {
    flex: 1,
    backgroundColor: COLORS.cardLight,
    padding: 16,
    borderRadius: 18,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(6, 182, 212, 0.2)',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  listActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resetButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.danger,
  },
  resetText: {
    color: '#FF6B6B',
    fontWeight: '700',
    fontSize: 13,
  },
  linkText: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  emptyText: {
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 24,
    fontSize: 15,
    fontWeight: '500',
  },
  rideCard: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.1)',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  rideTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  rideSubtitle: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 6,
    fontWeight: '500',
  },
  rideValues: {
    alignItems: 'flex-end',
  },
  rideNet: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
  },
  ridePerKm: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 4,
    fontWeight: '600',
  },
});



