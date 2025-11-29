import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, 
  Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform 
} from 'react-native';
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { User, Lock } from 'lucide-react-native';

import { SERVER_URL } from '../config'; 
import { socket } from '../socket'; 

export default function LoginScreen() {
  const navigation = useNavigation();
  
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);


  const handleLogin = async () => {
    if (!userId || !password) {
      return Alert.alert("알림", "아이디와 비밀번호를 입력해주세요.");
    }

    try {
      setLoading(true);
      console.log(`로그인 시도: ${userId}`);

      // 1. 서버로 로그인 요청
      const response = await axios.post(`${SERVER_URL}/api/auth/login`, {
        userId: userId,
        password: password
      });

      const { token, user } = response.data;
      console.log("로그인 성공 정보 확인:", user); 

      if (user.id) {
        await AsyncStorage.setItem('userId', String(user.id)); // ★ 핵심!
      }

      // 🔥 [필수 추가] 역할(Role) 저장 (manager 또는 worker)
      if (user.role) {
        await AsyncStorage.setItem('userRole', user.role);
      }


      // 2. 출근 기준 시간 저장
      if (user.workStartTime) {
        await AsyncStorage.setItem('workStartTime', user.workStartTime);
      } else {
        await AsyncStorage.removeItem('workStartTime'); 
      }
      
      // 토큰 저장
      if(token) {
        await AsyncStorage.setItem('userToken', token);
      }


      if (!socket.connected) {
        socket.connect();
        console.log("🔵 소켓 연결 시도...");
      }

      // 3. 역할에 따라 화면 이동
      if (user.role === 'manager') {
        navigation.replace('ManagerHome');
      } else if (user.role === 'worker') {
        navigation.replace('WorkerHome');
      } else {
        Alert.alert("오류", "알 수 없는 사용자 역할입니다.");
      }

    } catch (error) {
      console.error("로그인 에러:", error);
      const message = error.response?.data?.message || "로그인에 실패했습니다.";
      Alert.alert("로그인 실패", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <View style={styles.logoSection}>
          <Text style={styles.emoji}>⏰</Text>
          <Text style={styles.title}>알바 관리 시스템</Text>
          <Text style={styles.subtitle}>간편한 출퇴근 관리의 시작</Text>
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <User color="#888" size={20} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="아이디"
              value={userId}
              onChangeText={setUserId}
              autoCapitalize="none"
            />
          </View>
          
          <View style={styles.inputWrapper}>
            <Lock color="#888" size={20} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="비밀번호"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity 
            style={[styles.loginButton, loading && styles.disabledButton]} 
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.loginText}>로그인</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  content: { flex: 1, justifyContent: 'center', padding: 30 },
  logoSection: { alignItems: 'center', marginBottom: 50 },
  emoji: { fontSize: 60, marginBottom: 10 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#888' },
  inputContainer: { gap: 16 },
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F5F5F5', 
    borderRadius: 12, 
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: '#EEE'
  },
  icon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#333' },
  loginButton: { 
    backgroundColor: '#2ECC71', 
    height: 56, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginTop: 10,
    shadowColor: "#2ECC71",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  disabledButton: { backgroundColor: '#A5D6A7' },
  loginText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});