import React, { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, 
  ActivityIndicator, Alert, FlatList 
} from 'react-native';
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { ChevronLeft, Clock } from 'lucide-react-native';
import { SERVER_URL } from '../config'; // config.js에서 서버 주소 가져오기

export default function AttendanceHistoryScreen() {
  const navigation = useNavigation();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  // 출퇴근 기록 가져오기
  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${SERVER_URL}/api/manager/attendance`);
      setRecords(res.data);
    } catch (err) {
      console.log("기록 조회 실패:", err);
      Alert.alert("오류", "출퇴근 기록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.recordCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.dateText}>{item.date}</Text>
        <Text style={styles.nameText}>{item.name}</Text>
      </View>
      
      <View style={styles.row}>
        <View style={styles.timeBox}>
            <Text style={styles.label}>출근</Text>
            <Text style={styles.timeText}>{item.in}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.timeBox}>
            <Text style={styles.label}>퇴근</Text>
            <Text style={[styles.timeText, item.out === '근무 중' && styles.workingText]}>
                {item.out}
            </Text>
        </View>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.hoursLabel}>총 근무 시간</Text>
        <Text style={styles.hoursText}>{item.hours}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <ChevronLeft color="#333" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>출퇴근 기록 전체보기</Text>
        <TouchableOpacity onPress={fetchHistory} style={styles.iconButton}>
            {/* 새로고침 버튼 역할 */}
            <Clock color="#2ECC71" size={24} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2ECC71" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 24 }}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', color: '#999', marginTop: 50 }}>
              기록이 없습니다.
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F7' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: 'white', elevation: 2 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  iconButton: { padding: 8 },
  recordCard: { backgroundColor: 'white', padding: 20, borderRadius: 18, marginBottom: 16, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingBottom: 10 },
  dateText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  nameText: { fontSize: 16, fontWeight: 'bold', color: '#2ECC71' },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  timeBox: { flex: 1, alignItems: 'center' },
  label: { fontSize: 12, color: '#888', marginBottom: 4 },
  timeText: { fontSize: 18, fontWeight: '600', color: '#333' },
  workingText: { color: '#E74C3C', fontWeight: 'bold' }, // 근무 중일 때 빨간색
  divider: { width: 1, height: 30, backgroundColor: '#E0E0E0' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9F9F9', padding: 12, borderRadius: 8 },
  hoursLabel: { fontSize: 14, color: '#555' },
  hoursText: { fontSize: 16, fontWeight: 'bold', color: '#333' }
});