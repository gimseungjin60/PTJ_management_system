import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useNavigation } from "@react-navigation/native";
import { ChevronLeft } from 'lucide-react-native';

export default function AttendanceHistoryScreen() {
  const navigation = useNavigation();
  // 더미 데이터
  const records = [
    { date: '2025.11.25', in: '09:00', out: '18:00', hours: '9h' },
    { date: '2025.11.24', in: '08:55', out: '18:10', hours: '9h 15m' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <ChevronLeft color="#333" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>출퇴근 기록</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {records.map((item, idx) => (
            <View key={idx} style={styles.recordCard}>
                <Text style={styles.dateText}>{item.date}</Text>
                <View style={styles.row}>
                    <Text>출근: {item.in}</Text>
                    <Text>퇴근: {item.out}</Text>
                </View>
                <Text style={styles.hoursText}>{item.hours}</Text>
            </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F7' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 24, backgroundColor: 'white' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 8 },
  scrollContent: { padding: 24 },
  recordCard: { backgroundColor: 'white', padding: 20, borderRadius: 18, marginBottom: 16, elevation: 2 },
  dateText: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  hoursText: { color: '#2ECC71', fontWeight: 'bold', alignSelf: 'flex-end' }
});