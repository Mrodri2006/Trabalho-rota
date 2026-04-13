import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRides } from '../hooks/useRides';
import { filterByPeriod } from '../utils/dateRanges';
import { sumNet } from '../utils/rideMath';
import { formatCurrency } from '../utils/format';

const GOAL_KEY = 'driverGoals:monthlyTarget';

export default function DriverGoals() {
  const { rides } = useRides();
  const [targetText, setTargetText] = useState('5000');
  const [target, setTarget] = useState(5000);
  const [message, setMessage] = useState('Defina sua meta mensal abaixo.');

  useEffect(() => {
    const loadTarget = async () => {
      const stored = await AsyncStorage.getItem(GOAL_KEY);
      if (stored) {
        setTargetText(stored);
        setTarget(Number(stored) || 5000);
        setMessage('Meta carregada com sucesso.');
      }
    };
    loadTarget();
  }, []);

  const netThisMonth = useMemo(() => {
    return sumNet(filterByPeriod(rides, 'month'));
  }, [rides]);

  const progress = target > 0 ? Math.min(netThisMonth / target, 1) : 0;
  const progressPercent = Math.round(progress * 100);
  const leftToGoal = target - netThisMonth;

  const handleSaveTarget = async () => {
    const numeric = Number(targetText.replace(',', '.'));
    if (!numeric || numeric <= 0) {
      alert('Informe uma meta válida maior que zero.');
      return;
    }

    await AsyncStorage.setItem(GOAL_KEY, numeric.toString());
    setTarget(numeric);
    setMessage('Meta salva!');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <Text style={styles.heading}>Metas mensais</Text>
        <Text style={styles.subtitle}>Acompanhe seu progresso e ajuste sua meta de lucro.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Sua meta para o mês</Text>
        <TextInput
          value={targetText}
          onChangeText={setTargetText}
          keyboardType='numeric'
          placeholder='Ex: 5000'
          placeholderTextColor='#94A3B8'
          style={styles.input}
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSaveTarget}>
          <Text style={styles.saveButtonText}>Salvar meta</Text>
        </TouchableOpacity>

        <View style={styles.progressCard}>
          <Text style={styles.progressLabel}>Lucro acumulado</Text>
          <Text style={styles.progressValue}>{formatCurrency(netThisMonth)}</Text>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
          <Text style={styles.progressText}>{progressPercent}% da meta alcançada</Text>
          <Text style={styles.goalText}>
            {leftToGoal > 0
              ? `Faltam ${formatCurrency(leftToGoal)} para atingir a meta.`
              : 'Meta alcançada! Continue assim.'}
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Meta</Text>
            <Text style={styles.statValue}>{formatCurrency(target)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Lucro</Text>
            <Text style={styles.statValue}>{formatCurrency(netThisMonth)}</Text>
          </View>
        </View>

        <Text style={styles.helpText}>{message}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EAF1FF',
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  headerCard: {
    marginBottom: 16,
    padding: 22,
    borderRadius: 24,
    backgroundColor: '#1D4ED8',
    shadowColor: '#0F172A',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#DBEAFE',
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#1F2937',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 14,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    color: '#0F172A',
    marginBottom: 14,
  },
  saveButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  progressCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  progressLabel: {
    fontSize: 12,
    color: '#475569',
  },
  progressValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 8,
    marginBottom: 14,
  },
  progressBarBackground: {
    height: 12,
    width: '100%',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 12,
  },
  progressText: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 6,
  },
  goalText: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 8,
  },
  helpText: {
    fontSize: 13,
    color: '#64748B',
  },
});
