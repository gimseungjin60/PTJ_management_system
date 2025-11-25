import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { useNavigation } from "@react-navigation/native"; // 네비게이션 훅 가져오기

export default function RoleSelectScreen() {
  const navigation = useNavigation(); // 네비게이션 객체 사용

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>역할을 선택하세요</Text>
          <Text style={styles.headerSubtitle}>출퇴근 관리 시스템</Text>
        </View>

        {/* 카드 영역 */}
        <View style={styles.cardContainer}>
          
          {/* 알바생 카드 -> WorkerHome으로 이동 */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('WorkerHome')} 
            style={[styles.card, styles.cardWhite]}
          >
            <Text style={styles.emoji}>👷‍♂️</Text>
            <Text style={styles.cardTitle}>알바생으로 시작</Text>
            <Text style={styles.cardSubtitle}>출근 / 퇴근 기록</Text>
          </TouchableOpacity>

          {/* 사장님 카드 -> ManagerHome으로 이동 */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('ManagerHome')}
            style={[styles.card, styles.cardGreen]}
          >
            <Text style={styles.emoji}>👑</Text>
            <Text style={[styles.cardTitle, styles.textGreen]}>사장님으로 시작</Text>
            <Text style={[styles.cardSubtitle, styles.textGreenLight]}>
              직원 출퇴근 실시간 모니터링
            </Text>
          </TouchableOpacity>

        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  contentContainer: { flex: 1, paddingHorizontal: 24, paddingTop: 40, paddingBottom: 32 },
  header: { alignItems: 'center', marginBottom: 48 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  headerSubtitle: { fontSize: 16, color: '#AAAAAA' },
  cardContainer: { flex: 1, justifyContent: 'center', gap: 20 },
  card: { borderRadius: 18, padding: 24, width: '100%', marginBottom: 20, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12 }, android: { elevation: 4 } }) },
  cardWhite: { backgroundColor: '#FFFFFF' },
  cardGreen: { backgroundColor: '#E9F7EF' },
  emoji: { fontSize: 48, marginBottom: 16 },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#333', marginBottom: 8 },
  cardSubtitle: { fontSize: 14, color: '#AAAAAA' },
  textGreen: { color: '#1E8449' },
  textGreenLight: { color: '#1E8449', opacity: 0.7 },
});