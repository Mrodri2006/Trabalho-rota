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
        <View>
          <Text style={styles.title}>Minhas Corridas</Text>
          <Text style={styles.subtitle}>Registre e acompanhe seu lucro por km</Text>
        </View><View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('DriverDashboard')}
          >
            <Text style={styles.secondaryButtonText}>Dashboard</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Sair</Text>
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
                {formatNumber(ride.distanceKm)} km • {formatCurrency(ride.gross)}
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
  background: '#F5F7FB',
  card: '#FFFFFF',
  text: '#0F172A',
  muted: '#64748B',
  soft: '#E2E8F0',
  softAlt: '#F1F5F9',
  primary: '#1C7ED6',
  primaryDark: '#0B4F9F',
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
    alignItems: 'flex-start',
    marginTop: 14,
    marginBottom: 20,
    gap: 12,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 6,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 22,
    padding: 18,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    flex: 1,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.softAlt,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: '#E5EAF1',
  },
  dateButton: {
    backgroundColor: COLORS.soft,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  dateButtonText: {
    color: COLORS.muted,
    fontSize: 13,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#F8FAFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5EEFF',
  },
  metricLabel: {
    fontSize: 12,
    color: COLORS.muted,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 6,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: COLORS.primaryDark,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryButton: {
    backgroundColor: COLORS.soft,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  secondaryButtonText: {
    color: COLORS.text,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#FFE8E8',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  logoutText: {
    color: '#C2413B',
    fontWeight: '700',
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
    borderColor: '#EDF2F7',
  },
  summaryLabel: {
    fontSize: 11,
    color: COLORS.muted,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 4,
  },
  dailyTotals: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  dailyCard: {
    flex: 1,
    backgroundColor: '#F8FAFF',
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  listActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resetButton: {
    backgroundColor: '#FFE8E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  resetText: {
    color: '#C2413B',
    fontWeight: '700',
  },
  linkText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  emptyText: {
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 12,
  },
  rideCard: {
    backgroundColor: COLORS.card,
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  rideTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  rideSubtitle: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 4,
  },
  rideValues: {
    alignItems: 'flex-end',
  },
  rideNet: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  ridePerKm: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 4,
  },
});



