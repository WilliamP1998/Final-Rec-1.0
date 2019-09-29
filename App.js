import React from "react";
import { StyleSheet, View } from "react-native";
import { createAppContainer, createSwitchNavigator } from "react-navigation";
import { createStackNavigator } from "react-navigation-stack";
import { createBottomTabNavigator } from "react-navigation-tabs";
import { Provider as AuthProvider } from "./src/context/AuthContext";
import AccountScreen from "./src/screens/AccountScreen";
import CreateRecord from "./src/screens/CreateRecord";
import CurrentRecord from "./src/screens/CurrentRecord";
import RecordingList from "./src/screens/RecordingList";
import SignInScreen from "./src/screens/SignInScreen";
import SignUpScreen from "./src/screens/SignUpScreen";
import { setNavigator } from "./src/navigationRef";
import ResolveAuthScreen from "./src/screens/ResolveAuthScreen";

const BACKGROUND_COLOR = "#FFF8ED";

const swithNavigator = createSwitchNavigator({
  ResolveAuth: ResolveAuthScreen,
  loginFlow: createStackNavigator({
    Signup: SignUpScreen,
    Signin: SignInScreen
  }),
  mainFlow: createBottomTabNavigator({
    RecordListFLow: createStackNavigator({
      RecordList: RecordingList,
      CurrentRecord: CurrentRecord
    }),
    Recorder: CreateRecord,
    Account: AccountScreen
  })
});

const App = createAppContainer(swithNavigator);

export default () => {
  return (
    <AuthProvider>
      <App
        ref={navigator => {
          setNavigator(navigator);
        }}
      />
    </AuthProvider>
  );
};

const styles = StyleSheet.create({
  background: {
    backgroundColor: BACKGROUND_COLOR
  }
});
