import { View, Text, StyleSheet } from "react-native";
import { useEffect, useState } from "react";
import { socket } from "../socket";

export default function ManagerScreen() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    socket.on("checkIn", (data) => {
      setLogs((prev) => [{ type: "출근", ...data }, ...prev]);
    });

    socket.on("checkOut", (data) => {
      setLogs((prev) => [{ type: "퇴근", ...data }, ...prev]);
    });

    return () => {
      socket.off("checkIn");
      socket.off("checkOut");
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>사장님 화면</Text>

      {logs.map((log, index) => (
        <Text key={index} style={styles.log}>
          {log.name} / {log.type} /{" "}
          {new Date(log.time).toLocaleTimeString()}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  log: {
    fontSize: 18,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
});
