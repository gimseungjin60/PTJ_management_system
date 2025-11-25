import React, { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, FlatList, 
  ActivityIndicator, Alert 
} from 'react-native';
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { ChevronLeft, Plus, Bell } from 'lucide-react-native';
import { socket } from '../socket'; // 소켓 객체 가져오기
import { SERVER_URL } from '../config'; // config.js에서 서버 주소 가져오기


// ★ 현재 로그인한 사용자 역할 (나중에는 전역 상태나 토큰에서 가져와야 함)
// 테스트를 위해 'manager'로 설정하면 글쓰기 버튼이 보입니다. 'worker'면 안 보임.
const CURRENT_ROLE = 'manager'; 

export default function NoticeListScreen() {
  const navigation = useNavigation();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(false);

  // 공지사항 목록 가져오기
  const fetchNotices = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${SERVER_URL}/api/notices`);
      // 서버 응답이 { ok: true, items: [...] } 형태인지, 그냥 배열인지 확인 필요
      // notices.js 코드상으로는 배열을 반환함 (res.status(200).json(notices))
      setNotices(res.data);
    } catch (err) {
      console.log("공지 조회 실패:", err);
      Alert.alert("오류", "공지사항을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();

    // 🔔 실시간 공지 알림 수신 리스너
    socket.on('noticeBroadcast', (newNotice) => {
      // newNotice: { title: '...', content: '...', createdAt: '...' }
      Alert.alert("📢 새 공지사항", newNotice.title, [
        { text: "확인", onPress: () => fetchNotices() } // 확인 누르면 목록 갱신
      ]);
    });

    return () => {
      socket.off('noticeBroadcast');
    };
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.dateText}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
      <Text style={styles.cardContent}>{item.content}</Text>
      <Text style={styles.authorText}>작성자: {item.author_name}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <ChevronLeft color="#333" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>공지사항</Text>
        
        {/* 사장님일 때만 글쓰기 버튼 표시 */}
        {CURRENT_ROLE === 'manager' ? (
          <TouchableOpacity onPress={() => navigation.navigate('NoticeWrite')} style={styles.iconButton}>
            <Plus color="#2ECC71" size={24} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} /> // 공간 채우기용
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2ECC71" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={notices}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 24 }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 50 }}>
              <Bell color="#DDD" size={48} />
              <Text style={{ color: '#999', marginTop: 10 }}>등록된 공지사항이 없습니다.</Text>
            </View>
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
  card: { backgroundColor: 'white', padding: 20, borderRadius: 16, marginBottom: 16, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', flex: 1 },
  dateText: { fontSize: 12, color: '#999' },
  cardContent: { fontSize: 14, color: '#555', lineHeight: 20, marginBottom: 12 },
  authorText: { fontSize: 12, color: '#2ECC71', fontWeight: '600', alignSelf: 'flex-end' },
});