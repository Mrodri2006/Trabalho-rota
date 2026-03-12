import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { Search, MapPin, Star, User, Wrench, LogOut, X } from "lucide-react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useState, useCallback } from "react";
import { firestore } from "../firebase";

export default function TelaInicialCliente({ onLogout }: any) {

  const navigation = useNavigation() as any;
  const [searchText, setSearchText] = useState("");
  const [profissionaisRecomendados, setProfissionaisRecomendados] = useState([]);
  const [servicosPopulares, setServicosPopulares] = useState([]);
  const [carregando, setCarregando] = useState(true);

  // Buscar profissionais do Firebase
  useFocusEffect(
    useCallback(() => {
      buscarDadosFirebase();
    }, [])
  );

  const buscarDadosFirebase = async () => {
    setCarregando(true);
    try {
      const users = await firestore.collection("Usuario").get();
      const profissionais = [];
      const servicosUnicos = new Map<string, number>();

      for (const userDoc of users.docs) {
        const userData = userDoc.data();
        
        // Coletar profissões dos prestadores e contar
        if (userData.tipo === "prestador" && userData.profissao) {
          const count = (servicosUnicos.get(userData.profissao) || 0) + 1;
          servicosUnicos.set(userData.profissao, count);
        }
        
        // Verificar se o usuário é trabalhador (tem serviços)
        const servicos = await userDoc.ref.collection("Serv").get();
        
        if (servicos.docs.length > 0) {
          const primeiro = servicos.docs[0].data();
          const profissional = {
            id: userDoc.id,
            nome: userData.nome || "Sem nome",
            avaliacao: userData.avaliacao || 4.5,
            distancia: userData.distancia || "A calcular",
            tipo: primeiro.tipo || "Geral",
            profissao: userData.profissao || primeiro.tipo || "Geral",
          };
          profissionais.push(profissional);
        }
      }

      // Converter Map em Array e criar objetos de serviço com ícones
      const servicosArray = Array.from(servicosUnicos)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map((item, index) => ({
          id: index + 1,
          nome: item[0],
          icon: item[0] === "Diarista" ? <User size={28} /> : <Wrench size={28} />,
          quantidade: item[1],
        }));

      setProfissionaisRecomendados(profissionais);
      setServicosPopulares(servicosArray);
      setCarregando(false);
    } catch (erro) {
      console.error("Erro ao buscar dados:", erro);
      setCarregando(false);
    }
  };

  // Filtrar serviços baseado na pesquisa
  const servicosFiltrados = servicosPopulares.filter((serv) =>
    serv.nome.toLowerCase().includes(searchText.toLowerCase())
  );

  // Filtrar profissionais baseado na pesquisa
  const profissionaisFiltrados = profissionaisRecomendados.filter((pro) =>
    pro.nome.toLowerCase().includes(searchText.toLowerCase())
  );

  // Função para contar profissionais por tipo de serviço
  const contarProfissionaisPorServico = (nomeServico: any) => {
    return servicosPopulares.find(s => s.nome === nomeServico)?.quantidade || 0;
  };

  // Função para navegar aos profissionais do serviço selecionado
  const handleServicoPress = (serv: any) => {
    navigation.navigate("PrestadoresPorServico", { 
      servico: serv.nome,
    });
  };

  // Função para navegar aos detalhes do profissional
  const handleProfissionalPress = (profissional: any) => {
    navigation.navigate("DetalheProfissional", { 
      profissional: profissional,
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Olá!</Text>

        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate("Perfil")}>
            <User size={24} />
          </TouchableOpacity>

        </View>
      </View>

      {/* Barra de busca */}
      <View style={styles.searchBox}>
        <Search size={20} color="#666" />
        <TextInput
          placeholder="Buscar serviços..."
          placeholderTextColor="#777"
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText("")}
          >
            <X size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Serviços Populares */}
      <Text style={styles.sectionTitle}>Serviços Populares</Text>

      {servicosFiltrados.length > 0 ? (
        <View style={styles.grid}>
          {servicosFiltrados.map((serv) => {
            const quantidadeProf = contarProfissionaisPorServico(serv.nome);
            return (
              <TouchableOpacity key={serv.id} style={styles.card} onPress={() => handleServicoPress(serv)}>
                <View style={styles.iconCenter}>{serv.icon}</View>
                <Text style={styles.cardText}>{serv.nome}</Text>
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeTexto}>{quantidadeProf} profissional{quantidadeProf !== 1 ? "is" : ""}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <Text style={styles.nenhumResultado}>Nenhum serviço encontrado</Text>
      )}

      {/* Usuários Recentes */}
      {!carregando && profissionaisFiltrados.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Profissionais Recomendados</Text>
          {profissionaisFiltrados.slice(0, 5).map((prof) => (
            <TouchableOpacity
              key={prof.id}
              style={styles.recomendadoCard}
              activeOpacity={0.7}
              onPress={() => handleProfissionalPress(prof)}
            >
              <View style={styles.avatarRecomendado}>
                <Text style={styles.avatarText}>
                  {prof.nome.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.nomeProf}>{prof.nome}</Text>
                <View style={styles.profissaoBadge}>
                  <Text style={styles.profissaoTexto}>{prof.profissao}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </>
      )}

      {!carregando && (
        <TouchableOpacity
          style={styles.sectionButtonContainer}
          onPress={() => navigation.navigate("NovosPrestadores")}
          activeOpacity={0.7}
        >
          <View style={styles.sectionButtonContent}>
            <Text style={styles.sectionButtonTitle}>Novos Prestadores</Text>
            <Text style={styles.sectionButtonSubtitle}>
              Confira trabalhadores recém cadastrados
            </Text>
          </View>
          <Text style={styles.sectionButtonArrow}>→</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  titulo: {
    fontSize: 22,
    fontWeight: "600",
    color: "#333",
  },

  headerButtons: {
    flexDirection: "row",
    gap: 12,
  },

  iconButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: "#f1f1f1",
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eee",
    padding: 12,
    borderRadius: 16,
    marginVertical: 16,
  },

  searchInput: {
    marginLeft: 10,
    flex: 1,
    fontSize: 14,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  card: {
    width: "48%",
    padding: 16,
    backgroundColor: "#fafafa",
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 12,
    elevation: 2,
  },

  iconCenter: {
    marginBottom: 8,
  },

  cardText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
  },

  recomendadoCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f7f7f7",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: "#527954",
  },

  avatarRecomendado: {
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

  nomeProf: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },

  profissaoBadge: {
    marginTop: 6,
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

  infoLinha: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 6,
  },

  infoTxt: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },

  botaoChamar: {
    backgroundColor: "#527954",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignSelf: "center",
    elevation: 3,
  },

  botaoTxt: {
    color: "#fff",
    fontWeight: "600",
  },

  nenhumResultado: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    marginVertical: 20,
  },

  carregandoContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 40,
  },

  carregandoTexto: {
    fontSize: 14,
    color: "#666",
    marginTop: 12,
  },

  badgeContainer: {
    marginTop: 8,
    backgroundColor: "#000",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: "center",
  },

  badgeTexto: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },

  sectionButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f0f8fa",
    borderRadius: 14,
    padding: 16,
    marginVertical: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#005362",
  },

  sectionButtonContent: {
    flex: 1,
  },

  sectionButtonTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#005362",
    marginBottom: 4,
  },

  sectionButtonSubtitle: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },

  sectionButtonArrow: {
    fontSize: 24,
    color: "#005362",
    fontWeight: "600",
    marginLeft: 12,
  },
});
