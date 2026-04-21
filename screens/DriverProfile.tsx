import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../firebase';
import { useRides } from '../hooks/useRides';
import { sumNet, sumGross, sumCosts } from '../utils/rideMath';
import { formatCurrency } from '../utils/format';

export default function DriverProfile() {
  const navigation = useNavigation<any>();
  const { rides } = useRides();
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    if (auth.currentUser?.email) {
      setUserEmail(auth.currentUser.email);
    }
  }, []);

  const totalStats = {
    rides: rides.length,
    totalEarnings: sumNet(rides),
    totalGross: sumGross(rides),
    totalCosts: sumCosts(rides),
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          try {
            await auth.signOut();
            navigation.replace('DriverLogin');
          } catch (error) {
            Alert.alert('Erro', 'Falha ao fazer logout');
          }
        },
      },
    ]);
  };

  const handleBackToHome = () => {
    navigation.navigate('DriverHome');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackToHome}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#06B6D4" />
        </TouchableOpacity>
        <Text style={styles.title}>Perfil</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.avatarSection}>
        <View style={styles.avatarCircle}>
          <MaterialCommunityIcons name="account" size={64} color="#06B6D4" />
        </View>
        <Text style={styles.userName}>Motorista</Text>
        <Text style={styles.userEmail}>{userEmail}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Estatísticas Gerais</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <MaterialCommunityIcons name="car" size={24} color="#06B6D4" />
            </View>
            <Text style={styles.statLabel}>Total de Corridas</Text>
            <Text style={styles.statValue}>{totalStats.rides}</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <MaterialCommunityIcons name="cash" size={24} color="#10B981" />
            </View>
            <Text style={styles.statLabel}>Total Ganho</Text>
            <Text style={styles.statValue}>{formatCurrency(totalStats.totalEarnings)}</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <MaterialCommunityIcons name="wallet" size={24} color="#8B5CF6" />
            </View>
            <Text style={styles.statLabel}>Total Bruto</Text>
            <Text style={styles.statValue}>{formatCurrency(totalStats.totalGross)}</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <MaterialCommunityIcons name="cart-off" size={24} color="#F59E0B" />
            </View>
            <Text style={styles.statLabel}>Total Gasto</Text>
            <Text style={styles.statValue}>{formatCurrency(totalStats.totalCosts)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Ações</Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('DriverReports')}
        >
          <MaterialCommunityIcons name="file-chart" size={20} color="#06B6D4" />
          <Text style={styles.actionButtonText}>Ver Relatórios Completos</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#06B6D4" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('DriverDashboard')}
        >
          <MaterialCommunityIcons name="chart-box" size={20} color="#06B6D4" />
          <Text style={styles.actionButtonText}>Dashboard</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#06B6D4" />
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <MaterialCommunityIcons name="logout" size={20} color="#FF6B6B" />
          <Text style={styles.logoutButtonText}>Fazer Logout</Text>
        </TouchableOpacity>
      </View>
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
  primary: '#06B6D4',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
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
    marginBottom: 28,
    marginTop: 8,
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
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -0.5,
    flex: 1,
    textAlign: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.primary,
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 6,
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.muted,
    fontWeight: '600',
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: COLORS.cardLight,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.2)',
    alignItems: 'center',
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.muted,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
    textAlign: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 12,
    backgroundColor: COLORS.cardLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.2)',
    gap: 12,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.danger,
    gap: 12,
  },
  logoutButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: '#FF6B6B',
  },
});
