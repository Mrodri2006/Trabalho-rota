
import { useState, useRef, useCallback } from 'react';
import { FlatList, Text, ImageBackground, View, ActivityIndicator } from 'react-native';
import { auth, firestore } from '../firebase';
import { useFocusEffect } from '@react-navigation/native';
import styles from '../estilo';
import { Serv } from '../model/Serv';

export default function ServStatus() {
    const [servs, setServs] = useState<Serv[]>([]);
    const [loading, setLoading] = useState(true);
    const unsubscribeRef = useRef<any>(null);

    useFocusEffect(
        useCallback(() => {
            listar();
            return () => {
                if (unsubscribeRef.current) {
                    unsubscribeRef.current();
                }
            };
        }, [])
    );

    const listar = () => {
        const usuarioId = auth.currentUser?.uid;
        if (!usuarioId) {
            setLoading(false);
            return;
        }

        setLoading(true);

        if (unsubscribeRef.current) {
            unsubscribeRef.current();
        }

        unsubscribeRef.current = firestore
            .collection("ServicosClientes")
            .doc(usuarioId)
            .collection("ServicoStatus")
            .onSnapshot((snapshot) => {
                const servsDoCliente: Serv[] = snapshot.docs.map((doc) => {
                    const data = doc.data();
                    return {
                        ...data,
                        id: doc.id,
                        status: data.status || 'a fazer',
                    } as Serv;
                });
                setServs(servsDoCliente);
                setLoading(false);
            }, (error) => {
                console.error("Erro ao buscar serviços:", error);
                setLoading(false);
            });
    };

    const getStatusColor = (status: string) => {
        if (status === 'realizado' || status === 'finalizado') return '#4CAF50';
        if (status === 'problema') return '#FFC107';
        if (status === 'a fazer' || status === 'aceito') return '#FF6B6B';
        return '#999';
    };

    const getStatusText = (status: string) => {
        if (status === 'realizado' || status === 'finalizado') return '✓ Finalizado';
        if (status === 'problema') return '⚠ Problema';
        if (status === 'a fazer' || status === 'aceito') return '⌛ Em Andamento';
        return status;
    };

    const servsFinalizados = servs
        .filter((serv) => serv.status === 'realizado' || serv.status === 'finalizado')
        .sort((a: any, b: any) => {
            const dateA = a.dataFinalizado?.toDate?.() || a.dataAtualizacao?.toDate?.() || a.dataSolicitacao?.toDate?.() || new Date(0);
            const dateB = b.dataFinalizado?.toDate?.() || b.dataAtualizacao?.toDate?.() || b.dataSolicitacao?.toDate?.() || new Date(0);
            return dateB.getTime() - dateA.getTime();
        });

    return (
        <ImageBackground resizeMode='stretch' style={styles.container}>
            <Text style={[
                styles.text,
                {
                    fontSize: 20,
                    fontWeight: 'bold',
                    marginBottom: 15,
                    marginTop: 10
                }
            ]}>
                Histórico de Serviços
            </Text>

            {loading ? (
                <View style={{ justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
                    <ActivityIndicator size="large" color="#005362" />
                    <Text style={styles.text}>Carregando serviços...</Text>
                </View>
            ) : servsFinalizados.length === 0 ? (
                <Text style={styles.text}>Nenhum serviço finalizado</Text>
            ) : (
                <FlatList
                    data={servsFinalizados}
                    keyExtractor={(item) => `${item.id}`}
                    renderItem={({ item }) => (
                        <View style={[styles.listItem, { paddingVertical: 10, paddingHorizontal: 15, marginBottom: 12 }]}>
                            <Text style={[styles.text, { fontWeight: 'bold', fontSize: 16 }]}>
                                {item.estilo || item.tipo}
                            </Text>
                            <Text style={styles.text}>
                                📍 Local: {item.local}
                            </Text>
                            <Text style={styles.text}>
                                📅 Data: {item.data}
                            </Text>
                            <Text style={styles.text}>
                                Tipo: {item.tipo}
                            </Text>

                            {/* Status Visual */}
                            <View style={{ marginVertical: 10 }}>
                                <Text style={[
                                    styles.text,
                                    {
                                        color: getStatusColor(item.status),
                                        fontWeight: 'bold',
                                        fontSize: 16,
                                        backgroundColor: getStatusColor(item.status) + '20',
                                        padding: 8,
                                        borderRadius: 5,
                                        textAlign: 'center'
                                    }
                                ]}>
                                    {getStatusText(item.status)}
                                </Text>
                            </View>

                        </View>
                    )}
                    scrollEnabled={true}
                />
            )}
        </ImageBackground>
    );
}
