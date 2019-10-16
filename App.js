import React from "react";
import { StyleSheet, View } from "react-native";
import { createAppContainer, createSwitchNavigator } from "react-navigation";
import { createStackNavigator } from "react-navigation-stack";
import { createBottomTabNavigator } from "react-navigation-tabs";

import CreateRecord from "./src/screens/CreateRecord";
import CurrentRecord from "./src/screens/CurrentRecord";
import RecordingList from "./src/screens/RecordingList";
import { setNavigator } from "./src/navigationRef";

const BACKGROUND_COLOR = "#FFF8ED";

const swithNavigator = createSwitchNavigator({
  List: createStackNavigator({
    RecordList: RecordingList,
    CurrentRecord: CurrentRecord,
    Recorder: CreateRecord
  })
});

const App = createAppContainer(swithNavigator);

export default () => {
  return (
    <App
      ref={navigator => {
        setNavigator(navigator);
      }}
    />
  );
};

const styles = StyleSheet.create({
  background: {
    backgroundColor: BACKGROUND_COLOR
  }
});
