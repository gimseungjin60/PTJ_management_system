import { View, Text, StyleSheet, Button } from "react-native";
import { socket } from "../socket";

export default function HomeScreen() {
  const handleCheckIn = () => {
    socket.emit("checkIn", {
      userId: 1,
      name: "승진",
      time: new Date().toISOString(),
    });
  };

  const handleCheckOut = () => {
    socket.emit("checkOut", {
      userId: 1,
      name: "승진",
      time: new Date().toISOString(),
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>출퇴근 화면</Text>

      <Button title="출근하기" onPress={handleCheckIn} />

      <View style={{ marginTop: 20 }}>
        <Button title="퇴근하기" color="red" onPress={handleCheckOut} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, marginBottom: 30, fontWeight: "bold" },
});
