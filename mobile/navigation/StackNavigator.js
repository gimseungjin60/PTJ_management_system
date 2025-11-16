import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import RoleSelectScreen from "../screens/RoleSelectScreen";
import HomeScreen from "../screens/HomeScreen";
import ManagerScreen from "../screens/ManagerScreen";

const Stack = createNativeStackNavigator();

export default function StackNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: true }}>
        <Stack.Screen
          name="RoleSelect"
          component={RoleSelectScreen}
          options={{ title: "사용자 선택" }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: "출퇴근" }}
        />
        <Stack.Screen
          name="Manager"
          component={ManagerScreen}
          options={{ title: "사장님 화면" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
