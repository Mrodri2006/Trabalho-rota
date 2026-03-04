import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { ArrowLeft, MapPin, Clock, CheckCircle, X } from "lucide-react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useState, useCallback } from "react";
import { auth, firestore } from "../firebase";
import styles from "../estilo";

export default function ServicosAgendados() {
  const navigation = useNavigation();
  const [servicosAgendados, setServicosAgendados] = useState([]);
  const [carregando, setCarregando] = useState(true);

  // Carregar serviços agendados do Firebase
  useFocusEffect(
    useCallback(() => {
      carregarServicosAgendados();
    }, [])
  );

  const carregarServicosAgendados = async () => {
    try {
      const usuarioId = auth.currentUser?.uid;
      if (!usuarioId) return;

      const docSnap = await firestore
        .collection("Servicos")
        .doc(usuarioId)
        .collection("ServicosAgendados")
        .get();

      const servicos = docSnap.docs.map((doc) => ({
        ...doc.data(),
        firestoreId: doc.id,
      }));

      setServicosAgendados(servicos);
    } catch (erro) {
      console.log("Erro ao carregar serviços agendados:", erro);
    } finally {
      setCarregando(false);
    }
  };

  const handleCancelarServico = async (firestoreId: string, titulo: string) => {
    Alert.alert(
      "Cancelar Serviço",
      `Deseja cancelar o serviço "${titulo}"?`,
      [
        { text: "Cancelar", onPress: () => {}, style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            try {
              const usuarioId = auth.currentUser?.uid;
              if (!usuarioId) return;

              await firestore
                .collection("Servicos")
                .doc(usuarioId)
                .collection("ServicosAgendados")
                .doc(firestoreId)
                .delete();

              setServicosAgendados((prev) =>
                prev.filter((item) => item.firestoreId !== firestoreId)
              );

              Alert.alert("Sucesso", "Serviço cancelado com sucesso!");
            } catch (erro) {
              console.log("Erro ao cancelar serviço:", erro);
              Alert.alert("Erro", "Não foi possível cancelar o serviço");
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={{marginTop:40, marginBottom:4, fontSize: 28, fontWeight: "600", color: "#000"}}>Serviços Agendados</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Conteúdo */}
      {carregando ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Carregando serviços...</Text>
        </View>
      ) : servicosAgendados.length === 0 ? (
        <View style={styles.emptyContainer}>
          <CheckCircle size={64} color="#1e90ff" />
          <Text style={styles.emptyTitle}>Nenhum serviço agendado</Text>
          <Text style={styles.emptyText}>
            Quando você aceitar um serviço, ele aparecerá aqui
          </Text>
        </View>
      ) : (
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>
            Você tem {servicosAgendados.length} serviço
            {servicosAgendados.length !== 1 ? "s" : ""} agendado
            {servicosAgendados.length !== 1 ? "s" : ""}
          </Text>

          {servicosAgendados.map((item) => (
            <View key={item.firestoreId} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.titulo}</Text>
                <View style={styles.statusBadge}>
                  <CheckCircle size={16} color="#fff" />
                  <Text style={styles.statusText}>Agendado</Text>
                </View>
              </View>

              <View style={styles.row}>
                <MapPin size={18} color="#1e90ff" />
                <Text style={styles.infoText}>{item.distancia}</Text>
              </View>

              <View style={styles.row}>
                <Clock size={18} color="#1e90ff" />
                <Text style={styles.infoText}>{item.horario}</Text>
              </View>

              <View style={styles.buttonsRow}>
                <TouchableOpacity
                  style={styles.contatoButton}
                  onPress={() => Alert.alert("Contato", "Funcionalidade em desenvolvimento")}
                >
                  <Text style={styles.buttonText}>Contatar Cliente</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => handleCancelarServico(item.firestoreId, item.titulo)}
                >
                  <X size={18} color="#ff5252" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
