import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation } from "@react-navigation/native";
import { ChevronLeft } from 'lucide-react-native';

export default function PlaceholderScreen({ route }) {
  const navigation = useNavigation();
  // route.params가 없으면 기본값으로 '화면' 사용
  const title = route.params?.title || '화면'; 

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F7F7F7' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 24, backgroundColor: 'white' }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft color="#333" size={24} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginLeft: 8 }}>{title}</Text>
      </View>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 24 }}>🚧</Text>
        <Text style={{ fontSize: 18, marginTop: 10, color: '#888' }}>개발 중입니다</Text>
      </View>
    </SafeAreaView>
  );
}