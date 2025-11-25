import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView 
} from 'react-native';
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
// 아이콘 라이브러리 (없으면 npm install lucide-react-native)
import { ChevronLeft, Activity, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react-native';

// ★ [중요] 본인 PC IP 주소로 꼭 확인해주세요!
const SERVER_URL = "http://10.74.242.127:5000";

export default function ManagerDashboardScreen() {
  const navigation = useNavigation();

  // 서버 데이터 저장할 상태 변수들
  const [stats, setStats] = useState({ todayCheckIn: 0, working: 0, late: 0, totalWorkers: 0 });
  const [employeeStatus, setEmployeeStatus] = useState([]);
  const [loading, setLoading] = useState(false);

  // 서버에서 데이터 가져오는 함수
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

  // 화면 켜질 때 자동 실행
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // 상태(근무 중, 퇴근 등)에 따라 뱃지 색깔 결정해주는 함수
  const getStatusBadgeStyle = (status) => {
    switch (status) {
        case '근무 중': return { bg: '#E9F7EF', text: '#2ECC71' }; // 초록색 (일하는 중)
        case '퇴근': return { bg: '#F0F0F0', text: '#AAAAAA' };    // 회색 (퇴근함)
        case '미출근': return { bg: '#FDEDEC', text: '#E74C3C' };  // 빨간색 (아직 안옴)
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
        <Text style={styles.headerTitle}>사장님 대시보드</Text>
        {/* 새로고침 버튼 */}
        <TouchableOpacity onPress={fetchDashboardData} style={{marginLeft: 'auto'}}>
            <RefreshCw color={loading ? "#DDD" : "#2ECC71"} size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* 1. 상단 통계 위젯 (숫자판) */}
        <View style={styles.gridContainer}>
          {/* 오늘 출근 카드 */}
          <View style={styles.summaryCard}>
            <TrendingUp color="#2ECC71" size={24} />
            <Text style={styles.summaryLabel}>오늘 출근</Text>
            <Text style={styles.summaryValue}>{stats.todayCheckIn} / {stats.totalWorkers}명</Text>
          </View>

          {/* 근무 중 카드 */}
          <View style={styles.summaryCard}>
            <Activity color="#F39C12" size={24} />
            <Text style={styles.summaryLabel}>근무 중</Text>
            <Text style={styles.summaryValue}>{stats.working}명</Text>
          </View>

          {/* 지각 카드 (지각생 있으면 빨간색 강조) */}
          <View style={styles.summaryCard}>
            <AlertCircle color="#E74C3C" size={24} />
            <Text style={styles.summaryLabel}>지각</Text>
            <Text style={[styles.summaryValue, {color: stats.late > 0 ? '#E74C3C' : '#333'}]}>
                {stats.late}명
            </Text>
          </View>
        </View>

        {/* 2. 직원별 실시간 현황 리스트 */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>직원 현황</Text>
        </View>

        {employeeStatus.map((emp) => {
          const badgeStyle = getStatusBadgeStyle(emp.status);
          return (
            <View key={emp.id} style={styles.logCard}>
               <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                  {/* 프로필 원 (상태에 따라 색상 변경) */}
                  <View style={[
                      styles.profileCircle, 
                      { backgroundColor: emp.status === '근무 중' ? '#2ECC71' : (emp.status === '미출근' ? '#FFCDD2' : '#DDD') }
                  ]}>
                      <Text style={{color: 'white', fontWeight: 'bold'}}>{emp.name[0]}</Text>
                  </View>
                  
                  <View>
                      <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                        <Text style={styles.logName}>{emp.name}</Text>
                        
                        {/* ★ 지각 뱃지 (isLate가 true일 때만 보임) ★ */}
                        {emp.isLate && (
                          <View style={styles.lateBadge}>
                            <Text style={styles.lateText}>지각</Text>
                          </View>
                        )}
                      </View>
                      
                      {/* 시간 및 상태 텍스트 */}
                      <Text style={styles.logTime}>
                        {emp.status === '미출근' ? '아직 출근 안함' : 
                         emp.status === '퇴근' ? `${emp.time} 퇴근` : 
                         `${emp.time} 출근`}
                      </Text>
                  </View>
               </View>

               {/* 우측 상태 뱃지 (미출근/근무중/퇴근) */}
               <View style={[styles.badge, { backgroundColor: badgeStyle.bg }]}>
                  <Text style={{ color: badgeStyle.text, fontSize: 12, fontWeight: 'bold' }}>
                    {emp.status}
                  </Text>
               </View>
            </View>
          );
        })}
        
        {/* 직원이 아무도 없을 때 */}
        {employeeStatus.length === 0 && !loading && (
            <Text style={{textAlign: 'center', color: '#AAA', marginTop: 20}}>등록된 직원이 없습니다.</Text>
        )}

      </ScrollView>
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
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  logCard: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 1 },
  logName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  logTime: { color: '#888', fontSize: 13 },
  profileCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  lateBadge: { backgroundColor: '#FFEBEE', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#FFCDD2' },
  lateText: { fontSize: 10, color: '#D32F2F', fontWeight: 'bold' }
});