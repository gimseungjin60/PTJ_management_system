import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function RoleSelectScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>사용자 선택</Text>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#4CAF50" }]}
        onPress={() => navigation.replace("Home")}
      >
        <Text style={styles.btnText}>알바생으로 시작하기</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#2196F3" }]}
        onPress={() => navigation.replace("Manager")}
      >
        <Text style={styles.btnText}>사장님으로 시작하기</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 30 },
  title: { fontSize: 30, fontWeight: "700", marginBottom: 40 },
  button: { width: "100%", paddingVertical: 15, borderRadius: 8, marginBottom: 20 },
  btnText: { fontSize: 18, textAlign: "center", color: "#fff", fontWeight: "600" },
});
