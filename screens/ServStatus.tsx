<<<<<<< HEAD
import { useState, useRef, useCallback } from 'react';
import { FlatList, Text, TouchableOpacity, ImageBackground, View, Alert, ActivityIndicator } from 'react-native';
import { auth, firestore } from '../firebase';
import { useFocusEffect } from '@react-navigation/native';
import styles from '../estilo';
import { Serv } from '../model/Serv';

export default function ServStatus() {
    const [servs, setServs] = useState<Serv[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtro, setFiltro] = useState('todos'); // 'todos', 'realizado', 'não realizado'
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

        // Limpar subscriber anterior
        if (unsubscribeRef.current) {
            unsubscribeRef.current();
        }

        // Buscar serviços solicitados pelo usuário atual (cliente)
        unsubscribeRef.current = firestore
            .collection("ServicosAgendados")
            .onSnapshot((snapshot) => {
                const todosServs: Serv[] = [];

                snapshot.forEach((docPrestador) => {
                    // Para cada prestador, buscar seus serviços com listener
                    docPrestador.ref.collection("ServicoStatus").onSnapshot((servSnapshot) => {
                        const servsDoPrestador = servSnapshot.docs
                            .map((doc) => {
                                const data = doc.data();
                                return {
                                    ...data,
                                    id: doc.id,
                                    prestadorId: docPrestador.id,
                                    status: data.status || 'aguardando resposta',
                                } as Serv;
                            })
                            .filter((serv) => serv.clienteId === usuarioId); // Apenas serviços do cliente

                        // Remover serviços antigos deste prestador e adicionar novos
                        const outrosServs = todosServs.filter(s => s.prestadorId !== docPrestador.id);
                        setServs([...outrosServs, ...servsDoPrestador]);
                        setLoading(false);
                    });
                });
            });
    };

    const atualizarStatus = async (item: Serv, novoStatus: string) => {
        try {
            if (!item.prestadorId) {
                Alert.alert('Erro', 'Informações do prestador não disponíveis');
                return;
            }

            await firestore
                .collection("ServicosAgendados")
                .doc(item.prestadorId)
                .collection("ServicoStatus")
                .doc(item.id)
                .update({
                    status: novoStatus,
                });

            Alert.alert('Sucesso', `Serviço marcado como "${novoStatus}"`);
        } catch (error) {
            console.error("Erro ao atualizar status:", error);
            Alert.alert('Erro', 'Não foi possível atualizar o status do serviço');
        }
    };

    const excluir = async (item: Serv) => {
        Alert.alert(
            'Confirmar',
            'Deseja realmente excluir este serviço?',
            [
                { text: 'Cancelar', onPress: () => { } },
                {
                    text: 'Excluir',
                    onPress: async () => {
                        try {
                            if (!item.prestadorId) {
                                Alert.alert('Erro', 'Informações do prestador não disponíveis');
                                return;
                            }

                            await firestore
                                .collection("ServicosAgendados")
                                .doc(item.prestadorId)
                                .collection("ServicoStatus")
                                .doc(item.id)
                                .delete();

                            Alert.alert('Sucesso', 'Serviço excluído com sucesso');
                        } catch (error) {
                            Alert.alert('Erro', 'Não foi possível excluir o serviço');
                        }
                    }
                }
            ]
        );
    };

    const getStatusColor = (status: string) => {
        if (status === 'realizado') return '#4CAF50';
        if (status === 'não realizado') return '#FF6B6B';
        return '#FFC107';
    };

    const getStatusText = (status: string) => {
        if (status === 'realizado') return '✓ Realizado';
        if (status === 'não realizado') return '✗ Não Realizado';
        return status;
    };

    // Filtrar serviços baseado no filtro selecionado
    const servsFiltrados = servs.filter((serv) => {
        if (filtro === 'todos') return true;
        return serv.status === filtro;
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
                Status dos Serviços
            </Text>

            {/* Filtros */}
            <View style={{
                flexDirection: 'row',
                gap: 8,
                marginBottom: 15,
                paddingHorizontal: 5,
            }}>
                {['todos', 'realizado', 'não realizado'].map((f) => (
                    <TouchableOpacity
                        key={f}
                        style={[
                            {
                                paddingVertical: 8,
                                paddingHorizontal: 12,
                                borderRadius: 6,
                                backgroundColor: filtro === f ? '#005362' : '#f0f0f0',
                            }
                        ]}
                        onPress={() => setFiltro(f)}
                    >
                        <Text style={{
                            color: filtro === f ? '#fff' : '#666',
                            fontWeight: '600',
                            fontSize: 12,
                        }}>
                            {f === 'todos' ? 'Todos' : f === 'realizado' ? '✓ Realizados' : '✗ Não Realizados'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {loading ? (
                <View style={{ justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
                    <ActivityIndicator size="large" color="#005362" />
                    <Text style={styles.text}>Carregando serviços...</Text>
                </View>
            ) : servsFiltrados.length === 0 ? (
                <Text style={styles.text}>Nenhum serviço encontrado</Text>
            ) : (
                <FlatList
                    data={servsFiltrados}
                    keyExtractor={(item) => `${item.id}-${item.prestadorId}`}
                    renderItem={({ item }) => (
                        <View style={[styles.listItem, { paddingVertical: 10, paddingHorizontal: 15, marginBottom: 12 }]}>
                            <Text style={[styles.text, { fontWeight: 'bold', fontSize: 16 }]}>
                                {item.estilo || item.tipo}
                            </Text>
                            <Text style={styles.text}>
                                📍 Local: {item.local}
                            </Text>
                            <Text style={styles.text}>
                                👨‍🔧 Prestador: {item.prestadorId}
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

                            {/* Botões de Ação */}
                            <View style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                marginTop: 10,
                                gap: 10
                            }}>
                                {item.status !== 'realizado' && (
                                    <TouchableOpacity
                                        style={[
                                            styles.listItem,
                                            {
                                                flex: 1,
                                                backgroundColor: '#4CAF50',
                                                justifyContent: 'center',
                                                alignItems: 'center'
                                            }
                                        ]}
                                        onPress={() => atualizarStatus(item, 'realizado')}
                                    >
                                        <Text style={[styles.text, { color: '#fff', fontWeight: 'bold' }]}>
                                            ✓ Realizado
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                {item.status !== 'não realizado' && (
                                    <TouchableOpacity
                                        style={[
                                            styles.listItem,
                                            {
                                                flex: 1,
                                                backgroundColor: '#FF6B6B',
                                                justifyContent: 'center',
                                                alignItems: 'center'
                                            }
                                        ]}
                                        onPress={() => atualizarStatus(item, 'não realizado')}
                                    >
                                        <Text style={[styles.text, { color: '#fff', fontWeight: 'bold' }]}>
                                            ✗ Não Realizado
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity
                                    style={[
                                        styles.listItem,
                                        {
                                            flex: 0.5,
                                            backgroundColor: '#E91E63',
                                            justifyContent: 'center',
                                            alignItems: 'center'
                                        }
                                    ]}
                                    onPress={() => excluir(item)}
                                >
                                    <Text style={[styles.text, { color: '#fff' }]}>
                                        🗑
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                    scrollEnabled={true}
                />
            )}
        </ImageBackground>
    );
}
=======
import { useState, useRef, useCallback } from 'react';
import { FlatList, Text, TouchableOpacity, ImageBackground, View, Alert, ActivityIndicator } from 'react-native';
import { auth, firestore } from '../firebase';
import { useFocusEffect } from '@react-navigation/native';
import styles from '../estilo';
import { Serv } from '../model/Serv';

export default function ServStatus() {
    const [servs, setServs] = useState<Serv[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtro, setFiltro] = useState('todos'); // 'todos', 'realizado', 'não realizado'
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

        // Limpar subscriber anterior
        if (unsubscribeRef.current) {
            unsubscribeRef.current();
        }

        // Buscar serviços solicitados pelo usuário atual (cliente)
        unsubscribeRef.current = firestore
            .collection("ServicosAgendados")
            .onSnapshot((snapshot) => {
                const todosServs: Serv[] = [];

                snapshot.forEach((docPrestador) => {
                    // Para cada prestador, buscar seus serviços com listener
                    docPrestador.ref.collection("Serv").onSnapshot((servSnapshot) => {
                        const servsDoPrestador = servSnapshot.docs
                            .map((doc) => {
                                const data = doc.data();
                                return {
                                    ...data,
                                    id: doc.id,
                                    prestadorId: docPrestador.id,
                                    status: data.status || 'não realizado',
                                } as Serv;
                            })
                            .filter((serv) => serv.clienteId === usuarioId); // Apenas serviços do cliente

                        // Remover serviços antigos deste prestador e adicionar novos
                        const outrosServs = todosServs.filter(s => s.prestadorId !== docPrestador.id);
                        setServs([...outrosServs, ...servsDoPrestador]);
                        setLoading(false);
                    });
                });
            });
    };

    const atualizarStatus = async (item: Serv, novoStatus: string) => {
        try {
            if (!item.prestadorId) {
                Alert.alert('Erro', 'Informações do prestador não disponíveis');
                return;
            }

            await firestore
                .collection("ServicosAgendados")
                .doc(item.prestadorId)
                .collection("Serv")
                .doc(item.id)
                .update({
                    status: novoStatus,
                });

            Alert.alert('Sucesso', `Serviço marcado como "${novoStatus}"`);
        } catch (error) {
            console.error("Erro ao atualizar status:", error);
            Alert.alert('Erro', 'Não foi possível atualizar o status do serviço');
        }
    };

    const excluir = async (item: Serv) => {
        Alert.alert(
            'Confirmar',
            'Deseja realmente excluir este serviço?',
            [
                { text: 'Cancelar', onPress: () => { } },
                {
                    text: 'Excluir',
                    onPress: async () => {
                        try {
                            if (!item.prestadorId) {
                                Alert.alert('Erro', 'Informações do prestador não disponíveis');
                                return;
                            }

                            await firestore
                                .collection("ServicosAgendados")
                                .doc(item.prestadorId)
                                .collection("Serv")
                                .doc(item.id)
                                .delete();

                            Alert.alert('Sucesso', 'Serviço excluído com sucesso');
                        } catch (error) {
                            Alert.alert('Erro', 'Não foi possível excluir o serviço');
                        }
                    }
                }
            ]
        );
    };

    const getStatusColor = (status: string) => {
        if (status === 'realizado') return '#4CAF50';
        if (status === 'não realizado') return '#FF6B6B';
        return '#FFC107';
    };

    const getStatusText = (status: string) => {
        if (status === 'realizado') return '✓ Realizado';
        if (status === 'não realizado') return '✗ Não Realizado';
        return status;
    };

    // Filtrar serviços baseado no filtro selecionado
    const servsFiltrados = servs.filter((serv) => {
        if (filtro === 'todos') return true;
        return serv.status === filtro;
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
                Status dos Serviços
            </Text>

            {/* Filtros */}
            <View style={{
                flexDirection: 'row',
                gap: 8,
                marginBottom: 15,
                paddingHorizontal: 5,
            }}>
                {['todos', 'realizado', 'não realizado'].map((f) => (
                    <TouchableOpacity
                        key={f}
                        style={[
                            {
                                paddingVertical: 8,
                                paddingHorizontal: 12,
                                borderRadius: 6,
                                backgroundColor: filtro === f ? '#005362' : '#f0f0f0',
                            }
                        ]}
                        onPress={() => setFiltro(f)}
                    >
                        <Text style={{
                            color: filtro === f ? '#fff' : '#666',
                            fontWeight: '600',
                            fontSize: 12,
                        }}>
                            {f === 'todos' ? 'Todos' : f === 'realizado' ? '✓ Realizados' : '✗ Não Realizados'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {loading ? (
                <View style={{ justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
                    <ActivityIndicator size="large" color="#005362" />
                    <Text style={styles.text}>Carregando serviços...</Text>
                </View>
            ) : servsFiltrados.length === 0 ? (
                <Text style={styles.text}>Nenhum serviço encontrado</Text>
            ) : (
                <FlatList
                    data={servsFiltrados}
                    keyExtractor={(item) => `${item.id}-${item.prestadorId}`}
                    renderItem={({ item }) => (
                        <View style={[styles.listItem, { paddingVertical: 10, paddingHorizontal: 15, marginBottom: 12 }]}>
                            <Text style={[styles.text, { fontWeight: 'bold', fontSize: 16 }]}>
                                {item.estilo || item.tipo}
                            </Text>
                            <Text style={styles.text}>
                                📍 Local: {item.local}
                            </Text>
                            <Text style={styles.text}>
                                👨‍🔧 Prestador: {item.prestadorId}
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

                            {/* Botões de Ação */}
                            <View style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                marginTop: 10,
                                gap: 10
                            }}>
                                {item.status !== 'realizado' && (
                                    <TouchableOpacity
                                        style={[
                                            styles.listItem,
                                            {
                                                flex: 1,
                                                backgroundColor: '#4CAF50',
                                                justifyContent: 'center',
                                                alignItems: 'center'
                                            }
                                        ]}
                                        onPress={() => atualizarStatus(item, 'realizado')}
                                    >
                                        <Text style={[styles.text, { color: '#fff', fontWeight: 'bold' }]}>
                                            ✓ Realizado
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                {item.status !== 'não realizado' && (
                                    <TouchableOpacity
                                        style={[
                                            styles.listItem,
                                            {
                                                flex: 1,
                                                backgroundColor: '#FF6B6B',
                                                justifyContent: 'center',
                                                alignItems: 'center'
                                            }
                                        ]}
                                        onPress={() => atualizarStatus(item, 'não realizado')}
                                    >
                                        <Text style={[styles.text, { color: '#fff', fontWeight: 'bold' }]}>
                                            ✗ Não Realizado
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity
                                    style={[
                                        styles.listItem,
                                        {
                                            flex: 0.5,
                                            backgroundColor: '#E91E63',
                                            justifyContent: 'center',
                                            alignItems: 'center'
                                        }
                                    ]}
                                    onPress={() => excluir(item)}
                                >
                                    <Text style={[styles.text, { color: '#fff' }]}>
                                        🗑
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                    scrollEnabled={true}
                />
            )}
        </ImageBackground>
    );
}
>>>>>>> c4013cb8120aef20950c6862cb1830979ba00abe
