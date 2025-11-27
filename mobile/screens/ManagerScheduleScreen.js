import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Modal, FlatList, Alert, ScrollView } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
// Calendar 아이콘 추가된 import
import { ChevronLeft, Plus, Clock, User, Trash2, Calendar as CalendarIcon, ArrowRight } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SERVER_URL } from '../config';

export default function ManagerScheduleScreen() {
  const navigation = useNavigation();
  
  const [selectedDate, setSelectedDate] = useState(''); // 이게 시작 날짜 역할
  const [daySchedules, setDaySchedules] = useState([]); 
  const [employees, setEmployees] = useState([]); 
  
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  
  // 시간 설정 상태
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // 🔥 [추가됨] 종료 날짜 상태 (기본값은 오늘)
  const [targetEndDate, setTargetEndDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // 1. 직원 목록 로드
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await axios.get(`${SERVER_URL}/api/manager/employees`);
        setEmployees(res.data);
      } catch (err) { console.log("직원 로드 실패"); }
    };
    fetchEmployees();
  }, []);

  // 2. 날짜 클릭 -> 해당 날짜 일정 로드 & 모달 열 때 시작/종료일 초기화
  const onDayPress = async (day) => {
    setSelectedDate(day.dateString);
    fetchDaySchedules(day.dateString);
    
    // 모달 열 때 쓸 종료일도 클릭한 날짜로 초기화
    setTargetEndDate(new Date(day.dateString));
  };

  const fetchDaySchedules = async (date) => {
    try {
      const res = await axios.get(`${SERVER_URL}/api/schedule/date/${date}`);
      setDaySchedules(res.data);
    } catch (err) { console.log("일정 로드 실패"); }
  };

  // 🔥 3. [수정됨] 기간 일괄 등록 요청
  const handleAddSchedule = async () => {
    if (!selectedEmp) {
      Alert.alert("알림", "직원을 선택해주세요.");
      return;
    }
    // 시작일(selectedDate)보다 종료일(targetEndDate)이 앞서면 안됨
    const startObj = new Date(selectedDate);
    if (targetEndDate < startObj) {
        Alert.alert("오류", "종료 날짜는 시작 날짜보다 같거나 뒤여야 합니다.");
        return;
    }

    const formatTime = (date) => date.toTimeString().split(' ')[0]; // HH:MM:00
    const formatDate = (date) => date.toISOString().split('T')[0]; // YYYY-MM-DD

    try {
      await axios.post(`${SERVER_URL}/api/schedule`, {
        userId: selectedEmp.id,
        startDate: selectedDate,         // 시작일 (캘린더에서 클릭한 날)
        endDate: formatDate(targetEndDate), // 종료일 (피커로 선택한 날)
        startTime: formatTime(startTime),
        endTime: formatTime(endTime)
      });
      
      Alert.alert("성공", `${selectedEmp.name}님의 일정이 등록되었습니다.`);
      setModalVisible(false);
      fetchDaySchedules(selectedDate); // 현재 보고 있는 날짜 목록 갱신
    } catch (err) {
      Alert.alert("오류", "일정 등록 실패");
      console.log(err);
    }
  };

  // 피커 핸들러들
  const onChangeStartTime = (e, d) => { setShowStartPicker(false); if(d) setStartTime(d); };
  const onChangeEndTime = (e, d) => { setShowEndPicker(false); if(d) setEndTime(d); };
  // 🔥 날짜 피커 핸들러
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
          onDayPress={onDayPress}
          markedDates={{ [selectedDate]: { selected: true, selectedColor: '#2ECC71' } }}
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
                    <View style={{flexDirection:'row', alignItems:'center'}}>
                        <User color="#555" size={20} />
                        <Text style={styles.empName}>{item.name}</Text>
                    </View>
                    <Text style={styles.timeText}>{item.startTime.slice(0,5)} ~ {item.endTime.slice(0,5)}</Text>
                </View>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>등록된 일정이 없습니다.</Text>}
        />
      </View>

      {/* 모달 */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>일정 등록</Text>

                {/* 🔥 기간 설정 UI 추가 */}
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

                {/* 날짜 선택기 (종료일용) */}
                {showDatePicker && (
                    <DateTimePicker 
                        value={targetEndDate} 
                        mode="date" 
                        display="default"
                        // selectedDate가 있으면 new Date()로 만들고, 없으면 undefined (제한 없음)
                        minimumDate={selectedDate ? new Date(selectedDate) : undefined}
                    onChange={onChangeEndDate}
                    />
                )}

                <Text style={styles.label}>직원 선택</Text>
                <ScrollView style={{maxHeight: 120, marginBottom: 16}}>
                    {employees.map(emp => (
                        <TouchableOpacity 
                            key={emp.id} 
                            style={[styles.empSelect, selectedEmp?.id === emp.id && styles.empSelected]}
                            onPress={() => setSelectedEmp(emp)}
                        >
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
                    <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={() => setModalVisible(false)}>
                        <Text>취소</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.btn, styles.btnConfirm]} onPress={handleAddSchedule}>
                        <Text style={{color:'white', fontWeight:'bold'}}>일괄 등록</Text>
                    </TouchableOpacity>
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
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: 'white', borderRadius: 18, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 14, fontWeight: 'bold', color: '#888', marginBottom: 8 },
  empSelect: { padding: 12, borderRadius: 8, backgroundColor: '#F5F5F5', marginBottom: 8 },
  empSelected: { backgroundColor: '#2ECC71' },
  
  // 🔥 날짜 기간 스타일 추가
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