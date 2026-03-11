import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { ArrowLeft, MapPin, Star, Clock } from "lucide-react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useState, useCallback } from "react";
import { firestore } from "../firebase";

export default function NovosPrestadores() {
  const navigation = useNavigation();
  const [usuariosPrestadores, setUsuariosPrestadores] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      buscarNovosPrestadores();
    }, [])
  );

  const buscarNovosPrestadores = async () => {
    setCarregando(true);
    try {
      const users = await firestore
        .collection("Usuario")
        .get();

      const prestadores = [];

      for (const userDoc of users.docs) {
        const userData = userDoc.data();
        
        // Filtrar apenas prestadores
        if (userData.tipo === "prestador") {
          prestadores.push({
            id: userDoc.id,
            nome: userData.nome || "Sem nome",
            email: userData.email || "",
            profissao: userData.profissao || "Geral",
            avaliacao: userData.avaliacao || 4.5,
            distancia: userData.distancia || "A calcular",
            telefone: userData.fone || "Não informado",
            criadoEm: userData.criadoEm,
          });
        }
      }

      // Ordenar por data de criação (mais recentes primeiro)
      prestadores.sort((a, b) => {
        const dateA = a.criadoEm?.toDate?.() || new Date(0);
        const dateB = b.criadoEm?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });

      setUsuariosPrestadores(prestadores);
      setCarregando(false);
    } catch (erro) {
      console.error("Erro ao buscar prestadores:", erro);
      setCarregando(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color="#005362" />
        </TouchableOpacity>
        <Text style={{marginTop:40, marginBottom:4, fontSize: 28, fontWeight: "600", color: "#000"}}>Novos Prestadores</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.infoSection}>
        <Clock size={18} color="#005362" />
        <Text style={styles.infoText}>
          Confira os trabalhadores recentemente cadastrados
        </Text>
      </View>

      {carregando ? (
        <View style={styles.carregandoContainer}>
          <ActivityIndicator size="large" color="#005362" />
          <Text style={styles.carregandoTexto}>Carregando prestadores...</Text>
        </View>
      ) : usuariosPrestadores.length > 0 ? (
        <View style={styles.prestadoresList}>
          {usuariosPrestadores.map((prestador) => (
            <TouchableOpacity
              key={prestador.id}
              style={styles.prestadorCard}
              activeOpacity={0.7}
            >
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                  {prestador.nome.charAt(0).toUpperCase()}
                </Text>
              </View>

              <View style={styles.infoContainer}>
                <View style={styles.topRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.nomePrestador}>{prestador.nome}</Text>
                    <View style={styles.profissaoBadge}>
                      <Text style={styles.profissaoTexto}>{prestador.profissao}</Text>
                    </View>
                  </View>
                  <View style={styles.badgeNovo}>
                    <Text style={styles.badgeNovoTexto}>NOVO</Text>
                  </View>
                </View>

                <View style={styles.detalhesRow}>
                  <View style={styles.detalheItem}>
                    <Star size={14} color="#FFD700" fill="#FFD700" />
                    <Text style={styles.detalheTexto}>
                      {prestador.avaliacao.toFixed(1)}
                    </Text>
                  </View>

                  <View style={styles.detalheItem}>
                    <MapPin size={14} color="#005362" />
                    <Text style={styles.detalheTexto}>{prestador.distancia}</Text>
                  </View>
                </View>

                <Text style={styles.emailTexto}>{prestador.email}</Text>
              </View>

              <TouchableOpacity style={styles.botaoChamar} activeOpacity={0.8}>
                <Text style={styles.botaoTxt}>Chamar</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.nenhumContainer}>
          <Text style={styles.nenhumResultado}>
            Nenhum prestador encontrado
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  titulo: {
    fontSize: 24,
    fontWeight: "700",
    color: "#005362",
  },
  infoSection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f8fa",
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    gap: 10,
  },
  infoText: {
    fontSize: 14,
    color: "#005362",
    fontWeight: "500",
    flex: 1,
  },
  prestadoresList: {
    paddingBottom: 20,
  },
  prestadorCard: {
    flexDirection: "row",
    backgroundColor: "#f9f9f9",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: "#527954",
    alignItems: "flex-start",
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#527954",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },
  infoContainer: {
    flex: 1,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  nomePrestador: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
  },
  profissaoBadge: {
    backgroundColor: "#527954",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  profissaoTexto: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  badgeNovo: {
    backgroundColor: "#527954",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  badgeNovoTexto: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  detalhesRow: {
    flexDirection: "row",
    gap: 12,
    marginVertical: 8,
  },
  detalheItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detalheTexto: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  emailTexto: {
    fontSize: 12,
    color: "#999",
    marginTop: 6,
  },
  botaoChamar: {
    backgroundColor: "#527954",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    elevation: 3,
    marginLeft: 8,
  },
  botaoTxt: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },
  carregandoContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 60,
  },
  carregandoTexto: {
    fontSize: 14,
    color: "#666",
    marginTop: 12,
  },
  nenhumContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 60,
  },
  nenhumResultado: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
});
