import { View, Text, StyleSheet, Button } from "react-native";
import { socket } from "../socket";
import axios from "axios";

const SERVER_URL = "http://172.20.10.5:5000";  // ★ PC의 실제 IP로 바꾸기!!

export default function HomeScreen() {
  const handleCheckIn = async () => {
    try {
      // Socket 알림
      socket.emit("checkIn", {
        userId: 1,
        name: "승진",
        time: new Date().toISOString(),
      });

      // DB 반영
      const res = await axios.post(`${SERVER_URL}/api/attendance/check_in`, {
        userId: 1,
      });

      console.log("출근 성공:", res.data);
    } catch (err) {
      console.log("출근 오류:", err);
    }
  };

  const handleCheckOut = async () => {
    try {
      // Socket 알림
      socket.emit("checkOut", {
        userId: 1,
        name: "승진",
        time: new Date().toISOString(),
      });

      // DB 반영
      const res = await axios.post(`${SERVER_URL}/api/attendance/check_out`, {
        userId: 1,
      });

      console.log("퇴근 성공:", res.data);
    } catch (err) {
      console.log("퇴근 오류:", err);
    }
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
