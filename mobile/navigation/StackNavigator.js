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
import EmployeeListScreen from "../screens/EmployeeListScreen"; 
import NoticeListScreen from "../screens/NoticeListScreen"; 
import NoticeWriteScreen from "../screens/NoticeWriteScreen";
import LoginScreen from "../screens/LoginScreen";
import ScheduleScreen from "../screens/ScheduleScreen";
import ManagerScheduleScreen from "../screens/ManagerScheduleScreen";

// ⚠️ 여기서 NavigationContainer import는 지웁니다.
// import { NavigationContainer } from "@react-navigation/native"; 

const Stack = createNativeStackNavigator();

export default function StackNavigator() {
  return (
    // ⚠️ <NavigationContainer> 태그 삭제!
    //    그냥 바로 Stack.Navigator가 나와야 합니다.
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      
      {/* 1. 시작 화면 */}
      {/*<Stack.Screen name="RoleSelect" component={RoleSelectScreen} />*/}
      <Stack.Screen name="Login" component={LoginScreen} />

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
      {/*<Stack.Screen name="EmployeeList" component={PlaceholderScreen} initialParams={{ title: '직원 관리' }} />*/}
      
      {/* 5. 임시 화면 (중복된 EmployeeList 제거함) */}
      <Stack.Screen 
        name="RealtimeLog" 
        component={PlaceholderScreen} 
        initialParams={{ title: '실시간 로그' }} 
      />

      {/* 6. 직원 관리 (실제 구현된 화면) */}
      <Stack.Screen name="EmployeeList" component={EmployeeListScreen} />

      {/* 👇 공지사항 화면 등록 */}
      <Stack.Screen name="NoticeList" component={NoticeListScreen} />
      <Stack.Screen name="NoticeWrite" component={NoticeWriteScreen} />

      {/* 👇 날짜 별 출근 일 */}
      <Stack.Screen name="Schedule" component={ScheduleScreen} />

      {/* 👇 [사장] 직원 출퇴근 시간 설정 */}
      <Stack.Screen name="ManagerSchedule" component={ManagerScheduleScreen} />

    </Stack.Navigator>
    // ⚠️ </NavigationContainer> 태그 삭제!
  );
}