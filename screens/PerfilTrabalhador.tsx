import { View, Text, TouchableOpacity, ScrollView, Alert, Image } from "react-native";
import { ArrowLeft, Edit2, Star, MapPin, Phone, Mail, LogOut, Calendar, Briefcase } from "lucide-react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { auth, firestore } from "../firebase";
import styles from "../estilo";
import * as ImagePicker from "expo-image-picker";

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
  });

  const [historico, setHistorico] = useState([]);

  useFocusEffect(
    useCallback(() => {
      const carregarDados = async () => {
        try {
          const usuarioAutenticado = auth.currentUser;

          if (usuarioAutenticado) {
            console.log('UID do usuário:', usuarioAutenticado.uid); 
            const docSnap = await firestore
              .collection("Usuario")
              .doc(usuarioAutenticado.uid)
              .get();

            if (docSnap.exists) {
              const dados = docSnap.data();

              setUsuario(prevState => ({
                ...prevState,
                nome: dados.nome || usuarioAutenticado.displayName || "Usuário",
                email: usuarioAutenticado.email || "",
                telefone: dados.fone || "",
                profissao: dados.profissao || "",
              }));
            }

            const snapshot = await firestore
              .collection("ServicosAdds")
              .doc(usuarioAutenticado.uid)
              .collection("ServicosOferecidos")
              .get();

            const lista = snapshot.docs.map(doc => {
              const data = doc.data();
              console.log('Documento:', doc.id, data); 
              return {
                id: doc.id,
                servico: data.estilo,
                data: data.dataCriacao ? new Date(data.dataCriacao.seconds * 1000).toLocaleDateString('pt-BR') : 'Data não informada',
                status: data.status || 'Finalizado',
                valor: data.valor,
                imagem: data.imagem,
              };
            });
            console.log('Lista de serviços:', lista); 
            setHistorico(lista);
          }
        } catch (erro) {
          console.log("Erro ao carregar dados:", erro);
        }
      };

      carregarDados();
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

  const handleDeleteAccount = async () => {
    Alert.alert(
      "Deletar Conta",
      "Tem certeza que deseja deletar sua conta? Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Deletar",
          style: "destructive",
          onPress: async () => {
            try {
              const usuarioAutenticado = auth.currentUser;
              if (!usuarioAutenticado) return;

              await firestore.collection("Usuario").doc(usuarioAutenticado.uid).delete();
              const servicosSnapshot = await firestore
                .collection("ServicosAdds")
                .doc(usuarioAutenticado.uid)
                .collection("ServicosOferecidos")
                .get();
              const deletePromises = servicosSnapshot.docs.map(doc => doc.ref.delete());
              await Promise.all(deletePromises);
              
              await usuarioAutenticado.delete();

              Alert.alert("Conta deletada", "Sua conta foi deletada com sucesso.");
              navigation.reset({
                index: 0,
                routes: [{ name: "LoginTrabalhador" }],
              });
            } catch (erro) {
              console.log("Erro ao deletar conta:", erro);
              Alert.alert("Erro", "Não foi possível deletar a conta.");
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>

        <Text style={{ marginTop: 40, marginBottom: 4, fontSize: 28, fontWeight: "600", color: "#000" }}>
          Meu Perfil
        </Text>

        <TouchableOpacity
          onPress={() => navigation.navigate("EditarPerfil")}
          style={{ backgroundColor: "#005362", padding: 8, borderRadius: 8, marginBottom: 4, marginTop: 40 }}
        >
          <Edit2 size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.perfilSection}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar} />
        </View>
        <Text style={styles.nome}>{usuario.nome}</Text>
        <Text style={styles.email}>{usuario.email}</Text>
      </View>

      <View style={styles.avaliacaoCard}>
        <View style={styles.avaliacaoContent}>
          <Star size={20} color="#FFD700" fill="#FFD700" />
          <Text style={styles.avaliacaoTexto}>{usuario.avaliacao}</Text>
          <Text style={styles.avaliacaoSubtexto}>({usuario.numeroAvaliacoes} avaliações)</Text>
        </View>
      </View>

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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Serviços Adicionados</Text>

        {historico.length > 0 ? (
          historico.map((item) => (
            <View key={item.id} style={styles.historicoItem}>
              <View style={styles.historicoLeft}>
                {item.imagem ? (
                  <Image source={{ uri: item.imagem }} style={styles.historicoImagem} />
                ) : (
                  <Calendar size={18} color="#1e90ff" />
                )}
                <View style={styles.historicoContent}>
                  <Text style={styles.historicoServico}>{item.servico}</Text>
                  <Text style={styles.historicoData}>{item.data}</Text>

                  <Text
                    style={[
                      styles.historicoStatus,
                      item.status === "Concluído" && styles.statusConcluido,
                    ]}
                  >
                    {item.status}
                  </Text>

                  <Text style={styles.historicoValor}>
                    R$ {item.valor}
                  </Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.nenhumTexto}>Nenhum serviço encontrado</Text>
        )}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <LogOut size={20} color="#1e90ff" />
        <Text style={styles.logoutText}>Sair da conta</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
        <Text style={styles.deleteButtonText}>Deletar Conta</Text>
      </TouchableOpacity>

      <View style={styles.spacer} />
    </ScrollView>
  );
}