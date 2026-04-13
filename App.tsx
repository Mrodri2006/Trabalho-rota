import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import DriverLogin from './screens/DriverLogin';
import DriverRegister from './screens/DriverRegister';
import DriverHome from './screens/DriverHome';
import DriverDashboard from './screens/DriverDashboard';
import DriverReports from './screens/DriverReports';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name='DriverLogin' component={DriverLogin} />
        <Stack.Screen name='DriverRegister' component={DriverRegister} />
        <Stack.Screen name='DriverHome' component={DriverHome} />
        <Stack.Screen name='DriverDashboard' component={DriverDashboard} />
        <Stack.Screen name='DriverReports' component={DriverReports} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
