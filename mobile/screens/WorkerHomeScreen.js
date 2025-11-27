import React, { useState, useCallback } from 'react'; // useCallback 추가
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from "@react-navigation/native"; // useFocusEffect 추가
import AsyncStorage from '@react-native-async-storage/async-storage'; // AsyncStorage 추가
import { ChevronLeft, Clock, Bell, CalendarClock } from 'lucide-react-native'; // CalendarClock 아이콘 추가

// 소켓 import (로그아웃용)
import { socket } from '../socket';

export default function WorkerHomeScreen() {
  const navigation = useNavigation();
  const [workInfo, setWorkInfo] = useState({ text: '일정 없음', time: '' });

  // 🔥 화면이 포커스될 때마다(홈으로 돌아올 때마다) 실행
  useFocusEffect(
    useCallback(() => {
      loadSchedule();
    }, [])
  );

  const loadSchedule = async () => {
    try {
      const storedTime = await AsyncStorage.getItem('workStartTime'); // 예: "09:00:00"
      
      if (!storedTime) {
        setWorkInfo({ text: '정해진 출근 시간이 없습니다.', time: '' });
        return;
      }

      // "오늘"인지 "내일"인지 계산하는 로직
      const now = new Date();
      const [h, m] = storedTime.split(':').map(Number);
      
      // 출근 예정 시간 객체 생성
      const targetTime = new Date();
      targetTime.setHours(h, m, 0, 0);

      let dayLabel = "오늘";
      
      // 만약 현재 시간이 이미 출근 시간을 지났다면 -> "내일"로 표시
      // (단, 1시간 정도 늦은 건 지각으로 칠 수 있으니, 
      //  퇴근했을 법한 4시간 이후 정도로 넉넉하게 잡거나, 단순하게 현재 시간 기준 비교)
      if (now > targetTime) {
         dayLabel = "내일";
      }

      setWorkInfo({
        text: `${dayLabel} 출근 예정`,
        time: `${h}시 ${m}분`
      });

    } catch (e) {
      console.log("일정 로드 실패", e);
    }
  };

  const handleLogout = () => {
    Alert.alert("로그아웃", "정말 로그아웃 하시겠습니까?", [
      { text: "취소", style: "cancel" },
      { 
        text: "확인", onPress: () => {
          socket.disconnect();
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleLogout} style={styles.iconButton}>
          <ChevronLeft color="#333" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>홈 화면</Text>
        <View style={{width: 24}}></View> 
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeSubText}>안녕하세요,</Text>
          <Text style={styles.welcomeText}>알바생님 👋</Text>
        </View>

        {/* 👇 [새로 추가된 부분] 출근 일정 카드 👇 */}
        <View style={styles.scheduleCard}>
          <View style={styles.scheduleHeader}>
            <CalendarClock color="#2ECC71" size={24} />
            <Text style={styles.scheduleTitle}>다음 출근</Text>
          </View>
          <View>
             <Text style={styles.scheduleText}>{workInfo.text}</Text>
             {workInfo.time ? <Text style={styles.scheduleTime}>{workInfo.time}</Text> : null}
          </View>
        </View>
        {/* 👆 [여기까지] 👆 */}

        <View style={styles.cardContainer}>
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

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('NoticeList')}
            style={[styles.actionCard, styles.cardWhite]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.iconCircleGray}>
                <Bell color="#F39C12" size={24} />
              </View>
              <Text style={styles.emojiIcon}>📢</Text>
            </View>
            <Text style={styles.cardTitleBlack}>공지사항 확인</Text>
            <Text style={styles.cardSubtitleGray}>사장님이 올린 공지 보기</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Schedule')} // 👈 Schedule 화면으로 이동
            style={[styles.actionCard, styles.cardWhite]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.iconCircleGray}>
                {/* 캘린더와 돈 아이콘 */}
                <CalendarClock color="#3498DB" size={24} /> 
              </View>
              <Text style={styles.emojiIcon}>📅</Text>
            </View>
            <Text style={styles.cardTitleBlack}>급여 및 일정</Text>
            <Text style={styles.cardSubtitleGray}>이번 달 일정과 월급 확인</Text>
          </TouchableOpacity>
        </View>

        
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F7' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 24, backgroundColor: 'white', elevation: 2 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  iconButton: { padding: 4 },
  scrollContent: { padding: 24 },
  welcomeSection: { marginBottom: 24 }, // 간격 조금 조정
  welcomeText: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  welcomeSubText: { color: '#888', fontSize: 16 },
  
  // 새로 추가된 스케줄 카드 스타일
  scheduleCard: { 
    backgroundColor: 'white', 
    borderRadius: 18, 
    padding: 20, 
    marginBottom: 24, 
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  scheduleHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  scheduleTitle: { fontSize: 16, fontWeight: 'bold', color: '#555' },
  scheduleText: { fontSize: 14, color: '#888', textAlign: 'right' },
  scheduleTime: { fontSize: 20, fontWeight: 'bold', color: '#333', textAlign: 'right' },

  cardContainer: { gap: 16 },
  actionCard: { padding: 24, borderRadius: 18, marginBottom: 16, elevation: 5 },
  gradientCardFallback: { backgroundColor: '#2ECC71' },
  cardTitleWhite: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  cardSubtitleWhite: { color: 'rgba(255,255,255,0.8)' },
  cardTitleBlack: { color: '#333', fontSize: 20, fontWeight: 'bold' },
  cardSubtitleGray: { color: '#AAAAAA' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  iconCircleTransparent: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 20 },
  iconCircleGray: { backgroundColor: '#F0F0F0', padding: 8, borderRadius: 20 },
  emojiIcon: { fontSize: 24 }
});