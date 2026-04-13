import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../firebase';
import { loadProfile, UserProfile } from '../storage/profileStorage';
import { useRides } from '../hooks/useRides';
import { backupRides } from '../services/backup';
import { formatCurrency } from '../utils/format';
import { sumGross, sumCosts, sumNet } from '../utils/rideMath';

export default function DriverProfile() {
  const navigation = useNavigation<any>();
  const { rides } = useRides();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [backupStatus, setBackupStatus] = useState('Pronto para backup');
  const [userId, setUserId] = useState<string | null>(auth.currentUser?.uid ?? null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      const uid = user?.uid ?? null;
      setUserId(uid);
      if (uid) {
        const stored = await loadProfile(uid);
        setProfile(stored);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleBackup = async () => {
    if (!userId) {
      return alert('Faça login para fazer backup.');
    }

    setBackupStatus('Fazendo backup...');
    try {
      await backupRides(rides, userId);
      setBackupStatus('Backup concluído com sucesso');
    } catch (error: any) {
      setBackupStatus('Erro ao fazer backup');
      alert(error.message ?? 'Falha ao realizar o backup.');
    }
  };

  const currentUser = auth.currentUser;
  const name = profile?.name || currentUser?.displayName || 'Motorista';
  const email = profile?.email || currentUser?.email || 'Não disponível';
  const totalGross = sumGross(rides);
  const totalCosts = sumCosts(rides);
  const totalNet = sumNet(rides);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <Text style={styles.heading}>Seu perfil</Text>
        <Text style={styles.subtitle}>Dados do motorista e controle de backup.</Text>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size='large' color='#2563EB' />
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Informações</Text>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Nome</Text>
            <Text style={styles.fieldValue}>{name}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>E-mail</Text>
            <Text style={styles.fieldValue}>{email}</Text>
          </View>

          <Text style={styles.sectionTitle}>Resumo rápido</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Receita</Text>
              <Text style={styles.statValue}>{formatCurrency(totalGross)}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Custos</Text>
              <Text style={styles.statValue}>{formatCurrency(totalCosts)}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Lucro</Text>
              <Text style={styles.statValue}>{formatCurrency(totalNet)}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.actionButton} onPress={handleBackup}>
            <Text style={styles.actionButtonText}>Fazer backup das corridas</Text>
          </TouchableOpacity>
          <Text style={styles.statusText}>{backupStatus}</Text>
        </View>
      )}
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
  loaderContainer: {
    marginTop: 40,
    alignItems: 'center',
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
  fieldRow: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 6,
  },
  fieldValue: {
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#475569',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 8,
  },
  actionButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    marginBottom: 10,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  statusText: {
    color: '#64748B',
    fontSize: 13,
    marginBottom: 18,
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  quickActionText: {
    color: '#2563EB',
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#F8FAFC',
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#2563EB',
    fontWeight: '700',
  },
});
