import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { ArrowLeft, Edit2, Star, MapPin, Phone, Mail, LogOut, Calendar, Briefcase } from "lucide-react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { auth, firestore } from "../firebase";
import styles from "../estilo";
import Aval from "../model/Aval";

export default function PerfilTrabalhador() {
  const navigation = useNavigation();
  const [usuario, setUsuario] = useState({
    nome: "",
    email: "",
    telefone: "",
    profissao: "",
    avaliacao: 4.8,
    numeroAvaliacoes: 45,
    localizacao: "São Paulo, SP",
    descricao: "Profissional com experiência em serviços",
    historico: [
      { id: 1, servico: "Reparo Elétrico", data: "20/11/2024", status: "Concluído", valor: "R$ 150" },
      { id: 2, servico: "Desentupimento", data: "15/11/2024", status: "Concluído", valor: "R$ 200" },
      { id: 3, servico: "Instalação Luminária", data: "10/11/2024", status: "Concluído", valor: "R$ 120" },
    ],
  });

  // Carregar dados do usuário do Firebase
  useFocusEffect(
    useCallback(() => {
      const carregarDadosUsuario = async () => {
        try {
          const usuarioAutenticado = auth.currentUser;
          if (usuarioAutenticado) {
            const docSnap = await firestore.collection("Usuario").doc(usuarioAutenticado.uid).get();
            
            if (docSnap.exists) {
              const dados = docSnap.data();
              setUsuario(prevState => ({
                ...prevState,
                nome: dados.nome || usuarioAutenticado.displayName || "Usuário",
                email: usuarioAutenticado.email || "",
                telefone: dados.fone || "",
                profissao: dados.profissao || "",
              }));
            } else {
              setUsuario(prevState => ({
                ...prevState,
                nome: usuarioAutenticado.displayName || "Usuário",
                email: usuarioAutenticado.email || "",
              }));
            }
          }
        } catch (erro) {
          console.log("Erro ao carregar dados do usuário:", erro);
        }
      };

      carregarDadosUsuario();
    }, [])
  );

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigation.reset({
        index: 0,
        routes: [{ name: "LoginTrabalhador" }],
      });
    } catch (erro) {
      console.log("Erro ao fazer logout:", erro);
    }
  };

  const handleDeletarConta = () => {
    Alert.alert(
      "Deletar Conta",
      "Tem certeza? Esta ação não pode ser desfeita. Todos os seus dados serão permanentemente removidos.",
      [
        { text: "Cancelar", onPress: () => {}, style: "cancel" },
        {
          text: "Deletar",
          onPress: async () => {
            try {
              const usuarioId = auth.currentUser?.uid;
              
              // Deletar dados do Firestore
              if (usuarioId) {
                await firestore.collection("Usuario").doc(usuarioId).delete();
              }

              // Deletar conta do Firebase Auth
              await auth.currentUser?.delete();

              // Navegar para login
              navigation.reset({
                index: 0,
                routes: [{ name: "LoginTrabalhador" }],
              });

              Alert.alert("Sucesso", "Sua conta foi deletada com sucesso");
            } catch (erro: any) {
              console.log("Erro ao deletar conta:", erro);
              Alert.alert("Erro", "Não foi possível deletar sua conta: " + erro.message);
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
          <ArrowLeft size={24} color="#fff"  />
        </TouchableOpacity>
        <Text style={{marginTop:40, marginBottom:4, fontSize: 28, fontWeight: "600", color: "#000"}}>Meu Perfil</Text>
        <TouchableOpacity 
          onPress={() => navigation.navigate("EditarPerfil")} 
          style={{backgroundColor: "#005362", padding: 8, borderRadius: 8, marginBottom:4, marginTop:40}}
        >
          <Edit2 size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Perfil Section */}
      <View style={styles.perfilSection}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar} />
        </View>
        <Text style={styles.nome}>{usuario.nome}</Text>
        <Text style={styles.email}>{usuario.email}</Text>
      </View>

      {/* Avaliação */}
      <View style={styles.avaliacaoCard}>
        <View style={styles.avaliacaoContent}>
          <Star size={20} color="#FFD700" fill="#FFD700" />
          <Text style={styles.avaliacaoTexto}>{usuario.avaliacao}</Text>
          <Text style={styles.avaliacaoSubtexto}>({usuario.numeroAvaliacoes} avaliações)</Text>
        </View>
      </View>

      {/* Informações de Contato */}
      <View style={styles.contatoSection}>
        <Text style={styles.sectionTitle}>Informações de Contato</Text>
        
        <View style={styles.infoItem}>
          <Phone size={18} color="#1e90ff" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Telefone</Text>
            <Text style={styles.infoText}>{usuario.telefone || "Não informado"}</Text>
          </View>
        </View>

        <View style={styles.infoItem}>
          <Mail size={18} color="#1e90ff" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoText}>{usuario.email}</Text>
          </View>
        </View>

        <View style={styles.infoItem}>
          <MapPin size={18} color="#1e90ff" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Localização</Text>
            <Text style={styles.infoText}>{usuario.localizacao}</Text>
          </View>
        </View>
      </View>

      {/* Descrição */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sobre você</Text>
        <View style={styles.descricaoBox}>
          <Text style={styles.descricao}>{usuario.descricao}</Text>
        </View>
      </View>

      {/* Serviços oferecidos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Serviços Oferecidos</Text>
        {usuario.profissao ? (
          <View style={styles.servicosContainer}>
            <View style={styles.servicoBadge}>
              <Briefcase size={16} color="#fff" />
              <Text style={styles.servicoTexto}>{usuario.profissao}</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.nenhumTexto}>Nenhum serviço informado</Text>
        )}
      </View>

      {/* Histórico */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Histórico de Serviços</Text>
        {usuario.historico.map((item) => (
          <View key={item.id} style={styles.historicoItem}>
            <View style={styles.historicoLeft}>
              <Calendar size={18} color="#1e90ff" />
              <View style={styles.historicoContent}>
                <Text style={styles.historicoServico}>{item.servico}</Text>
                <Text style={styles.historicoData}>{item.data}</Text>
              <View style={styles.historicoRight}>
                <Text 
                style={[
                  styles.historicoStatus,
                  item.status === "Concluído" && styles.statusConcluido
                ]}
              >
                {item.status}
                </Text>
               </View>
                <View style={styles.historicoRight}>
                   <Text style={styles.historicoValor}>{item.valor}</Text>
                </View>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <LogOut size={20} color="#1e90ff" />
        <Text style={styles.logoutText}>Sair da conta</Text>
      </TouchableOpacity>

      {/* Deletar Conta Button */}
      <TouchableOpacity style={styles.deleteButton} onPress={handleDeletarConta}>
        <Text style={styles.deleteButtonText}>Deletar Conta</Text>
      </TouchableOpacity>

      <View style={styles.spacer} />
    </ScrollView>
  );
}