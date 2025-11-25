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
// 아이콘 라이브러리 (없으면 에러나니 npm install lucide-react-native 설치 필수)
import { ChevronLeft, Clock, LogIn, LogOut } from 'lucide-react-native';

const SERVER_URL = "http://10.74.242.127:5000";

export default function WorkerScreen() {
  const navigation = useNavigation();
  
  // 시계 상태
  const [currentTime, setCurrentTime] = useState(new Date());
  // 화면 표시용 상태 (서버 응답 후 업데이트 됨)
  const [lastAction, setLastAction] = useState({ type: null, time: null });

  // 1초마다 시간 갱신
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

  // --- [기존 로직 통합] 출근 ---
  const handleCheckIn = async () => {
    try {
      // 1. 서버로 데이터 전송
      await axios.post(`${SERVER_URL}/api/attendance/check_in`, { userId: 1 });
      
      // 2. 성공 시 UI 업데이트 및 알림
      const timeStr = formatTime(new Date());
      console.log("출근 성공");
      setLastAction({ type: '출근', time: timeStr });
      Alert.alert("✅ 출근 완료", `${timeStr}에 출근 처리되었습니다.`);
      
    } catch (err) {
      console.log("출근 오류:", err);
      Alert.alert("❌ 오류", "서버 연결에 실패했습니다.");
    }
  };

  // --- [기존 로직 통합] 퇴근 ---
  const handleCheckOut = async () => {
    try {
      // 1. 서버로 데이터 전송
      await axios.post(`${SERVER_URL}/api/attendance/check_out`, { userId: 1 });
      
      // 2. 성공 시 UI 업데이트 및 알림
      const timeStr = formatTime(new Date());
      console.log("퇴근 성공");
      setLastAction({ type: '퇴근', time: timeStr });
      Alert.alert("✅ 퇴근 완료", `${timeStr}에 퇴근 처리되었습니다.`);
      
    } catch (err) {
      console.log("퇴근 오류:", err);
      Alert.alert("❌ 오류", "서버 연결에 실패했습니다.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <ChevronLeft color="#333" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>출퇴근 체크</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 디지털 시계 영역 */}
        <View style={styles.clockSection}>
          <View style={styles.clockCircle}>
            <Clock color="white" size={64} />
          </View>
          <Text style={styles.clockLabel}>현재 시각</Text>
          <Text style={styles.clockTime}>{formatTime(currentTime)}</Text>
        </View>

        {/* 버튼 영역 */}
        <View style={styles.buttonContainer}>
          {/* 출근 버튼 */}
          <TouchableOpacity 
            style={[styles.actionButton, styles.checkInButton]}
            activeOpacity={0.9}
            onPress={handleCheckIn}
          >
            <LogIn color="white" size={24} />
            <Text style={styles.checkInText}>출근하기</Text>
          </TouchableOpacity>

          {/* 퇴근 버튼 */}
          <TouchableOpacity 
            style={[styles.actionButton, styles.checkOutButton]}
            activeOpacity={0.9}
            onPress={handleCheckOut}
          >
            <LogOut color="#333" size={24} />
            <Text style={styles.checkOutText}>퇴근하기</Text>
          </TouchableOpacity>
        </View>

        {/* 상태 패널 */}
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