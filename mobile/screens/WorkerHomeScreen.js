import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Platform } from 'react-native';
import { useNavigation } from "@react-navigation/native";
import { ChevronLeft, Clock, Calendar, Settings } from 'lucide-react-native';

export default function WorkerHomeScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <ChevronLeft color="#333" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>홈 화면</Text>
        <TouchableOpacity style={styles.iconButton}>
          <Settings color="#333" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeSubText}>안녕하세요,</Text>
          <Text style={styles.welcomeText}>알바생님 👋</Text>
        </View>

        <View style={styles.cardContainer}>
          {/* 이 버튼을 누르면 아까 수정한 WorkerScreen(출퇴근 기능)으로 이동 */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Worker')} 
            style={[styles.actionCard, styles.gradientCardFallback]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.iconCircleTransparent}>
                <Clock color="white" size={24} />
              </View>
              <Text style={styles.emojiIcon}>⏰</Text>
            </View>
            <Text style={styles.cardTitleWhite}>출퇴근 하기</Text>
            <Text style={styles.cardSubtitleWhite}>출근 및 퇴근 체크</Text>
          </TouchableOpacity>
          
          {/* ... (다른 카드들 추가 가능) ... */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F7' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 24, backgroundColor: 'white' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  scrollContent: { padding: 24 },
  welcomeSection: { marginBottom: 32 },
  welcomeText: { fontSize: 24, fontWeight: 'bold' },
  welcomeSubText: { color: '#888', fontSize: 16 },
  actionCard: { padding: 24, borderRadius: 18, marginBottom: 16, elevation: 5 },
  gradientCardFallback: { backgroundColor: '#2ECC71' },
  cardTitleWhite: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  cardSubtitleWhite: { color: 'rgba(255,255,255,0.8)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  iconCircleTransparent: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 20 },
  emojiIcon: { fontSize: 24 }
});