import React from "react";
import {
  Dimensions,
  Slider,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
  Button
} from "react-native";
import { Asset } from "expo-asset";
import { Audio } from "expo-av";
import * as Font from "expo-font";
import * as Permissions from "expo-permissions";
import { Entypo, Foundation, FontAwesome, Octicons } from "@expo/vector-icons";
import { soundArray } from "./CreateRecord";
import Modal from "react-native-modal";
import { Dropdown } from "react-native-material-dropdown";
import Spacer from "../components/Spacer";
import { AsyncStorage } from "react-native";
var _ = require("underscore");

class Icon {
  constructor(module, width, height) {
    this.module = module;
    this.width = width;
    this.height = height;
    Asset.fromModule(this.module).downloadAsync();
  }
}

const ICON_TRACK_1 = new Icon(
  require("../../assets/images/track_1.png"),
  166,
  5
);
const ICON_THUMB_1 = new Icon(
  require("../../assets/images/thumb_1.png"),
  18,
  19
);
const ICON_THUMB_2 = new Icon(
  require("../../assets/images/thumb_2.png"),
  15,
  19
);

const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = Dimensions.get("window");
const BACKGROUND_COLOR = "#FFFFFF";
const LIVE_COLOR = "#FF0000";

export default class CurrentRecord extends React.Component {
  static navigationOptions = {
    headerTitle: "Current Sound"
  };
  constructor(props) {
    super(props);
    this.duration = null;
    this.retrievedSounds = [];
    this.currentSound = [];
    this.recording = null;
    this.sound = null;
    this.isSeeking = false;
    this.shouldPlayAtEndOfSeek = false;
    this.state = {
      sounds: [],
      numberOfLoops: null,
      numLoop: null,
      delay: null,
      isPlayModalVisible: false,
      haveRecordingPermissions: false,
      isLoading: false,
      isPlaybackAllowed: false,
      muted: false,
      soundPosition: null,
      soundDuration: null,
      recordingDuration: null,
      shouldPlay: false,
      isPlaying: false,
      isRecording: false,
      fontLoaded: false,

      volume: 1.0,

      isModalVisible: false
    };
    this.recordingSettings = JSON.parse(
      JSON.stringify(Audio.RECORDING_OPTIONS_PRESET_LOW_QUALITY)
    );
  }

  componentDidMount() {
    this.getSounds().then(sounds => {
      this.setState({
        sounds: sounds
      });
      console.log(this.state.sounds);
      this.loadAudio();
    });

    (async () => {
      await Font.loadAsync({
        "cutive-mono-regular": require("../../assets/fonts/CutiveMono-Regular.ttf")
      });
      this.setState({ fontLoaded: true });
    })();
    this._askForPermissions();
  }

  async loadAudio() {
    const { navigation } = this.props;
    const id = navigation.getParam("id");
    // console.log(this.state.sounds);
    this.sound = new Audio.Sound();
    for (let i = 0; i < this.state.sounds.length; i++) {
      if (this.state.sounds[i].id === id) {
        this.currentSound = this.state.sounds[i];
        console.log(this.currentSound);

        break;
      }
    }
    try {
      await this.sound.loadAsync({
        uri: this.currentSound.sound /* url for your audio file */
      });
      await this.sound.setOnPlaybackStatusUpdate(this._onPlaybackStatusUpdate);
    } catch (e) {
      console.log("ERROR Loading Audio", e);
    }
  }

  getSounds = () =>
    new Promise(function(resolve) {
      AsyncStorage.getItem("soundArray").then(val => {
        let retrievedSoundArray = JSON.parse(val);
        return resolve(retrievedSoundArray);
      });
    });

  _onPlaybackStatusUpdate = playbackStatus => {
    if (playbackStatus.didJustFinish) {
      if (this.state.numberOfLoops >= this.state.numLoop - 1) {
        this.sound.pauseAsync();
        this.sound.setIsLoopingAsync(false);
        console.log("it's looping");
        this.setState({ isPlaying: false });
      } else if (this.state.numberOfLoops < this.state.numLoop - 1) {
        this.setState({
          numberOfLoops: this.state.numberOfLoops + 1
        });

        this.sound.pauseAsync();
        setTimeout(() => {
          this.sound.playAsync();
          console.log("play the sound");
        }, this.state.delay);
        console.log(this.state.numberOfLoops);
      }
    }
  };

  _updateScreenForSoundStatus = status => {
    if (status.isLoaded) {
      this.setState({
        soundDuration: status.durationMillis,
        soundPosition: status.positionMillis,
        shouldPlay: status.shouldPlay,
        isPlaying: status.isPlaying,

        muted: status.isMuted,
        volume: status.volume,

        isPlaybackAllowed: true
      });
    } else {
      this.setState({
        soundDuration: null,
        soundPosition: null,
        isPlaybackAllowed: false
      });
      if (status.error) {
        console.log(`FATAL PLAYER ERROR: ${status.error}`);
      }
    }
  };

  _askForPermissions = async () => {
    const response = await Permissions.askAsync(Permissions.AUDIO_RECORDING);
    this.setState({
      haveRecordingPermissions: response.status === "granted"
    });
  };
  _pressPlayorPause = () => {
    if (this.state.isPlaying === true) {
      this.sound.pauseAsync();
      this.setState({ isPlaying: !this.state.isPlaying });
    } else {
      this.togglePlayModal();
    }
  };
  _onPlayPausePressed = () => {
    this.setState({ numberOfLoops: 0 });
    if (this.sound != null) {
      if (this.state.isPlaying === true) {
        this.sound.pauseAsync();
        this.setState({ isPlaying: !this.state.isPlaying });
      } else {
        this.togglePlayModal();
        setTimeout(() => {
          this.setState({ isPlaying: !this.state.isPlaying });
          this.sound.setOnPlaybackStatusUpdate(this._onPlaybackStatusUpdate);
          this.sound.setIsLoopingAsync(true);
          this.sound.playAsync();
          console.log(this.state.numLoop);
          console.log("play the sound");
        }, this.state.delay);
      }
    }
  };

  togglePlayModal = () => {
    this.setState({ isPlayModalVisible: !this.state.isPlayModalVisible });
    console.log(this.state.isPlayModalVisible);
  };

  handleLoop = value => {
    this.setState({ numLoop: value });
  };
  handleDelay = value => {
    this.setState({ delay: value * 1000 });
  };

  _onStopPressed = () => {
    if (this.sound != null) {
      this.sound.stopAsync();
    }
  };

  _onMutePressed = () => {
    if (this.sound != null) {
      this.sound.setIsMutedAsync(!this.state.muted);
    }
  };

  _onVolumeSliderValueChange = value => {
    if (this.sound != null) {
      this.sound.setVolumeAsync(value);
    }
  };

  _onSeekSliderValueChange = value => {
    if (this.sound != null && !this.isSeeking) {
      this.isSeeking = true;
      this.shouldPlayAtEndOfSeek = this.state.shouldPlay;
      this.sound.pauseAsync();
    }
  };

  _onSeekSliderSlidingComplete = async value => {
    if (this.sound != null) {
      this.isSeeking = false;
      const seekPosition = value * this.state.soundDuration;
      if (this.shouldPlayAtEndOfSeek) {
        this.sound.playFromPositionAsync(seekPosition);
      } else {
        this.sound.setPositionAsync(seekPosition);
      }
    }
  };

  _getSeekSliderPosition() {
    if (
      this.sound != null &&
      this.state.soundPosition != null &&
      this.state.soundDuration != null
    ) {
      return this.state.soundPosition / this.state.soundDuration;
    }
    return 0;
  }

  _getMMSSFromMillis(millis) {
    const totalSeconds = millis / 1000;
    const seconds = Math.floor(totalSeconds % 60);
    const minutes = Math.floor(totalSeconds / 60);

    const padWithZero = number => {
      const string = number.toString();
      if (number < 10) {
        return "0" + string;
      }
      return string;
    };
    return padWithZero(minutes) + ":" + padWithZero(seconds);
  }

  _getPlaybackTimestamp() {
    if (
      this.sound != null &&
      this.state.soundPosition != null &&
      this.state.soundDuration != null
    ) {
      return `${this._getMMSSFromMillis(
        this.state.soundPosition
      )} / ${this._getMMSSFromMillis(this.state.soundDuration)}`;
    }
    return "";
  }

  _getRecordingTimestamp() {
    if (this.state.recordingDuration != null) {
      return `${this._getMMSSFromMillis(this.state.recordingDuration)}`;
    }
    return `${this._getMMSSFromMillis(0)}`;
  }

  render() {
    const repeatOptions = _.range(1, 100, 1).map((item, index) => {
      return {
        value: item
      };
    });
    const delayOptions = _.range(0, 30, 0.5).map((item, index) => {
      return {
        value: item
      };
    });
    if (!this.state.fontLoaded) {
      return <View style={styles.emptyContainer} />;
    }

    if (!this.state.haveRecordingPermissions) {
      return (
        <View style={styles.container}>
          <View />
          <Text
            style={[
              styles.noPermissionsText,
              { fontFamily: "cutive-mono-regular" }
            ]}
          >
            You must enable audio recording permissions in order to use this
            app.
          </Text>
          <View />
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <View>
          <View>
            <Text style={{ fontSize: 30, textAlign: "center" }}>
              {this.currentSound.name}
            </Text>
          </View>
          <View>
            <Text
              style={{
                fontSize: 20,
                textAlign: "center"
              }}
            >
              {this.currentSound.desc}
            </Text>
          </View>
        </View>
        <View style={[styles.halfScreenContainer]}>
          <View />
          <View style={styles.playbackContainer}>
            <Slider
              style={styles.playbackSlider}
              trackImage={ICON_TRACK_1.module}
              thumbImage={ICON_THUMB_1.module}
              value={this._getSeekSliderPosition()}
              onValueChange={this._onSeekSliderValueChange}
              onSlidingComplete={this._onSeekSliderSlidingComplete}
            />
            <Text
              style={[
                styles.playbackTimestamp,
                { fontFamily: "cutive-mono-regular" }
              ]}
            >
              {this._getPlaybackTimestamp()}
            </Text>
          </View>
          <View
            style={[styles.buttonsContainerBase, styles.buttonsContainerTopRow]}
          >
            <View style={styles.volumeContainer}>
              <TouchableHighlight
                underlayColor={BACKGROUND_COLOR}
                style={styles.wrapper}
                onPress={this._onMutePressed}
              >
                {this.state.muted ? (
                  <Octicons name="mute" size={45} />
                ) : (
                  <FontAwesome name="volume-up" size={45} />
                )}
              </TouchableHighlight>
              <Slider
                style={styles.volumeSlider}
                trackImage={ICON_TRACK_1.module}
                thumbImage={ICON_THUMB_2.module}
                value={1}
                onValueChange={this._onVolumeSliderValueChange}
              />
            </View>
            <View style={styles.playStopContainer}>
              <TouchableHighlight
                underlayColor={BACKGROUND_COLOR}
                style={styles.wrapper}
                onPress={this._pressPlayorPause}
              >
                {this.state.isPlaying ? (
                  <Foundation name="pause" size={58} />
                ) : (
                  <Foundation name="play" size={58} />
                )}
              </TouchableHighlight>
              <Modal isVisible={this.state.isPlayModalVisible}>
                <View style={{ flex: 1 }}>
                  <Button title="Cancel" onPress={this.togglePlayModal} />
                  <Spacer>
                    <Text style={styles.Header} h3>
                      Choose your option
                    </Text>
                    <Dropdown
                      label="Loop"
                      data={repeatOptions}
                      onChangeText={this.handleLoop}
                    />
                    <Dropdown
                      label="Delay"
                      data={delayOptions}
                      onChangeText={this.handleDelay}
                    />
                  </Spacer>

                  <Spacer>
                    <Button title="Play" onPress={this._onPlayPausePressed} />
                  </Spacer>
                </View>
              </Modal>
              <TouchableHighlight
                underlayColor={BACKGROUND_COLOR}
                style={styles.wrapper}
                onPress={this._onStopPressed}
              >
                <Entypo name="controller-stop" size={58} />
              </TouchableHighlight>
            </View>
            <View />
          </View>
          <View />
        </View>
      </View>
    );
  }
}
const styles = StyleSheet.create({
  emptyContainer: {
    alignSelf: "stretch",
    backgroundColor: BACKGROUND_COLOR
  },
  container: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: BACKGROUND_COLOR,
    minHeight: DEVICE_HEIGHT,
    maxHeight: DEVICE_HEIGHT
  },
  noPermissionsText: {
    textAlign: "center"
  },
  wrapper: {},
  halfScreenContainer: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "center",
    alignSelf: "stretch",
    minHeight: DEVICE_HEIGHT / 2.0,
    maxHeight: DEVICE_HEIGHT / 2.0
  },
  recordingContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    alignSelf: "stretch",
    minHeight: 70,
    maxHeight: 119
  },
  recordingDataContainer: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 70,
    maxHeight: 119,
    minWidth: 50,
    maxWidth: 100
  },
  recordingDataRowContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 20,
    maxHeight: 14
  },
  playbackContainer: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "center",
    alignSelf: "stretch",
    minHeight: ICON_THUMB_1.height * 2.0,
    maxHeight: ICON_THUMB_1.height * 2.0
  },
  playbackSlider: {
    alignSelf: "stretch"
  },
  liveText: {
    color: LIVE_COLOR
  },
  recordingTimestamp: {
    paddingLeft: 20
  },
  playbackTimestamp: {
    textAlign: "right",
    alignSelf: "stretch",
    paddingRight: 20
  },
  Header: {
    fontSize: 30,
    color: "#FFFFFF"
  },
  image: {
    backgroundColor: BACKGROUND_COLOR
  },
  textButton: {
    backgroundColor: BACKGROUND_COLOR,
    padding: 10
  },
  buttonsContainerBase: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  buttonsContainerTopRow: {
    maxHeight: 67,
    alignSelf: "stretch",
    paddingRight: 20
  },
  playStopContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minWidth: ((34 + 22) * 3.0) / 2.0,
    maxWidth: ((51 + 22) * 3.0) / 2.0
  },
  volumeContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minWidth: DEVICE_WIDTH / 2.0,
    maxWidth: DEVICE_WIDTH / 2.0
  },
  volumeSlider: {
    width: DEVICE_WIDTH / 2.0 - 58
  },
  buttonsContainerBottomRow: {
    maxHeight: ICON_THUMB_1.height,
    alignSelf: "stretch",
    paddingRight: 20,
    paddingLeft: 20
  }
});
