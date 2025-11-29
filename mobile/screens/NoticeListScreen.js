import React, { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, FlatList, 
  ActivityIndicator, Alert 
} from 'react-native';
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage'; // 👈 추가됨
import axios from "axios";
import { ChevronLeft, Plus, Bell, Trash2 } from 'lucide-react-native';
import { socket } from '../socket'; 
import { SERVER_URL } from '../config'; 

export default function NoticeListScreen() {
  const navigation = useNavigation();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // 🔥 내 직급 상태
  const [userRole, setUserRole] = useState(''); 

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${SERVER_URL}/api/notices`);
      setNotices(res.data);
    } catch (err) {
      console.log("공지 조회 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();

    // 🔥 1. 내 직급 가져오기 ('manager' 인지 'worker' 인지 확인)
    AsyncStorage.getItem('userRole').then(role => {
      setUserRole(role);
    });

    socket.on('noticeBroadcast', () => {
      fetchNotices();
    });

    return () => {
      socket.off('noticeBroadcast');
    };
  }, []);

  const handleDelete = (id) => {
    Alert.alert("삭제", "공지사항을 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      { 
        text: "삭제", 
        style: "destructive",
        onPress: async () => {
          try {
            await axios.delete(`${SERVER_URL}/api/notices/${id}`);
            fetchNotices();
          } catch (err) { Alert.alert("오류", "삭제 실패"); }
        }
      }
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        
        {/* 🔥 2. 사장님(manager)일 때만 삭제(휴지통) 버튼 표시 */}
        {userRole === 'manager' && (
          <TouchableOpacity onPress={() => handleDelete(item.id)} style={{padding: 4}}>
            <Trash2 color="#E74C3C" size={20} />
          </TouchableOpacity>
        )}
      </View>
      
      <Text style={styles.dateText}>{new Date(item.created_at).toLocaleDateString()}</Text>
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
        
        {/* 🔥 3. 사장님(manager)일 때만 글쓰기(+) 버튼 표시 */}
        {userRole === 'manager' ? (
          <TouchableOpacity onPress={() => navigation.navigate('NoticeWrite')} style={styles.iconButton}>
            <Plus color="#2ECC71" size={24} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} /> // 알바생은 빈 공간만 보여줌
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
              <Text style={{ color: '#999', marginTop: 10 }}>공지사항이 없습니다.</Text>
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', flex: 1, marginRight: 10 },
  dateText: { fontSize: 12, color: '#999', marginBottom: 12 },
  cardContent: { fontSize: 14, color: '#555', lineHeight: 20, marginBottom: 12 },
  authorText: { fontSize: 12, color: '#2ECC71', fontWeight: '600', alignSelf: 'flex-end' },
});