import React, { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, FlatList, 
  Alert, Modal, TextInput, ActivityIndicator, 
  KeyboardAvoidingView, Platform 
} from 'react-native';
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
// 👇 Edit2(연필) 아이콘 추가
import { ChevronLeft, Plus, Trash2, User, Edit2 } from 'lucide-react-native';
import { SERVER_URL } from '../config'; 

export default function EmployeeListScreen() {
  const navigation = useNavigation();
  
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // 모달 상태 (등록용 / 수정용)
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);

  // 입력 폼 상태
  const [newEmp, setNewEmp] = useState({ userId: '', password: '', name: '', wage: '' });
  const [editTarget, setEditTarget] = useState({ id: null, name: '', wage: '' });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${SERVER_URL}/api/manager/employees`);
      setEmployees(res.data);
    } catch (err) { console.log("목록 로드 실패"); } 
    finally { setLoading(false); }
  };

  // 1. 직원 등록
  const handleAddEmployee = async () => {
    if (!newEmp.userId || !newEmp.password || !newEmp.name) return Alert.alert("알림", "필수 정보 누락");
    try {
      await axios.post(`${SERVER_URL}/api/manager/employees`, {
        userId: newEmp.userId, password: newEmp.password, name: newEmp.name, hourlyWage: parseInt(newEmp.wage) || 0
      });
      Alert.alert("성공", "등록되었습니다.");
      setAddModalVisible(false);
      setNewEmp({ userId: '', password: '', name: '', wage: '' });
      fetchEmployees();
    } catch (err) { Alert.alert("오류", "등록 실패"); }
  };

  // 2. 직원 삭제
  const handleDelete = (id, name) => {
    Alert.alert("삭제", `'${name}' 직원을 삭제하시겠습니까?`, [
      { text: "취소", style: "cancel" },
      { text: "삭제", style: "destructive", onPress: async () => {
          try {
            await axios.delete(`${SERVER_URL}/api/manager/employees/${id}`);
            fetchEmployees();
          } catch (err) { Alert.alert("오류", "삭제 실패"); }
        }}
    ]);
  };

  // 🔥 3. 수정 모달 열기
  const openEditModal = (emp) => {
    setEditTarget({ id: emp.id, name: emp.name, wage: String(emp.hourly_wage) });
    setEditModalVisible(true);
  };

  // 🔥 4. 시급 수정 요청
  const handleUpdateWage = async () => {
    try {
      await axios.put(`${SERVER_URL}/api/manager/employees/wage`, {
        id: editTarget.id,
        hourlyWage: parseInt(editTarget.wage) || 0
      });
      Alert.alert("성공", "시급이 수정되었습니다.");
      setEditModalVisible(false);
      fetchEmployees();
    } catch (err) { Alert.alert("오류", "수정 실패"); }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={{flexDirection: 'row', alignItems: 'center'}}>
        <View style={styles.profileCircle}><User color="#555" size={20} /></View>
        <View>
            <Text style={styles.nameText}>{item.name} ({item.user_id})</Text>
            <Text style={styles.wageText}>시급: {item.hourly_wage.toLocaleString()}원</Text>
        </View>
      </View>
      <View style={{flexDirection: 'row'}}>
        {/* 수정 버튼 */}
        <TouchableOpacity onPress={() => openEditModal(item)} style={{padding: 8, marginRight: 4}}>
            <Edit2 color="#3498DB" size={20} />
        </TouchableOpacity>
        {/* 삭제 버튼 */}
        <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} style={{padding: 8}}>
            <Trash2 color="#E74C3C" size={20} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{padding: 8}}>
          <ChevronLeft color="#333" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>직원 관리</Text>
        <TouchableOpacity onPress={() => setAddModalVisible(true)} style={{padding: 8}}>
          <Plus color="#2ECC71" size={24} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2ECC71" style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={employees}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{padding: 24}}
          ListEmptyComponent={<Text style={{textAlign: 'center', color: '#999', marginTop: 50}}>직원이 없습니다.</Text>}
        />
      )}

      {/* 🟢 등록 모달 */}
      <Modal animationType="slide" transparent={true} visible={addModalVisible}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>직원 등록</Text>
            <TextInput 
                style={styles.input} placeholder="아이디 (예: worker03)" 
                value={newEmp.userId} onChangeText={t => setNewEmp({...newEmp, userId: t})}
            />
            <TextInput 
                style={styles.input} placeholder="비밀번호" 
                value={newEmp.password} onChangeText={t => setNewEmp({...newEmp, password: t})}
            />
            <TextInput 
                style={styles.input} placeholder="이름 (예: 박신입)" 
                value={newEmp.name} onChangeText={t => setNewEmp({...newEmp, name: t})}
            />
            <TextInput 
                style={styles.input} placeholder="시급 (숫자만 입력)" keyboardType="numeric"
                value={newEmp.wage} onChangeText={t => setNewEmp({...newEmp, wage: t})}
            />
            <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={() => setAddModalVisible(false)}><Text>취소</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.btnConfirm]} onPress={handleAddEmployee}><Text style={{color:'white', fontWeight:'bold'}}>등록</Text></TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 🔵 수정 모달 */}
      <Modal animationType="fade" transparent={true} visible={editModalVisible}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editTarget.name}님 정보 수정</Text>
            <Text style={styles.label}>변경할 시급</Text>
            <TextInput 
                style={styles.input} 
                placeholder="시급 입력" 
                keyboardType="numeric" 
                value={editTarget.wage} 
                onChangeText={t => setEditTarget({...editTarget, wage: t})} 
            />
            <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={() => setEditModalVisible(false)}><Text>취소</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.btn, {backgroundColor: '#3498DB'}]} onPress={handleUpdateWage}><Text style={{color:'white', fontWeight:'bold'}}>수정 완료</Text></TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F7' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: 'white', elevation: 2 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 1 },
  profileCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  nameText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  wageText: { fontSize: 14, color: '#888' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: 'white', borderRadius: 18, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 14, color: '#666', marginBottom: 8 },
  input: { backgroundColor: '#F5F5F5', padding: 12, borderRadius: 8, marginBottom: 12, fontSize: 16 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, gap: 10 },
  btn: { flex: 1, padding: 14, borderRadius: 8, alignItems: 'center' },
  btnCancel: { backgroundColor: '#E0E0E0' },
  btnConfirm: { backgroundColor: '#2ECC71' },
});