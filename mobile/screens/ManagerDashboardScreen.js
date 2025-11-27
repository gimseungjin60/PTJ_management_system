import React, { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView 
} from 'react-native';
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { ChevronLeft, Activity, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import { SERVER_URL } from '../config';
import { socket } from '../socket'; // ✅ [추가됨] 우리가 만든 소켓 가져오기

export default function ManagerDashboardScreen() {
  const navigation = useNavigation();


  // 시간 설정 관련 상태
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPicker, setShowPicker] = useState(false);

  // 대시보드 데이터
  const [stats, setStats] = useState({ todayCheckIn: 0, working: 0, late: 0, totalWorkers: 0 });
  const [employeeStatus, setEmployeeStatus] = useState([]);
  const [loading, setLoading] = useState(false);

  

  // 🔥 대시보드 데이터 불러오기
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${SERVER_URL}/api/manager/dashboard`);
      setStats(res.data.stats);
      setEmployeeStatus(res.data.statusList);
      console.log("대시보드 데이터 갱신 완료");
    } catch (err) {
      console.log("대시보드 로딩 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  // 화면 로드 시 실행
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // 상태 뱃지 색상
  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case '근무 중': return { bg: '#E9F7EF', text: '#2ECC71' };
      case '퇴근': return { bg: '#F0F0F0', text: '#AAAAAA' };
      case '미출근': return { bg: '#FDEDEC', text: '#E74C3C' };
      default: return { bg: '#F0F0F0', text: '#333' };
    }
  };

  // 🔥 출근 기준시간 설정 버튼 클릭
  const openTimePicker = (emp) => {
    setSelectedUser(emp);
    setShowPicker(true);
  };

  // 🔥 시간 선택 완료
  const onTimeChange = async (event, selectedTime) => {
    setShowPicker(false);
    if (!selectedUser || !selectedTime) return;

    // 시간 형식 변환 HH:MM:SS
    const hours = selectedTime.getHours().toString().padStart(2, '0');
    const mins = selectedTime.getMinutes().toString().padStart(2, '0');
    const formatted = `${hours}:${mins}:00`;

    try {
      // 서버로 전송 (업데이트)
      await axios.put(`${SERVER_URL}/api/manager/set-work-time`, {
        userId: selectedUser.id,
        workStartTime: formatted,
      });

      // ✅ [확인] socket이 연결된 상태인지 확인하고 emit
      if (socket.connected) {
        socket.emit("updateWorkStartTime", {
          userId: selectedUser.id,
          workStartTime: formatted,
        });
      }

      fetchDashboardData();
    } catch (error) {
      console.log("시간 업데이트 오류:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <ChevronLeft color="#333" size={24} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>사장님 대시보드</Text>

        <TouchableOpacity onPress={fetchDashboardData} style={{ marginLeft: 'auto' }}>
          <RefreshCw color={loading ? "#DDD" : "#2ECC71"} size={20} />
        </TouchableOpacity>
      </View>

      {/* 콘텐츠 */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* 상단 요약 카드 */}
        <View style={styles.gridContainer}>
          
          {/* 오늘 출근 */}
          <View style={styles.summaryCard}>
            <TrendingUp color="#2ECC71" size={24} />
            <Text style={styles.summaryLabel}>오늘 출근</Text>
            <Text style={styles.summaryValue}>
              {stats.todayCheckIn} / {stats.totalWorkers}명
            </Text>
          </View>

          {/* 근무중 */}
          <View style={styles.summaryCard}>
            <Activity color="#F39C12" size={24} />
            <Text style={styles.summaryLabel}>근무 중</Text>
            <Text style={styles.summaryValue}>{stats.working}명</Text>
          </View>

          {/* 지각 */}
          <View style={styles.summaryCard}>
            <AlertCircle color="#E74C3C" size={24} />
            <Text style={styles.summaryLabel}>지각</Text>
            <Text style={[styles.summaryValue, { color: stats.late > 0 ? '#E74C3C' : '#333' }]}>
              {stats.late}명
            </Text>
          </View>

        </View>

        {/* 직원 리스트 */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>직원 현황</Text>
        </View>

        {employeeStatus.map((emp) => {
          const badgeStyle = getStatusBadgeStyle(emp.status);

          return (
            <View key={emp.id} style={styles.logCard}>
              
              {/* 왼쪽: 프로필 + 정보 */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>

                {/* 프로필 */}
                <View style={[
                  styles.profileCircle,
                  { backgroundColor: emp.status === '근무 중' ? '#2ECC71' : emp.status === '미출근' ? '#FFCDD2' : '#CCC' }
                ]}>
                  <Text style={{ color: 'white', fontWeight: 'bold' }}>{emp.name[0]}</Text>
                </View>

                {/* 정보 */}
                <View>

                  {/* 이름 + 지각 */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.logName}>{emp.name}</Text>

                    {emp.isLate && (
                      <View style={styles.lateBadge}>
                        <Text style={styles.lateText}>지각</Text>
                      </View>
                    )}
                  </View>

                  {/* 출근/퇴근/미출근 */}
                  <Text style={styles.logTime}>
                    {emp.status === '미출근'
                      ? '아직 출근 안함'
                      : emp.status === '퇴근'
                      ? `${emp.time} 퇴근`
                      : `${emp.time} 출근`}
                  </Text>

                  {/* 기준 출근시간 */}
                  <Text style={styles.logTime}>
                    기준 출근시간: {emp.workStartTime || "-"}
                  </Text>

                </View>
              </View>

              {/* 오른쪽: 상태 + 설정버튼 */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                
                <View style={[styles.badge, { backgroundColor: badgeStyle.bg }]}>
                  <Text style={{ color: badgeStyle.text, fontSize: 12, fontWeight: 'bold' }}>
                    {emp.status}
                  </Text>
                </View>

                {/* 기준시간 설정 버튼 */}
                <TouchableOpacity
                  onPress={() => openTimePicker(emp)}
                  style={{
                    backgroundColor: '#EEE',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                  }}
                >
                  <Text style={{ fontSize: 12, color: '#333' }}>설정</Text>
                </TouchableOpacity>

              </View>

            </View>
          );
        })}

        {/* 직원 없음 */}
        {employeeStatus.length === 0 && !loading && (
          <Text style={{ textAlign: 'center', color: '#AAA', marginTop: 20 }}>
            등록된 직원이 없습니다.
          </Text>
        )}

      </ScrollView>

      {/* 🔥 시간 선택기 */}
      {showPicker && (
        <DateTimePicker
          value={new Date()}
          mode="time"
          display="spinner"
          onChange={onTimeChange}
        />
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F7' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 24, backgroundColor: 'white', elevation: 2 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 8 },
  scrollContent: { padding: 24 },
  gridContainer: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  summaryCard: { flex: 1, backgroundColor: 'white', padding: 16, borderRadius: 12, alignItems: 'center', elevation: 2 },
  summaryLabel: { color: '#888', marginTop: 8, fontSize: 12 },
  summaryValue: { fontSize: 16, fontWeight: 'bold', marginTop: 4 },
  sectionHeader: { marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  logCard: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 1 },
  logName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  logTime: { color: '#888', fontSize: 13, marginTop: 2 },
  profileCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  lateBadge: { backgroundColor: '#FFEBEE', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#FFCDD2' },
  lateText: { fontSize: 10, color: '#D32F2F', fontWeight: 'bold' }
});
