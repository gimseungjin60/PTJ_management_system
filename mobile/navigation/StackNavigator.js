import React from 'react';
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// --- 모든 화면 import ---
import RoleSelectScreen from "../screens/RoleSelectScreen";
import WorkerHomeScreen from "../screens/WorkerHomeScreen";
import WorkerScreen from "../screens/WorkerScreen";
import ManagerHomeScreen from "../screens/ManagerHomeScreen";
import ManagerDashboardScreen from "../screens/ManagerDashboardScreen";
import AttendanceHistoryScreen from "../screens/AttendanceHistoryScreen";
import SettingsScreen from "../screens/SettingsScreen";
import PlaceholderScreen from "../screens/PlaceholderScreen";

// ⚠️ 여기서 NavigationContainer import는 지웁니다.
// import { NavigationContainer } from "@react-navigation/native"; 

const Stack = createNativeStackNavigator();

export default function StackNavigator() {
  return (
    // ⚠️ <NavigationContainer> 태그 삭제!
    //    그냥 바로 Stack.Navigator가 나와야 합니다.
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      
      {/* 1. 시작 화면 */}
      <Stack.Screen name="RoleSelect" component={RoleSelectScreen} />

      {/* 2. 알바생 관련 */}
      <Stack.Screen name="WorkerHome" component={WorkerHomeScreen} />
      <Stack.Screen name="Worker" component={WorkerScreen} />

      {/* 3. 사장님 관련 */}
      <Stack.Screen name="ManagerHome" component={ManagerHomeScreen} />
      <Stack.Screen name="ManagerDashboard" component={ManagerDashboardScreen} />

      {/* 4. 공통 기능 */}
      <Stack.Screen name="AttendanceHistory" component={AttendanceHistoryScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />

      {/* 5. 임시 화면 */}
      <Stack.Screen name="EmployeeList" component={PlaceholderScreen} initialParams={{ title: '직원 관리' }} />
      <Stack.Screen name="RealtimeLog" component={PlaceholderScreen} initialParams={{ title: '실시간 로그' }} />

    </Stack.Navigator>
    // ⚠️ </NavigationContainer> 태그 삭제!
  );
}