import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  Platform,
  Alert 
} from 'react-native';
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { ChevronLeft, Clock, LogIn, LogOut } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // AsyncStorage 추가
import { SERVER_URL } from '../config';

export default function WorkerScreen() {
  const navigation = useNavigation();
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastAction, setLastAction] = useState({ type: null, time: null });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false 
    });
  };

  // 출근
  const handleCheckIn = async () => {
    try {
      // AsyncStorage에서 userId 가져오기
      const userId = await AsyncStorage.getItem('userId');
      
      if (!userId) {
        Alert.alert("오류", "로그인 정보가 없습니다. 다시 로그인해주세요.");
        return;
      }

      await axios.post(`${SERVER_URL}/api/attendance/check_in`, { 
        userId: userId // 저장된 userId 사용
      });
      
      const timeStr = formatTime(new Date());
      console.log("출근 성공");
      setLastAction({ type: '출근', time: timeStr });
      Alert.alert("✅ 출근 완료", `${timeStr}에 출근 처리되었습니다.`);
      
    } catch (err) {
      console.log("출근 오류:", err);
      const message = err.response?.data?.message || "서버 연결에 실패했습니다.";
      Alert.alert("❌ 오류", message);
    }
  };

  // 퇴근
  const handleCheckOut = async () => {
    try {
      // AsyncStorage에서 userId 가져오기
      const userId = await AsyncStorage.getItem('userId');

      if (!userId) {
        Alert.alert("오류", "로그인 정보가 없습니다. 다시 로그인해주세요.");
        return;
      }

      await axios.post(`${SERVER_URL}/api/attendance/check_out`, { 
        userId: userId // 저장된 userId 사용
      });
      
      const timeStr = formatTime(new Date());
      console.log("퇴근 성공");
      setLastAction({ type: '퇴근', time: timeStr });
      Alert.alert("✅ 퇴근 완료", `${timeStr}에 퇴근 처리되었습니다.`);
      
    } catch (err) {
      console.log("퇴근 오류:", err);
      const message = err.response?.data?.message || "서버 연결에 실패했습니다.";
      Alert.alert("❌ 오류", message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <ChevronLeft color="#333" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>출퇴근 체크</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.clockSection}>
          <View style={styles.clockCircle}>
            <Clock color="white" size={64} />
          </View>
          <Text style={styles.clockLabel}>현재 시각</Text>
          <Text style={styles.clockTime}>{formatTime(currentTime)}</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.checkInButton]}
            activeOpacity={0.9}
            onPress={handleCheckIn}
          >
            <LogIn color="white" size={24} />
            <Text style={styles.checkInText}>출근하기</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.checkOutButton]}
            activeOpacity={0.9}
            onPress={handleCheckOut}
          >
            <LogOut color="#333" size={24} />
            <Text style={styles.checkOutText}>퇴근하기</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>최근 기록</Text>
          <View style={styles.statusRow}>
             <Text style={styles.statusLabel}>
               {lastAction.type ? `${lastAction.type} 시간` : '기록 없음'}
             </Text>
             <Text style={styles.statusTime}>
               {lastAction.time || '-'}
             </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F7' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: 'white', elevation: 2 },
  iconButton: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginLeft: 8 },
  scrollContent: { padding: 24, paddingBottom: 40 },
  clockSection: { alignItems: 'center', marginBottom: 48, marginTop: 24 },
  clockCircle: { width: 128, height: 128, borderRadius: 64, backgroundColor: '#2ECC71', justifyContent: 'center', alignItems: 'center', marginBottom: 24, elevation: 10 },
  clockLabel: { color: '#333', fontSize: 16, marginBottom: 8 },
  clockTime: { color: '#333', fontSize: 32, fontWeight: '600' },
  buttonContainer: { marginBottom: 32, gap: 16 },
  actionButton: { width: '100%', borderRadius: 18, paddingVertical: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16, elevation: 4 },
  checkInButton: { backgroundColor: '#2ECC71' },
  checkInText: { color: 'white', fontSize: 18, fontWeight: '600', marginLeft: 12 },
  checkOutButton: { backgroundColor: 'white', borderWidth: 2, borderColor: '#E0E0E0' },
  checkOutText: { color: '#333', fontSize: 18, fontWeight: '600', marginLeft: 12 },
  statusCard: { backgroundColor: 'white', borderRadius: 18, padding: 24, elevation: 3 },
  statusTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 16 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusLabel: { color: '#AAAAAA', fontSize: 16 },
  statusTime: { color: '#333', fontSize: 20, fontWeight: 'bold' },
});