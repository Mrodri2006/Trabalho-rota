import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth, firestore } from '../firebase';
import { saveProfile } from '../storage/profileStorage';

export default function DriverLogin() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      alert('Preencha e-mail e senha.');
      return;
    }

    try {
      const credential = await auth.signInWithEmailAndPassword(
        email.trim(),
        password
      );

      const userId = credential.user?.uid ?? auth.currentUser?.uid;
      if (userId) {
        try {
          const snapshot = await firestore.collection('drivers').doc(userId).get();
          const data = snapshot.data();
          if (data?.name && data?.email) {
            await saveProfile(userId, { name: data.name, email: data.email });
          } else {
            await saveProfile(userId, { name: '', email: email.trim() });
          }
        } catch {
          await saveProfile(userId, { name: '', email: email.trim() });
        }
      }

      navigation.replace('DriverHome');
    } catch (error: any) {
      alert(error.message ?? 'Erro ao entrar.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.backgroundCircle} />
      <View style={styles.backgroundCircleSmall} />

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.badge}>Motorista</Text>
          <Text style={styles.title}>Faca login</Text>
          <Text style={styles.subtitle}>
            Acompanhe seus ganhos e tenha seu historico sempre a mao.
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>E-mail</Text>
          <TextInput
            placeholder='E-mail'
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            placeholderTextColor='#94A3B8'
            keyboardType='email-address'
            autoCapitalize='none'
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Senha</Text>
          <TextInput
            placeholder='Senha'
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            placeholderTextColor='#94A3B8'
            secureTextEntry
          />
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
          <Text style={styles.primaryButtonText}>Entrar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('DriverRegister')}
        >
          <Text style={styles.linkText}>Criar conta</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const COLORS = {
  background: '#F5F7FB',
  card: '#FFFFFF',
  text: '#0F172A',
  muted: '#64748B',
  softAlt: '#F1F5F9',
  primary: '#1C7ED6',
  primaryDark: '#0B4F9F',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  backgroundCircle: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#E0ECFF',
    top: -80,
    right: -80,
  },
  backgroundCircleSmall: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#EEF3FF',
    bottom: -40,
    left: -40,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.card,
    borderRadius: 26,
    padding: 24,
    shadowColor: '#0F172A',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  cardHeader: {
    marginBottom: 20,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F1FF',
    color: COLORS.primaryDark,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    fontWeight: '700',
    fontSize: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.muted,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.softAlt,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: '#E5EAF1',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 6,
    shadowColor: COLORS.primaryDark,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 14,
  },
  linkText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 13,
  },
});
