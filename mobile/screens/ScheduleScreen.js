import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars'; // 👈 LocaleConfig 추가!
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from "axios";
import { ChevronLeft, DollarSign, Calendar as CalendarIcon } from 'lucide-react-native';
import { SERVER_URL } from '../config';


LocaleConfig.locales['kr'] = {
  monthNames: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  monthNamesShort: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  dayNames: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
  dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
  today: '오늘'
};
LocaleConfig.defaultLocale = 'kr';

export default function ScheduleScreen() {
  const navigation = useNavigation();
  const [schedules, setSchedules] = useState({}); // 캘린더 마킹용 데이터
  const [salaryInfo, setSalaryInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  useEffect(() => {
    fetchData(currentYear, currentMonth);
  }, []);

  const fetchData = async (year, month) => {
    try {
      setLoading(true);
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;

      // 1. 일정 가져오기
      const scheduleRes = await axios.get(`${SERVER_URL}/api/schedule/my-schedule`, {
        params: { userId, year, month }
      });

      // 캘린더용 데이터로 변환 (날짜: { startTime: '09:30' })
      const markedData = {};
      scheduleRes.data.forEach(item => {
        markedData[item.date] = { 
            startTime: item.startTime, 
            endTime: item.endTime 
        };
      });
      setSchedules(markedData);

      // 2. 급여 정보 가져오기
      const salaryRes = await axios.get(`${SERVER_URL}/api/schedule/my-salary`, {
        params: { userId, year, month }
      });
      setSalaryInfo(salaryRes.data);

    } catch (error) {
      console.log("데이터 조회 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  // 캘린더 날짜 커스텀 렌더링 (날짜 아래에 시간 표시)
  // 캘린더 날짜 커스텀 렌더링
  const renderDay = ({ date, state }) => {
    const schedule = schedules[date.dateString];
    
    return (
      <TouchableOpacity 
        style={[styles.dayContainer, state === 'disabled' && styles.disabledDay]}
        activeOpacity={0.7}
      >
        <Text style={[styles.dayText, state === 'disabled' && styles.disabledText]}>
          {date.day}
        </Text>
        
        {/* 🔥 [수정] 위아래 두 줄로 분리 */}
        {schedule && (
          <View style={{ width: '100%', alignItems: 'center', gap: 2 }}>
            {/* 위: 출근 */}
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{schedule.startTime}</Text>
            </View>
            {/* 아래: 퇴근 */}
            <View style={styles.badge}>
              <Text style={[styles.badgeText, { color: '#E74C3C' }]}>
                {schedule.endTime}
              </Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <ChevronLeft color="#333" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>일정 및 급여</Text>
        <View style={{width: 24}} />
      </View>


      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* 1. 캘린더 영역 */}
        <View style={styles.calendarCard}>
          <View style={styles.cardTitleRow}>
            <CalendarIcon color="#2ECC71" size={20} />
            <Text style={styles.cardTitle}>이번 달 근무 일정</Text>
          </View>
          
          <Calendar
            current={today.toISOString().split('T')[0]}
            onMonthChange={(month) => fetchData(month.year, month.month)}
            dayComponent={renderDay} // 커스텀 날짜 컴포넌트 사용
            theme={{
              todayTextColor: '#2ECC71',
              arrowColor: '#2ECC71',
            }}
          />
        </View>

        {/* 2. 급여 정보 영역 */}
        <View style={styles.salaryCard}>
          <View style={styles.cardTitleRow}>
            <DollarSign color="#F39C12" size={20} />
            <Text style={styles.cardTitle}>{currentMonth}월 예상 급여</Text>
          </View>
          
          {loading ? (
             <ActivityIndicator color="#F39C12" style={{marginTop: 10}} />
          ) : (
            <View style={styles.salaryInfoContainer}>
                {/* 기본급 */}
                <View style={styles.salaryRow}>
                    <Text style={styles.salaryLabel}>기본 급여 ({salaryInfo?.totalHours}h)</Text>
                    <Text style={styles.salaryValue}>
                        {salaryInfo?.baseSalary?.toLocaleString()} 원
                    </Text>
                </View>

                {/* 주휴수당 */}
                {salaryInfo?.totalHolidayPay > 0 && (
                    <View style={styles.salaryRow}>
                        <Text style={[styles.salaryLabel, {color: '#2ECC71'}]}>+ 주휴수당</Text>
                        <Text style={[styles.salaryValue, {color: '#2ECC71'}]}>
                            {salaryInfo?.totalHolidayPay?.toLocaleString()} 원
                        </Text>
                    </View>
                )}

                {/* 🔥 [추가] 야간수당 */}
                {salaryInfo?.totalNightPay > 0 && (
                    <View style={styles.salaryRow}>
                        <View style={{flexDirection: 'row', alignItems: 'center'}}>
                            <Text style={[styles.salaryLabel, {color: '#9B59B6'}]}>+ 야간수당</Text>
                            <Text style={{fontSize: 10, color: '#9B59B6', marginLeft: 4}}>
                                ({salaryInfo?.totalNightHours}h × 0.5)
                            </Text>
                        </View>
                        <Text style={[styles.salaryValue, {color: '#9B59B6'}]}>
                            {salaryInfo?.totalNightPay?.toLocaleString()} 원
                        </Text>
                    </View>
                )}

                <View style={styles.divider} />

                {/* 최종 합계 */}
                <View style={styles.salaryRow}>
                    <Text style={styles.salaryLabel}>총 예상 수령액</Text>
                    <Text style={styles.salaryTotal}>
                        {salaryInfo?.finalSalary?.toLocaleString() || 0} 원
                    </Text>
                </View>
                
                {/* 주휴수당 설명 */}
                {salaryInfo?.totalHolidayPay > 0 ? (
                    <Text style={styles.helperText}>* 주 15시간 이상 근무하여 주휴수당이 포함되었습니다.</Text>
                ) : (
                    <Text style={styles.helperText}>* 주 15시간 미만 근무 시 주휴수당은 제외됩니다.</Text>
                )}
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F7' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 24, backgroundColor: 'white', elevation: 2 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  scrollContent: { padding: 24, gap: 20, paddingBottom: 50 },
  
  calendarCard: { backgroundColor: 'white', borderRadius: 18, padding: 16, elevation: 3 },
  
  // 🔥 [수정 1] 날짜 칸의 높이와 너비를 넉넉하게 늘림
  dayContainer: { 
    alignItems: 'center', 
    justifyContent: 'flex-start', 
    height: 55, // 기존 45 -> 55 (세로 공간 확보)
    width: 48   // 기존 32 -> 48 (가로 공간 확보)
  },
  
  dayText: { fontSize: 16, color: '#333', marginBottom: 4 },
  disabledText: { color: '#DDD' },
  
  // 🔥 [수정 2] 뱃지 스타일 개선
  badge: { 
    backgroundColor: '#E8F8F5', 
    paddingHorizontal: 2, 
    paddingVertical: 2, 
    borderRadius: 4,
    width: '100%', 
    alignItems: 'center'
  },
  
  // 🔥 [수정 3] 글자 크기 키움 (8 -> 10)
  badgeText: { 
    fontSize: 10, // 잘 보이게 키움
    color: '#2ECC71', 
    fontWeight: 'bold',
    // numberOfLines={1}  <-- 이 속성은 렌더링 함수에 있으니 스타일엔 없어도 됩니다.
  },

  // ... (나머지 급여 카드 스타일은 기존과 동일) ...
  salaryCard: { backgroundColor: 'white', borderRadius: 18, padding: 20, elevation: 3 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#555' },
  salaryInfoContainer: { backgroundColor: '#FFF9E6', padding: 16, borderRadius: 12 },
  salaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  salaryLabel: { color: '#888', fontSize: 14 },
  salaryValue: { color: '#333', fontSize: 16, fontWeight: '600' },
  salaryTotal: { color: '#F39C12', fontSize: 20, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#EEE', marginVertical: 8 },
  helperText: { fontSize: 12, color: '#AAA', textAlign: 'right', marginTop: 4 }
});