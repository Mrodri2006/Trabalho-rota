import { useState } from 'react';
import {  FlatList, Text, TouchableOpacity, ImageBackground } from 'react-native';
import { auth, firestore } from '../firebase';
import { useNavigation } from '@react-navigation/native';
import styles from '../estilo';
import { useEffect } from 'react';
import { Serv } from '../model/Serv';





export default function ListarServ() {
    const [servs, setServs] = useState<Serv[]>([]);


    const navigation = useNavigation();

    const refServ = firestore.collection("Usuario")
        .doc(auth.currentUser?.uid)
        .collection("Serv")

    useEffect(() => {
        listar();
    })

    const listar = () => {
        const subscriber = refServ
            .onSnapshot((query) => {
                const servs = [];
                query.forEach((documento) => {
                    servs.push({
                        ...documento.data(),
                        key: documento.id
                    });
                });
                setServs(servs);
            })
        return () => subscriber();
    }


    const excluir = async (item) => {
        const resultado = await refServ
            .doc(item.id)
            .delete()
            .then(() => {
                alert('Excluido com sucesso')
                listar()
            })
    }
    const editar = (item: Serv) => {
        navigation.navigate('Cadastro de Serviços', { servs: item });
    }

    return (
        <ImageBackground resizeMode='stretch' style={styles.container}>
            <FlatList
                data={servs}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.listItem}
                        onPress={() => editar(item)}
                        onLongPress={() => excluir(item)}
                    >
                        <Text style={styles.text}> Nome: {item.estilo}</Text>
                    </TouchableOpacity>
                )
                }
            />
        </ImageBackground>
    )
}
