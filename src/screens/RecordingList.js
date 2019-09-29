import React from "react";
import {
  View,
  StyleSheet,
  Text,
  Button,
  FlatList,
  TouchableOpacity
} from "react-native";
import { sounds } from "../components/SoundForm";
import { ListItem } from "react-native-elements";

const BACKGROUND_COLOR = "#FFFFFF";

const RecordingList = ({ navigation }) => {
  console.log(sounds);
  return (
    <View style={styles.background}>
      <Text>List Records</Text>
      <FlatList
        keyExtractor={item => item.name}
        data={sounds}
        renderItem={({ item }) => {
          return (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("CurrentRecord", { name: item.name })
              }
            >
              <ListItem chevron title={item.name} />
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: BACKGROUND_COLOR
  }
});

export default RecordingList;
