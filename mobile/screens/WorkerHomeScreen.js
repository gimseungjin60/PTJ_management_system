import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert, Modal 
} from 'react-native';
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from "axios"; // axios 추가
import { ChevronLeft, Clock, Calendar, Settings, Bell, CalendarClock, X } from 'lucide-react-native';
import { socket } from '../socket';
import { SERVER_URL } from '../config';

export default function WorkerHomeScreen() {
  const navigation = useNavigation();
  const [workInfo, setWorkInfo] = useState({ text: '일정 없음', time: '' });
  
  // 🔥 팝업 관련 상태 (새로 추가됨)
  const [modalVisible, setModalVisible] = useState(false);
  const [latestNotice, setLatestNotice] = useState(null);

  // 화면이 포커스될 때마다 실행
  useFocusEffect(
    useCallback(() => {
      loadSchedule();
      checkNewNotice(); // 🔥 공지 확인 함수 실행
    }, [])
  );

  const loadSchedule = async () => {
    try {
      const storedTime = await AsyncStorage.getItem('workStartTime');
      if (!storedTime) {
        setWorkInfo({ text: '정해진 출근 시간이 없습니다.', time: '' });
        return;
      }
      const now = new Date();
      const [h, m] = storedTime.split(':').map(Number);
      const targetTime = new Date();
      targetTime.setHours(h, m, 0, 0);
      let dayLabel = "오늘";
      if (now > targetTime) dayLabel = "내일";

      setWorkInfo({
        text: `${dayLabel} 출근 예정`,
        time: `${h}시 ${m}분`
      });
    } catch (e) { console.log("일정 로드 실패", e); }
  };

  // 🔥 [핵심] 새 공지사항 확인 로직
  const checkNewNotice = async () => {
    try {
      // 1. 서버에서 공지사항 목록 가져오기
      const res = await axios.get(`${SERVER_URL}/api/notices`);
      const notices = res.data;

      if (notices.length > 0) {
        const newest = notices[0]; // 맨 위에 있는 게 최신 글 (서버가 정렬해서 준다고 가정)
        
        // 2. 내 폰에 저장된 '마지막으로 본 공지 ID' 가져오기
        const lastSeenId = await AsyncStorage.getItem('lastSeenNoticeId');

        // 3. 저장된 ID가 없거나, 서버의 최신 글 ID가 더 크면 -> 새 글이다!
        if (!lastSeenId || newest.id > parseInt(lastSeenId)) {
          setLatestNotice(newest);
          setModalVisible(true); // 팝업 띄우기
        }
      }
    } catch (e) {
      console.log("공지 확인 실패:", e);
    }
  };

  // 🔥 팝업 닫기 (읽음 처리)
  const closeNoticeModal = async () => {
    if (latestNotice) {
      // 현재 본 공지의 ID를 저장 (다음에 안 뜨게 하려고)
      await AsyncStorage.setItem('lastSeenNoticeId', String(latestNotice.id));
    }
    setModalVisible(false);
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

        {/* 출근 일정 카드 */}
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

          {/* 급여 및 일정 카드 (추가) */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Schedule')}
            style={[styles.actionCard, styles.cardWhite]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.iconCircleGray}>
                <Calendar color="#3498DB" size={24} />
              </View>
              <Text style={styles.emojiIcon}>📅</Text>
            </View>
            <Text style={styles.cardTitleBlack}>급여 및 일정</Text>
            <Text style={styles.cardSubtitleGray}>이번 달 일정과 월급 확인</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 🔥 [새로 추가됨] 공지사항 팝업 Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeNoticeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📢 새로운 공지사항</Text>
              <TouchableOpacity onPress={closeNoticeModal}>
                <X color="#999" size={24} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.noticeTitle}>{latestNotice?.title}</Text>
              <Text style={styles.noticeContent}>{latestNotice?.content}</Text>
              <Text style={styles.noticeDate}>
                {latestNotice ? new Date(latestNotice.created_at).toLocaleDateString() : ''}
              </Text>
            </View>

            <TouchableOpacity style={styles.closeButton} onPress={closeNoticeModal}>
              <Text style={styles.closeButtonText}>확인했습니다</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F7' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 24, backgroundColor: 'white', elevation: 2 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  iconButton: { padding: 4 },
scrollContent: { padding: 24, paddingBottom: 100 },
  welcomeSection: { marginBottom: 24 },
  welcomeText: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  welcomeSubText: { color: '#888', fontSize: 16 },
  
  scheduleCard: { 
    backgroundColor: 'white', borderRadius: 18, padding: 20, marginBottom: 24, elevation: 2,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'
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
  emojiIcon: { fontSize: 24 },

  // 🔥 팝업 스타일
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', borderRadius: 20, width: '100%', maxWidth: 340, padding: 24, elevation: 5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#F39C12' },
  modalBody: { marginBottom: 24 },
  noticeTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  noticeContent: { fontSize: 16, color: '#555', lineHeight: 22, marginBottom: 16 },
  noticeDate: { fontSize: 12, color: '#AAA', textAlign: 'right' },
  closeButton: { backgroundColor: '#2ECC71', padding: 16, borderRadius: 12, alignItems: 'center' },
  closeButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});