import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useRides } from '../hooks/useRides';
import { backupRides } from '../services/backup';
import { filterByPeriod, Period } from '../utils/dateRanges';
import { averageGainPerKm, sumCosts, sumGross, sumNet } from '../utils/rideMath';
import { formatCurrency, formatNumber } from '../utils/format';

export default function DriverReports() {
  const { rides } = useRides();
  const [period, setPeriod] = useState<Period>('month');
  const [exporting, setExporting] = useState(false);
  const [backingUp, setBackingUp] = useState(false);

  const filtered = useMemo(() => filterByPeriod(rides, period), [rides, period]);
  const totals = useMemo(() => {
    return {
      gross: sumGross(filtered),
      costs: sumCosts(filtered),
      net: sumNet(filtered),
      avgPerKm: averageGainPerKm(filtered),
    };
  }, [filtered]);

  const exportPdf = async () => {
    setExporting(true);
    try {
      const html = `
        <html>
          <body style="font-family: Arial, sans-serif; padding: 24px;">
            <h2>Relatário de Ganhos</h2>
            <p>Período: ${period === 'day' ? 'Dia' : period === 'week' ? 'Semana' : 'Mês'}</p>
            <ul>
              <li>Total de ganhos: ${formatCurrency(totals.gross)}</li>
              <li>Total de custos: ${formatCurrency(totals.costs)}</li>
              <li>Lucro líquido: ${formatCurrency(totals.net)}</li>
              <li>Média de ganho por km: ${formatCurrency(totals.avgPerKm)}</li>
              <li>Quantidade de corridas: ${filtered.length}</li>
            </ul>
            <h3>Detalhamento</h3>
            <table style="width:100%; border-collapse: collapse;">
              <thead>
                <tr>
                  <th style="text-align:left; border-bottom:1px solid #ddd;">Data</th>
                  <th style="text-align:left; border-bottom:1px solid #ddd;">Distância</th>
                  <th style="text-align:left; border-bottom:1px solid #ddd;">Recebido</th>
                  <th style="text-align:left; border-bottom:1px solid #ddd;">Custos</th>
                  <th style="text-align:left; border-bottom:1px solid #ddd;">Lucro</th>
                </tr>
              </thead>
              <tbody>
                ${filtered
                  .map(
                    (ride) => `
                      <tr>
                        <td style="padding:6px 0;">${new Date(ride.dateISO).toLocaleString('pt-BR')}</td>
                        <td style="padding:6px 0;">${formatNumber(ride.distanceKm)} km</td>
                        <td style="padding:6px 0;">${formatCurrency(ride.gross)}</td>
                        <td style="padding:6px 0;">${formatCurrency(ride.costs)}</td>
                        <td style="padding:6px 0;">${formatCurrency(ride.gross - ride.costs)}</td>
                      </tr>`
                  )
                  .join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;

      const file = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(file.uri);
    } catch (error: any) {
      alert(error.message ?? 'Erro ao exportar PDF.');
    } finally {
      setExporting(false);
    }
  };

  const handleBackup = async () => {
    setBackingUp(true);
    try {
      await backupRides(rides);
      alert('Backup concluìdo com sucesso!');
    } catch (error: any) {
      alert(error.message ?? 'Erro ao fazer backup.');
    } finally {
      setBackingUp(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Relat�rios</Text>
      <Text style={styles.subtitle}>Exporte seus resultados e mantenha backup na nuvem.</Text>

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
        <Text style={styles.cardTitle}>Resumo do período</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Ganhos</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totals.gross)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Custos</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totals.costs)}</Text>
          </View>
        </View>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Lucro líquido</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totals.net)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Média por km</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totals.avgPerKm)}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={exportPdf} disabled={exporting}>
        <Text style={styles.primaryButtonText}>
          {exporting ? 'Gerando PDF...' : 'Exportar PDF'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={handleBackup} disabled={backingUp}>
        <Text style={styles.secondaryButtonText}>
          {backingUp ? 'Sincronizando...' : 'Backup na nuvem'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FA',
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 6,
    marginBottom: 16,
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
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 6,
  },
  primaryButton: {
    backgroundColor: '#1C7ED6',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5F5',
  },
  secondaryButtonText: {
    color: '#1C7ED6',
    fontWeight: '700',
    fontSize: 15,
  },
});
