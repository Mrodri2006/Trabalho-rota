import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, FlatList, ActivityIndicator } from "react-native";
import { Search, MapPin, Star, ArrowLeft, X, Phone } from "lucide-react-native";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { useState, useCallback } from "react";
import { firestore } from "../firebase";
import styles from "../estilo";

export default function TelaProfissionais() {
  const navigation = useNavigation();
  const route = useRoute();
  const { servico } = route.params || { servico: "" };

  const [searchText, setSearchText] = useState("");
  const [profissionais, setProfissionais] = useState([]);
  const [carregando, setCarregando] = useState(true);

  // Buscar profissionais do Firebase baseado no tipo de serviço
  useFocusEffect(
    useCallback(() => {
      buscarProfissionais();
    }, [servico])
  );

  const buscarProfissionais = async () => {
    setCarregando(true);
    try {
      const querySnapshot = await firestore.collectionGroup("Serv").get();
      const profissionaisEncontrados = [];

      querySnapshot.forEach((doc) => {
        const servicoDados = doc.data();
        
        // Filtrar por tipo de serviço
        if (servicoDados.tipo && servicoDados.tipo.toLowerCase() === servico.toLowerCase()) {
          // Obter dados do usuário/trabalhador
          const userRef = doc.ref.parent.parent;
          
          userRef.get().then((userDoc) => {
            const userData = userDoc.data();
            
            if (userData && userData.nome) {
              const profissional = {
                id: userDoc.id,
                nome: userData.nome,
                avaliacao: userData.avaliacao || 4.5,
                distancia: userData.distancia || "A calcular",
                tipo: servicoDados.tipo,
              };
              
              // Evitar duplicatas
              if (!profissionaisEncontrados.find(p => p.id === profissional.id)) {
                profissionaisEncontrados.push(profissional);
              }
            }
          });
        }
      });

      // Aguardar um pouco para garantir que todos os dados foram carregados
      setTimeout(() => {
        setProfissionais(profissionaisEncontrados);
        setCarregando(false);
      }, 500);
    } catch (erro) {
      console.error("Erro ao buscar profissionais:", erro);
      setCarregando(false);
    }
  };

  // Filtrar profissionais baseado na pesquisa
  const profissionaisFiltrados = profissionais.filter((pro) =>
    pro.nome.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleChamar = (profissional) => {
    alert(`Você solicitou ${profissional.nome} para ${servico}`);
    // Aqui você pode adicionar lógica para fazer uma solicitação real
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header com botão voltar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.titulo}>{servico}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Barra de busca */}
      <View style={styles.searchBox}>
        <Search size={20} color="#666" />
        <TextInput
          placeholder="Buscar profissional..."
          placeholderTextColor="#777"
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText("")}>
            <X size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Resultados */}
      <Text style={styles.resultadoText}>
        {profissionaisFiltrados.length} profissional(is) encontrado(s)
      </Text>

      {/* Indicador de carregamento */}
      {carregando ? (
        <View style={styles.carregandoContainer}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.carregandoTexto}>Carregando profissionais...</Text>
        </View>
      ) : profissionaisFiltrados.length > 0 ? (
        profissionaisFiltrados.map((pro) => (
          <View key={pro.id} style={styles.profissionalCard}>
            <View style={styles.profissionalInfo}>
              <Text style={styles.nomeProfissional}>{pro.nome}</Text>

              <View style={styles.infoLinha}>
                <Star size={16} color="#FFD700" />
                <Text style={styles.infoTexto}>{pro.avaliacao}</Text>
              </View>

              <View style={styles.infoLinha}>
                <MapPin size={16} color="#666" />
                <Text style={styles.infoTexto}>{pro.distancia}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.botaoChamar}
              onPress={() => handleChamar(pro)}
            >
              <Phone size={20} color="#fff" />
              <Text style={styles.botaoTexto}>Chamar</Text>
            </TouchableOpacity>
          </View>
        ))
      ) : (
        <Text style={styles.nenhumResultado}>
          Nenhum profissional encontrado
        </Text>
      )}
    </ScrollView>
  );
}