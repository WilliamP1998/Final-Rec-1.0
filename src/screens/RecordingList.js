import React from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Button
} from "react-native";
import { navigate } from "../navigationRef";
import { ListItem } from "react-native-elements";

import { AsyncStorage } from "react-native";
import { CreateRecord } from "./CreateRecord";
const BACKGROUND_COLOR = "#FFFFFF";
export let soundArray = [];
export default class RecordingList extends React.Component {
  static navigationOptions = {
    headerTitle: "Recording List"
  };
  state = {
    sounds: []
  };

  constructor(props) {
    super(props);
    this.addSound = this.addSound.bind(this);
  }
  componentDidMount() {
    this.getSounds().then(sounds => {
      this.setState({
        sounds: sounds
      });
    });
  }
  getSounds = () =>
    new Promise(function(resolve) {
      AsyncStorage.getItem("soundArray").then(val => {
        let sounds = JSON.parse(val);
        console.log(sounds);
        return resolve(sounds);
      });
    });

  addSound = newSound => {
    this.setState(prevState => ({
      soundArray: [...prevState.soundArray, newSound]
    }));
  };

  render() {
    return (
      <View style={styles.background}>
        <FlatList
          keyExtractor={item => item.id}
          data={this.state.sounds}
          renderItem={({ item }) => {
            return (
              <TouchableOpacity
                onPress={() => navigate("CurrentRecord", { id: item.id })}
              >
                <ListItem chevron title={item.name} description={item.desc} />
              </TouchableOpacity>
            );
          }}
        />

        <View style={styles.bottomView}>
          <Button
            onPress={() =>
              navigate("Recorder", {
                soundArray: this.state.soundArray
              })
            }
            title="Add new sound"
            color="#FFFFFF"
          ></Button>
        </View>
      </View>
    );
  }
}
const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: BACKGROUND_COLOR
  },
  bottomView: {
    width: "100%",
    height: 50,
    backgroundColor: "#659EC7",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: 0,
    color: "#FFFFFF"
  },
  textStyle: {
    color: "#FFFFFF",
    fontSize: 11
  }
});
