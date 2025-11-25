import React from 'react';
import { NavigationContainer } from '@react-navigation/native'; // 여기가 진짜 위치!
import StackNavigator from './navigation/StackNavigator';

export default function App() {
  return (
    <NavigationContainer>
      <StackNavigator />
    </NavigationContainer>
  );
}