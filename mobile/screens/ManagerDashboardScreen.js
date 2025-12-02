import React, { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView 
} from 'react-native';
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { ChevronLeft, Activity, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react-native';
import { SERVER_URL } from '../config';
import { socket } from '../socket'; 

export default function ManagerDashboardScreen() {
  const navigation = useNavigation();

  // 대시보드 데이터 상태
  const [stats, setStats] = useState({ todayCheckIn: 0, working: 0, late: 0, totalWorkers: 0 });
  const [employeeStatus, setEmployeeStatus] = useState([]);
  const [loading, setLoading] = useState(false);

  // 대시보드 데이터 불러오기
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

  useEffect(() => {
    fetchDashboardData();
    
    // 소켓으로 실시간 업데이트 받기 (선택 사항)
    // 누군가 출근하면 자동으로 새로고침
    socket.on('checkInAlert', () => fetchDashboardData());
    socket.on('checkOutAlert', () => fetchDashboardData());

    return () => {
      socket.off('checkInAlert');
      socket.off('checkOutAlert');
    };
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

  return (
    <SafeAreaView style={styles.container}>
      
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <ChevronLeft color="#333" size={24} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>실시간 출근 현황</Text>

        <TouchableOpacity onPress={fetchDashboardData} style={{ marginLeft: 'auto', padding: 8 }}>
          <RefreshCw color={loading ? "#DDD" : "#2ECC71"} size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* 상단 요약 카드 */}
        <View style={styles.gridContainer}>
          <View style={styles.summaryCard}>
            <TrendingUp color="#2ECC71" size={24} />
            <Text style={styles.summaryLabel}>오늘 출근</Text>
            <Text style={styles.summaryValue}>{stats.todayCheckIn} / {stats.totalWorkers}명</Text>
          </View>

          <View style={styles.summaryCard}>
            <Activity color="#F39C12" size={24} />
            <Text style={styles.summaryLabel}>근무 중</Text>
            <Text style={styles.summaryValue}>{stats.working}명</Text>
          </View>

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
                <View style={[
                  styles.profileCircle,
                  { backgroundColor: emp.status === '근무 중' ? '#2ECC71' : emp.status === '미출근' ? '#FFCDD2' : '#CCC' }
                ]}>
                  <Text style={{ color: 'white', fontWeight: 'bold' }}>{emp.name[0]}</Text>
                </View>

                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.logName}>{emp.name}</Text>
                    {emp.isLate && (
                      <View style={styles.lateBadge}>
                        <Text style={styles.lateText}>지각</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.logTime}>
                    {emp.status === '미출근' ? '아직 출근 안함' : 
                     emp.status === '퇴근' ? `${emp.time} 퇴근` : 
                     `${emp.time} 출근`}
                  </Text>
                  
                  {/* 기준 시간 표시는 유지하되 설정 버튼은 삭제됨 */}
                  <Text style={styles.subTime}>
                    기준: {emp.workStartTime || "미설정"}
                  </Text>
                </View>
              </View>

              {/* 오른쪽: 상태 뱃지 (설정 버튼 삭제됨) */}
              <View style={[styles.badge, { backgroundColor: badgeStyle.bg }]}>
                <Text style={{ color: badgeStyle.text, fontSize: 12, fontWeight: 'bold' }}>
                  {emp.status}
                </Text>
              </View>

            </View>
          );
        })}

        {employeeStatus.length === 0 && !loading && (
          <Text style={{ textAlign: 'center', color: '#AAA', marginTop: 20 }}>
            등록된 직원이 없습니다.
          </Text>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F7' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 24, backgroundColor: 'white', elevation: 2 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 8 },
  scrollContent: { padding: 24, paddingBottom: 50 },
  gridContainer: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  summaryCard: { flex: 1, backgroundColor: 'white', padding: 16, borderRadius: 12, alignItems: 'center', elevation: 2 },
  summaryLabel: { color: '#888', marginTop: 8, fontSize: 12 },
  summaryValue: { fontSize: 16, fontWeight: 'bold', marginTop: 4 },
  sectionHeader: { marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  logCard: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 1 },
  logName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  logTime: { color: '#555', fontSize: 13, marginTop: 2 },
  subTime: { color: '#AAA', fontSize: 11, marginTop: 2 },
  profileCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  lateBadge: { backgroundColor: '#FFEBEE', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#FFCDD2' },
  lateText: { fontSize: 10, color: '#D32F2F', fontWeight: 'bold' },
  iconButton: { padding: 8 }
});