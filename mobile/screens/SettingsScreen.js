import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { useNavigation } from "@react-navigation/native";
import { ChevronLeft, LogOut, User } from 'lucide-react-native';

export default function SettingsScreen() {
  const navigation = useNavigation();

  const handleLogout = () => {
    Alert.alert("역할 변경", "처음 화면으로 돌아가시겠습니까?", [
      { text: "취소", style: "cancel" },
      { 
        text: "확인", 
        onPress: () => {
          // 네비게이션 스택을 초기화하고 RoleSelect로 이동
          navigation.reset({ index: 0, routes: [{ name: 'RoleSelect' }] });
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft color="#333" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>설정</Text>
      </View>

      <View style={{ padding: 24 }}>
        <View style={styles.profileCard}>
            <User color="#2ECC71" size={32} />
            <View style={{marginLeft: 16}}>
                <Text style={{fontSize: 18, fontWeight: 'bold'}}>사용자</Text>
                <Text style={{color: '#888'}}>user@example.com</Text>
            </View>
        </View>

        <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <LogOut color="#F39C12" size={24} />
            <Text style={styles.menuText}>역할 변경 (로그아웃)</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F7' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 24, backgroundColor: 'white' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 8 },
  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 24, borderRadius: 18, marginBottom: 24, elevation: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 16, borderRadius: 12, elevation: 1 },
  menuText: { marginLeft: 12, fontSize: 16, color: '#333' }
});