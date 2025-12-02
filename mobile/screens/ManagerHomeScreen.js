import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert } from 'react-native'; // Alert 추가
import { useNavigation } from "@react-navigation/native";
import { 
  ChevronLeft, 
  BarChart3, 
  Users, 
  Clock, 
  Settings, 
  AlertCircle, 
  Calendar // 👈 이걸 꼭 추가해야 합니다!
} from 'lucide-react-native';
import { socket } from '../socket'; // ✅ [추가]


export default function ManagerHomeScreen() {
  const navigation = useNavigation();

  // 로그아웃 핸들러 함수
  const handleLogout = () => {
    Alert.alert("로그아웃", "정말 로그아웃 하시겠습니까?", [
      { text: "취소", style: "cancel" },
      { 
        text: "확인", 
        onPress: () => {
          // ▼▼▼ [추가] 로그아웃 시 소켓 끊기 ▼▼▼
          socket.disconnect();
          console.log("🔴 소켓 연결 해제");
          // ▲▲▲

          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }], 
          });
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {/* 👇 뒤로 가기 버튼 누르면 handleLogout 실행 */}
        <TouchableOpacity onPress={handleLogout} style={styles.iconButton}>
          <ChevronLeft color="#333" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>사장님 홈</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.iconButton}>
          <Settings color="#333" size={24} />
        </TouchableOpacity>
      </View>

      {/* ... (나머지 코드는 기존과 동일) ... */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeSubText}>안녕하세요,</Text>
          <Text style={styles.welcomeText}>사장님 👑</Text>
        </View>

        <View style={styles.cardContainer}>
          {/* 실시간 출근 현황 */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('ManagerDashboard')}
            style={[styles.actionCard, styles.cardGreen]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.iconCircleTransparent}><BarChart3 color="white" size={24} /></View>
              <Text style={styles.emojiIcon}>📊</Text>
            </View>
            <Text style={styles.cardTitleWhite}>실시간 출근 현황</Text>
            <Text style={styles.cardSubtitleWhite}>직원 근무 상태 확인</Text>
          </TouchableOpacity>

          {/* 직원 관리 */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('EmployeeList')} 
            style={[styles.actionCard, styles.cardWhite]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.iconCircleGray}><Users color="#2ECC71" size={24} /></View>
              <Text style={styles.emojiIcon}>👥</Text>
            </View>
            <Text style={styles.cardTitleBlack}>직원 관리</Text>
            <Text style={styles.cardSubtitleGray}>직원 정보 및 상태 관리</Text>
          </TouchableOpacity>

          {/* 공지사항 카드 */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('NoticeList')}
            style={[styles.actionCard, styles.cardWhite]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.iconCircleGray}><AlertCircle color="#F39C12" size={24} /></View>
              <Text style={styles.emojiIcon}>📢</Text>
            </View>
            <Text style={styles.cardTitleBlack}>공지사항 관리</Text>
            <Text style={styles.cardSubtitleGray}>공지 작성 및 조회</Text>
          </TouchableOpacity>

          {/* 직원 출퇴근 설정 */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('ManagerSchedule')} 
            style={[styles.actionCard, styles.cardWhite]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.iconCircleGray}><Calendar color="#3498DB" size={24} /></View>
              <Text style={styles.emojiIcon}>🗓️</Text>
            </View>
            <Text style={styles.cardTitleBlack}>근무표 관리</Text>
            <Text style={styles.cardSubtitleGray}>직원 일정 배정하기</Text>
          </TouchableOpacity>

          {/* 출퇴근 기록 */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('AttendanceHistory')}
            style={[styles.actionCard, styles.cardWhite]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.iconCircleGray}><Clock color="#2ECC71" size={24} /></View>
              <Text style={styles.emojiIcon}>📋</Text>
            </View>
            <Text style={styles.cardTitleBlack}>출퇴근 기록 전체보기</Text>
            <Text style={styles.cardSubtitleGray}>전체 근무 이력 조회</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F7' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 24, backgroundColor: 'white' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  iconButton: { padding: 4 },
  scrollContent: { 
    padding: 24,
    paddingBottom: 100},
  welcomeSection: { marginBottom: 32 },
  welcomeText: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  welcomeSubText: { color: '#AAAAAA', fontSize: 16 },
  cardContainer: { gap: 16 },
  actionCard: { width: '100%', borderRadius: 18, padding: 24, elevation: 4 },
  cardGreen: { backgroundColor: '#1E8449' },
  cardWhite: { backgroundColor: 'white' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  iconCircleTransparent: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  iconCircleGray: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center' },
  emojiIcon: { fontSize: 30 },
  cardTitleWhite: { color: 'white', fontSize: 20, fontWeight: '700' },
  cardSubtitleWhite: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  cardTitleBlack: { color: '#333', fontSize: 20, fontWeight: '700' },
  cardSubtitleGray: { color: '#AAAAAA', fontSize: 14 },
});