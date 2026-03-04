import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
} from "react-native";
import { MapPin, Clock, Plus, User, CheckCircle, X } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { auth, firestore } from "../firebase";

export default function TelaInicialAutonomo({}) {
  const navigation = useNavigation();
  const [servicosSolicitados, setServicosSolicitados] = useState([
    {
      id: 1,
      titulo: "Montagem de móvel",
      distancia: "3 km",
      horario: "Hoje, 14:00",
    },
    {
      id: 2,
      titulo: "Conserto elétrico",
      distancia: "5 km",
      horario: "Aguardando confirmação",
    },
  ]);
  const [alertVisivel, setAlertVisivel] = useState(false);
  const [servicoAceito, setServicoAceito] = useState<any>(null);
  const [servicoRejeitado, setServicoRejeitado] = useState<any>(null);

  const servicosDisponiveis = [
    { id: 1, estilo: "Eletricista" },
    { id: 2, estilo: "Diarista" },
    { id: 3, estilo: "Montagem" },
    { id: 4, estilo: "Pintor" },
  ];

    const handleRejeitarServico = async (servico: any) => {
    try {
      const usuarioId = auth.currentUser?.uid;
      if (!usuarioId) {
        Alert.alert("Erro", "Usuário não autenticado");
        return;
      }

        await firestore
        .collection("Servicos")
        .doc(usuarioId)
        .collection("ServicosRejeitados")
        .add({
          titulo: servico.titulo,
          status: "rejeitado",
        });

      // Remover da lista de solicitados
      setServicosSolicitados((prev) => prev.filter((item) => item.id !== servico.id));

      // Mostrar alert estilizado
      setServicoRejeitado(servico);
      setAlertVisivel(true);
    } catch (erro) {
      console.log("Erro ao rejeitar serviço:", erro);
      Alert.alert("Erro", "Não foi possível rejeitar o serviço");
    }
  };

  const handleAceitarServico = async (servico: any) => {
    try {
      const usuarioId = auth.currentUser?.uid;
      if (!usuarioId) {
        Alert.alert("Erro", "Usuário não autenticado");
        return;
      }

      // Salvar no Firebase
      await firestore
        .collection("Servicos")
        .doc(usuarioId)
        .collection("ServicosAgendados")
        .add({
          titulo: servico.titulo,
          distancia: servico.distancia,
          horario: servico.horario,
          status: "agendado",
          dataAceito: new Date(),
        });

      // Remover da lista de solicitados
      setServicosSolicitados((prev) => prev.filter((item) => item.id !== servico.id));

      // Mostrar alert estilizado
      setServicoAceito(servico);
      setAlertVisivel(true);
    } catch (erro) {
      console.log("Erro ao aceitar serviço:", erro);
      Alert.alert("Erro", "Não foi possível aceitar o serviço");
    }
  };

  const handleFecharAlert = () => {
    setAlertVisivel(false);
    setServicoAceito(null);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar} />
          <View>
            <Text style={styles.hello}>Olá, prestador</Text>
            <Text style={styles.welcome}>Seja bem-vindo</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate("PerfilTrabalhador")}>
            <User size={24} />
          </TouchableOpacity>
      </View>


      {/* Serviços Solicitados */}
      <Text style={styles.sectionTitle}>Serviços Solicitados</Text>

      {servicosSolicitados.map((item) => (
        <View key={item.id} style={styles.card}>
          <Text style={styles.cardTitle}>{item.titulo}</Text>

          <View style={styles.row}>
            <MapPin size={18} />
            <Text style={styles.infoText}>{item.distancia}</Text>
          </View>

          <View style={styles.row}>
            <Clock size={18} />
            <Text style={styles.infoText}>{item.horario}</Text>
          </View>

          <View style={styles.buttonsRow}>
            <TouchableOpacity 
              style={styles.acceptButton}
              onPress={() => handleAceitarServico(item)}
            >
              <Text style={styles.buttonText}>Aceitar</Text>
            </TouchableOpacity>

            <TouchableOpacity 
            style={styles.rejectButton}
            onPress={() => handleRejeitarServico(item)}
            >
              <Text style={styles.rejectText}>Recusar</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {/* Serviços Disponíveis */}
      <Text style={styles.sectionTitle}>Serviços Disponíveis</Text>

      <View style={styles.grid}>
        {servicosDisponiveis.map((serv) => (
          <View key={serv.id} style={styles.gridItem}>
            <Text style={styles.gridText}>{serv.estilo}</Text>
          </View>
        ))}
      </View>

      {/* Botão Flutuante */}
      <TouchableOpacity style={styles.floatingButton}>
        <Plus size={30} color="#fff" />
      </TouchableOpacity>

      {/* Alert Estilizado */}
      <Modal
        visible={alertVisivel}
        transparent={true}
        animationType="fade"
        onRequestClose={handleFecharAlert}
      >
        <View style={styles.alertOverlay}>
          <View style={styles.alertContainer}>
            <View style={styles.alertIconContainer}>
              <CheckCircle size={60} color="#4CAF50" />
            </View>
            <Text style={styles.alertTitle}>Serviço Aceito!</Text>
            <Text style={styles.alertMessage}>
              "{servicoAceito?.titulo}" foi adicionado aos seus serviços agendados
            </Text>
            
            <View style={styles.alertButtonsRow}>
              <TouchableOpacity
                style={styles.alertButton}
                onPress={() => {
                  handleFecharAlert();
                  navigation.navigate("ServicosAgendados");
                }}
              >
                <Text style={styles.alertButtonText}>Ver Agendados</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.alertButtonSecondary}
                onPress={handleFecharAlert}
              >
                <Text style={styles.alertButtonSecondaryText}>Continuar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingBottom: 80,
    backgroundColor: "#fff",
  },

  /* HEADER */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ccc",
    marginRight: 10,
    marginTop:40
  },

  hello: {
    fontSize: 14,
    color: "#666",
    marginTop:40
  },

  welcome: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },

  iconButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: "#f1f1f1",
    marginTop:40
  },

  /* SEÇÕES */
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginVertical: 12,
    color: "#333",
  },

  /* CARD */
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },

  infoText: {
    marginLeft: 6,
    color: "#555",
    fontSize: 14,
  },

  buttonsRow: {
    flexDirection: "row",
    marginTop: 12,
    gap: 10,
  },

  acceptButton: {
    flex: 1,
    backgroundColor: "#1e90ff",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },

  rejectButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#1e90ff",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },

  rejectText: {
    color: "#1e90ff",
    fontWeight: "600",
    fontSize: 14,
  },

  /* GRID */
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  gridItem: {
    width: "48%",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
    alignItems: "center",
  },

  gridText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },

  /* BOTÃO FLUTUANTE */
  floatingButton: {
    position: "absolute",
    right: 16,
    bottom: 16,
    backgroundColor: "#1e90ff",
    padding: 18,
    borderRadius: 40,
    elevation: 6,
  },

  /* ALERT ESTILIZADO */
  alertOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  alertContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    width: "85%",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },

  alertIconContainer: {
    marginBottom: 16,
  },

  alertTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },

  alertMessage: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },

  alertButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: 10,
  },

  alertButton: {
    flex: 1,
    backgroundColor: "#1e90ff",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },

  alertButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },

  alertButtonSecondary: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },

  alertButtonSecondaryText: {
    color: "#1e90ff",
    fontWeight: "600",
    fontSize: 14,
  },
});