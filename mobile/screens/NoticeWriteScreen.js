import React, { useState } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, TextInput, Alert 
} from 'react-native';
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { ChevronLeft, Send } from 'lucide-react-native';
import { SERVER_URL } from '../config'; // config.js에서 서버 주소 가져오기


export default function NoticeWriteScreen() {
  const navigation = useNavigation();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePost = async () => {
    if (!title.trim() || !content.trim()) {
      return Alert.alert("알림", "제목과 내용을 모두 입력해주세요.");
    }

    try {
      setLoading(true);
      // 작성자 ID (지금은 테스트용으로 1번(박사장) 고정)
      // 나중에는 로그인 정보에서 가져와야 합니다.
      const authorId = 1; 

      await axios.post(`${SERVER_URL}/api/notices`, {
        authorId,
        title,
        content
      });

      /*Alert.alert("성공", "공지사항이 등록되었습니다.", [
        { text: "확인", onPress: () => navigation.goBack() } // 작성 후 목록으로 돌아감
      ]);*/
      console.log("등록 완료, 화면 이동");
      navigation.goBack(); // 바로 목록으로 이동
    } catch (err) {
      console.log("공지 등록 실패:", err);
      Alert.alert("오류", "공지사항 등록에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <ChevronLeft color="#333" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>공지사항 작성</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>제목</Text>
        <TextInput 
          style={styles.input} 
          placeholder="제목을 입력하세요" 
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>내용</Text>
        <TextInput 
          style={[styles.input, styles.textArea]} 
          placeholder="공지 내용을 입력하세요" 
          multiline 
          textAlignVertical="top"
          value={content}
          onChangeText={setContent}
        />

        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.disabledButton]} 
          onPress={handlePost}
          disabled={loading}
        >
          <Send color="white" size={20} style={{ marginRight: 8 }} />
          <Text style={styles.submitText}>{loading ? "등록 중..." : "작성 완료"}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F7' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: 'white', elevation: 2 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  iconButton: { padding: 8 },
  content: { padding: 24 },
  label: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: 'white', padding: 16, borderRadius: 12, fontSize: 16, elevation: 1 },
  textArea: { height: 200 },
  submitButton: { flexDirection: 'row', backgroundColor: '#2ECC71', padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 32, elevation: 2 },
  disabledButton: { backgroundColor: '#A5D6A7' },
  submitText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});