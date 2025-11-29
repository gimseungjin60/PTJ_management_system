import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Modal, FlatList, Alert, ScrollView } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars'; // LocaleConfig 추가
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import { ChevronLeft, Plus, User, Trash2, ArrowRight } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SERVER_URL } from '../config';

// 캘린더 한글 설정
LocaleConfig.locales['kr'] = {
  monthNames: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  monthNamesShort: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  dayNames: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
  dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
  today: '오늘'
};
LocaleConfig.defaultLocale = 'kr';

export default function ManagerScheduleScreen() {
  const navigation = useNavigation();
  
  const [selectedDate, setSelectedDate] = useState(''); 
  const [daySchedules, setDaySchedules] = useState([]); 
  const [employees, setEmployees] = useState([]); 
  
  // 🔥 [추가] 월별 근무 인원 데이터 ( { '2025-11-29': 3, ... } )
  const [monthlyCounts, setMonthlyCounts] = useState({});

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [targetEndDate, setTargetEndDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // 화면이 포커스될 때마다 실행 (직원 목록 + 이번달 현황)
  useFocusEffect(
    useCallback(() => {
      fetchEmployees();
      const now = new Date();
      fetchMonthlySummary(now.getFullYear(), now.getMonth() + 1);
    }, [])
  );

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${SERVER_URL}/api/manager/employees`);
      setEmployees(res.data);
    } catch (err) { console.log("직원 로드 실패"); }
  };

  // 🔥 [추가] 월별 요약 정보 가져오기
  const fetchMonthlySummary = async (year, month) => {
    try {
      const res = await axios.get(`${SERVER_URL}/api/schedule/summary`, {
        params: { year, month }
      });
      
      const counts = {};
      res.data.forEach(item => {
        // 서버에서 이미 'dateStr'로 예쁘게 보내줌 (예: '2024-11-29')
        counts[item.dateStr] = item.count;
      });
      
      console.log(`${month}월 데이터 로드됨:`, counts); // 로그로 확인 가능
      setMonthlyCounts(counts);
    } catch (err) { 
      console.log("요약 로드 실패", err); 
    }
  };

  // 날짜 클릭
  const onDayPress = async (day) => {
    setSelectedDate(day.dateString);
    fetchDaySchedules(day.dateString);
    setTargetEndDate(new Date(day.dateString));
  };

  const fetchDaySchedules = async (date) => {
    try {
      const res = await axios.get(`${SERVER_URL}/api/schedule/date/${date}`);
      setDaySchedules(res.data);
    } catch (err) { console.log("일정 로드 실패"); }
  };

  const handleAddSchedule = async () => {
    if (!selectedEmp) return Alert.alert("알림", "직원을 선택해주세요.");
    const startObj = new Date(selectedDate);
    if (targetEndDate < startObj) return Alert.alert("오류", "종료 날짜 오류");

    const formatTime = (date) => date.toTimeString().split(' ')[0];
    const formatDate = (date) => date.toISOString().split('T')[0];

    try {
      await axios.post(`${SERVER_URL}/api/schedule`, {
        userId: selectedEmp.id,
        startDate: selectedDate,
        endDate: formatDate(targetEndDate),
        startTime: formatTime(startTime),
        endTime: formatTime(endTime)
      });
      
      Alert.alert("성공", "등록되었습니다.");
      setModalVisible(false);
      fetchDaySchedules(selectedDate); 
      
      // 🔥 등록 후 캘린더 인원수도 갱신 (현재 보고 있는 달 기준)
      const current = new Date(selectedDate);
      fetchMonthlySummary(current.getFullYear(), current.getMonth() + 1);

    } catch (err) { Alert.alert("오류", "등록 실패"); }
  };

  const handleDelete = (id, name) => {
    Alert.alert("삭제", "일정을 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      { 
        text: "삭제", style: "destructive", 
        onPress: async () => {
          try {
            await axios.delete(`${SERVER_URL}/api/schedule/${id}`);
            fetchDaySchedules(selectedDate); 
            // 🔥 삭제 후 캘린더 인원수도 갱신
            const current = new Date(selectedDate);
            fetchMonthlySummary(current.getFullYear(), current.getMonth() + 1);
          } catch (err) { Alert.alert("오류", "삭제 실패"); }
        }
      }
    ]);
  };

  // 🔥 [핵심] 커스텀 날짜 컴포넌트
  const renderCustomDay = ({ date, state }) => {
    const count = monthlyCounts[date.dateString] || 0;
    const isSelected = selectedDate === date.dateString;

    return (
      <TouchableOpacity 
        activeOpacity={0.7}
        onPress={() => onDayPress(date)}
        style={[
          styles.dayContainer,
          isSelected && styles.selectedDayContainer // 선택된 날짜 스타일
        ]}
      >
        <Text style={[
          styles.dayText, 
          state === 'disabled' && styles.disabledText,
          isSelected && styles.selectedDayText // 선택된 날짜 텍스트 색상
        ]}>
          {date.day}
        </Text>
        
        {/* 근무자가 있을 때만 표시 */}
        {count > 0 && (
          <View style={[
            styles.countBadge,
            isSelected && styles.selectedCountBadge // 선택됐을 땐 흰색 배경
          ]}>
            <Text style={[
                styles.countText,
                isSelected && styles.selectedCountText
            ]}>{count}명</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // 피커 핸들러들 생략 (기존과 동일)
  const onChangeStartTime = (e, d) => { setShowStartPicker(false); if(d) setStartTime(d); };
  const onChangeEndTime = (e, d) => { setShowEndPicker(false); if(d) setEndTime(d); };
  const onChangeEndDate = (e, d) => { setShowDatePicker(false); if(d) setTargetEndDate(d); };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <ChevronLeft color="#333" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>근무표 관리</Text>
        <View style={{width: 24}} />
      </View>

      <View style={{padding: 16, backgroundColor: 'white'}}>
        <Calendar
          // 🔥 커스텀 렌더링 함수 연결
          dayComponent={renderCustomDay}
          
          // 달력 넘길 때 데이터 갱신
          onMonthChange={(month) => fetchMonthlySummary(month.year, month.month)}
          
          theme={{ todayTextColor: '#2ECC71', arrowColor: '#2ECC71' }}
        />
      </View>

      <View style={styles.scheduleListContainer}>
        <View style={styles.listHeader}>
            <Text style={styles.listTitle}>
                {selectedDate ? `${selectedDate} 근무자` : '날짜를 선택하세요'}
            </Text>
            {selectedDate && (
                <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}>
                    <Plus color="white" size={20} />
                    <Text style={{color:'white', fontWeight:'bold', marginLeft:4}}>일정 추가</Text>
                </TouchableOpacity>
            )}
        </View>

        <FlatList
            data={daySchedules}
            keyExtractor={item => item.id.toString()}
            renderItem={({item}) => (
                <View style={styles.scheduleItem}>
                    <View>
                        <View style={{flexDirection:'row', alignItems:'center', marginBottom: 4}}>
                            <User color="#555" size={16} />
                            <Text style={styles.empName}>{item.name}</Text>
                        </View>
                        <Text style={styles.timeText}>{item.startTime.slice(0,5)} ~ {item.endTime.slice(0,5)}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} style={{padding: 8}}>
                        <Trash2 color="#E74C3C" size={20} />
                    </TouchableOpacity>
                </View>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>근무자가 없습니다.</Text>}
        />
      </View>

      {/* 모달 (기존과 동일) */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>일정 등록</Text>
                <Text style={styles.label}>기간 설정</Text>
                <View style={styles.dateRangeContainer}>
                    <View style={styles.dateBox}>
                        <Text style={styles.dateLabel}>시작일</Text>
                        <Text style={styles.dateValue}>{selectedDate}</Text>
                    </View>
                    <ArrowRight color="#888" size={20} />
                    <TouchableOpacity style={[styles.dateBox, styles.dateBoxActive]} onPress={() => setShowDatePicker(true)}>
                        <Text style={styles.dateLabel}>종료일</Text>
                        <Text style={[styles.dateValue, {color: '#2ECC71'}]}>
                            {targetEndDate.toISOString().split('T')[0]}
                        </Text>
                    </TouchableOpacity>
                </View>
                {showDatePicker && (
                    <DateTimePicker value={targetEndDate} mode="date" display="default" minimumDate={new Date(selectedDate)} onChange={onChangeEndDate}/>
                )}
                <Text style={styles.label}>직원 선택</Text>
                <ScrollView style={{maxHeight: 120, marginBottom: 16}}>
                    {employees.map(emp => (
                        <TouchableOpacity key={emp.id} style={[styles.empSelect, selectedEmp?.id === emp.id && styles.empSelected]} onPress={() => setSelectedEmp(emp)}>
                            <Text style={{color: selectedEmp?.id === emp.id ? 'white' : '#333'}}>{emp.name}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
                <Text style={styles.label}>시간 설정</Text>
                <View style={styles.timeRow}>
                    <TouchableOpacity onPress={() => setShowStartPicker(true)} style={styles.timeBtn}>
                        <Text>시작: {startTime.getHours()}:{startTime.getMinutes().toString().padStart(2,'0')}</Text>
                    </TouchableOpacity>
                    <Text>~</Text>
                    <TouchableOpacity onPress={() => setShowEndPicker(true)} style={styles.timeBtn}>
                        <Text>종료: {endTime.getHours()}:{endTime.getMinutes().toString().padStart(2,'0')}</Text>
                    </TouchableOpacity>
                </View>
                {showStartPicker && <DateTimePicker value={startTime} mode="time" display="spinner" onChange={onChangeStartTime}/>}
                {showEndPicker && <DateTimePicker value={endTime} mode="time" display="spinner" onChange={onChangeEndTime}/>}
                <View style={styles.modalButtons}>
                    <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={() => setModalVisible(false)}><Text>취소</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.btn, styles.btnConfirm]} onPress={handleAddSchedule}><Text style={{color:'white', fontWeight:'bold'}}>등록</Text></TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F7' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 24, backgroundColor: 'white' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  scheduleListContainer: { flex: 1, padding: 20 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  listTitle: { fontSize: 16, fontWeight: 'bold', color: '#555' },
  addButton: { flexDirection: 'row', backgroundColor: '#2ECC71', padding: 8, borderRadius: 8, alignItems: 'center' },
  scheduleItem: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 1 },
  empName: { fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  timeText: { fontSize: 16, color: '#555' },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 20 },
  
  // 🔥 커스텀 날짜 스타일
  dayContainer: { alignItems: 'center', justifyContent: 'center', width: 32, height: 45 },
  selectedDayContainer: { backgroundColor: '#2ECC71', borderRadius: 8 }, // 선택된 날짜 배경
  dayText: { fontSize: 16, color: '#333', marginBottom: 2 },
  selectedDayText: { color: 'white', fontWeight: 'bold' }, // 선택된 날짜 글씨
  disabledText: { color: '#DDD' },
  
  // 인원수 뱃지 스타일
  countBadge: { backgroundColor: '#E8F8F5', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 },
  selectedCountBadge: { backgroundColor: 'rgba(255,255,255,0.3)' }, // 선택됐을 땐 반투명 흰색
  countText: { fontSize: 10, color: '#2ECC71', fontWeight: 'bold' },
  selectedCountText: { color: 'white' }, // 선택됐을 땐 흰색 글씨

  // 모달 스타일 (기존 동일)
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: 'white', borderRadius: 18, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 14, fontWeight: 'bold', color: '#888', marginBottom: 8 },
  empSelect: { padding: 12, borderRadius: 8, backgroundColor: '#F5F5F5', marginBottom: 8 },
  empSelected: { backgroundColor: '#2ECC71' },
  dateRangeContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, backgroundColor: '#F9F9F9', padding: 10, borderRadius: 8 },
  dateBox: { alignItems: 'center', flex: 1 },
  dateBoxActive: { borderWidth: 1, borderColor: '#2ECC71', borderRadius: 8, padding: 4, backgroundColor: '#E9F7EF' },
  dateLabel: { fontSize: 12, color: '#AAA', marginBottom: 4 },
  dateValue: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  timeBtn: { padding: 12, backgroundColor: '#F0F0F0', borderRadius: 8, flex: 1, alignItems: 'center', marginHorizontal: 4 },
  modalButtons: { flexDirection: 'row', gap: 10, marginTop: 10 },
  btn: { flex: 1, padding: 14, borderRadius: 8, alignItems: 'center' },
  btnCancel: { backgroundColor: '#E0E0E0' },
  btnConfirm: { backgroundColor: '#2ECC71' },
});