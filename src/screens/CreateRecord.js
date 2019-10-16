import React, { useState } from "react";
import {
  Dimensions,
  Slider,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
  Button,
  TextInput
} from "react-native";
import { Asset } from "expo-asset";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import * as Font from "expo-font";
import * as Permissions from "expo-permissions";
import {
  Entypo,
  Foundation,
  FontAwesome,
  Octicons,
  MaterialIcons
} from "@expo/vector-icons";
import Modal from "react-native-modal";
import { Dropdown } from "react-native-material-dropdown";
import Spacer from "../components/Spacer";
import { AsyncStorage } from "react-native";

const uuidv1 = require("uuid/v1");
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
const DISABLED_OPACITY = 0.5;

export let soundArray = [];
export default class CreateRecord extends React.Component {
  static navigationOptions = {
    headerTitle: "New Sound"
  };
  constructor(props) {
    super(props);
    this.retrievedSounds = [];
    this.duration = null;
    this.sounds = [];
    this.soundInfo = null;
    this.soundList = [];
    this.recording = null;
    this.sound = null;
    this.isSeeking = false;
    this.shouldPlayAtEndOfSeek = false;
    this.state = {
      numberOfLoops: null,
      numLoop: null,
      delay: null,
      name: null,
      desc: null,
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

      isModalVisible: false,
      isPlayModalVisible: false,
      isDelayed: false
    };
    this.recordingSettings = JSON.parse(
      JSON.stringify(Audio.RECORDING_OPTIONS_PRESET_LOW_QUALITY)
    );
  }

  componentDidMount() {
    (async () => {
      await Font.loadAsync({
        "cutive-mono-regular": require("../../assets/fonts/CutiveMono-Regular.ttf")
      });
      this.setState({ fontLoaded: true });
    })();

    this._askForPermissions();
  }

  _storeData = async () => {
    try {
      await AsyncStorage.setItem("soundArray", JSON.stringify(soundArray));
    } catch (error) {
      console.log("cannot save data");
    }
  };

  _retrieveData = async () => {
    try {
      let value = await AsyncStorage.getItem("soundArray");
      let retrievedSoundArray = JSON.parse(value);
      this.retrievedSounds = retrievedSoundArray;
      return retrievedSoundArray;
    } catch (error) {
      console.log("cannot retrieve data");
    }
  };
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

  _askForPermissions = async () => {
    const response = await Permissions.askAsync(Permissions.AUDIO_RECORDING);
    this.setState({
      haveRecordingPermissions: response.status === "granted"
    });
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

  _updateScreenForRecordingStatus = status => {
    if (status.canRecord) {
      this.setState({
        isRecording: status.isRecording,
        recordingDuration: status.durationMillis
      });
    } else if (status.isDoneRecording) {
      this.setState({
        isRecording: false,
        recordingDuration: status.durationMillis
      });
      if (!this.state.isLoading) {
        this._stopRecordingAndEnablePlayback();
      }
    }
  };

  async _stopPlaybackAndBeginRecording() {
    this.setState({
      isLoading: true,
      numberOfLoops: 0
    });
    if (this.sound !== null) {
      await this.sound.unloadAsync();
      this.sound = null;
    }
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: true
    });
    if (this.recording !== null) {
      this.recording.setOnRecordingStatusUpdate(null);
      this.recording = null;
    }

    const recording = new Audio.Recording();
    await recording.prepareToRecordAsync(this.recordingSettings);
    recording.setOnRecordingStatusUpdate(this._updateScreenForRecordingStatus);

    this.recording = recording;
    await this.recording.startAsync(); // Will call this._updateScreenForRecordingStatus to update the screen.
    this.setState({
      isLoading: false
    });
  }

  async _stopRecordingAndEnablePlayback() {
    this.setState({
      isLoading: true
    });
    try {
      await this.recording.stopAndUnloadAsync();
    } catch (error) {
      // Do nothing -- we are already unloaded.
    }
    const info = await this.recording.getURI();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      playsInSilentModeIOS: true,
      playsInSilentLockedModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: true
    });

    const { sound, status } = await this.recording.createNewLoadedSoundAsync(
      {
        isMuted: this.state.muted,
        volume: this.state.volume
      },

      this._updateScreenForSoundStatus
    );

    this.soundInfo = info;
    this.sound = sound;

    this.setState({
      isLoading: false
    });
  }

  _onRecordPressed = () => {
    if (this.state.isRecording) {
      this._stopRecordingAndEnablePlayback();
    } else {
      this._stopPlaybackAndBeginRecording();
    }
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
  _onStopPressed = () => {
    if (this.sound != null) {
      this.sound.stopAsync();
    }
  };

  toggleModal = () => {
    this.setState({ isModalVisible: !this.state.isModalVisible });
  };

  togglePlayModal = () => {
    this.setState({ isPlayModalVisible: !this.state.isPlayModalVisible });
    console.log(this.state.isPlayModalVisible);
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

  handleName = text => {
    this.setState({ name: text });
  };
  handleDesc = text => {
    this.setState({ desc: text });
  };
  handleLoop = value => {
    this.setState({ numLoop: value });
  };
  handleDelay = value => {
    this.setState({ delay: value * 1000 });
  };

  handleChangeSound = sound => {
    this.props.getParam("addSound");
  };

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
    const { params } = this.props.navigation.state;
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
        <View
          style={[
            styles.halfScreenContainer,
            {
              opacity: this.state.isLoading ? DISABLED_OPACITY : 1.0
            }
          ]}
        >
          <View />
          <View style={styles.recordingContainer}>
            <View />
            <TouchableHighlight
              underlayColor={BACKGROUND_COLOR}
              style={styles.wrapper}
              onPress={this._onRecordPressed}
              disabled={this.state.isLoading}
            >
              <Foundation size={55} name="record" />
            </TouchableHighlight>
            <View style={styles.recordingDataContainer}>
              <View />
              <Text
                style={[styles.liveText, { fontFamily: "cutive-mono-regular" }]}
              >
                {this.state.isRecording ? "LIVE" : ""}
              </Text>
              <View style={styles.recordingDataRowContainer}>
                {this.state.isRecording ? (
                  <FontAwesome name="circle" size={10} color="red" />
                ) : null}

                <Text
                  style={[
                    styles.recordingTimestamp,
                    { fontFamily: "cutive-mono-regular" }
                  ]}
                >
                  {this._getRecordingTimestamp()}
                </Text>
              </View>
              <View />
            </View>
            <View />
          </View>
          <View />
        </View>
        <View
          style={[
            styles.halfScreenContainer,
            {
              opacity:
                !this.state.isPlaybackAllowed || this.state.isLoading
                  ? DISABLED_OPACITY
                  : 1.0
            }
          ]}
        >
          <View />
          <View style={styles.playbackContainer}>
            <Slider
              style={styles.playbackSlider}
              trackImage={ICON_TRACK_1.module}
              thumbImage={ICON_THUMB_1.module}
              value={this._getSeekSliderPosition()}
              onValueChange={this._onSeekSliderValueChange}
              onSlidingComplete={this._onSeekSliderSlidingComplete}
              disabled={!this.state.isPlaybackAllowed || this.state.isLoading}
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
                disabled={!this.state.isPlaybackAllowed || this.state.isLoading}
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
                disabled={!this.state.isPlaybackAllowed || this.state.isLoading}
              />
            </View>
            <View style={styles.playStopContainer}>
              <TouchableHighlight
                underlayColor={BACKGROUND_COLOR}
                style={styles.wrapper}
                onPress={this._pressPlayorPause}
                disabled={!this.state.isPlaybackAllowed || this.state.isLoading}
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
                disabled={!this.state.isPlaybackAllowed || this.state.isLoading}
              >
                <Entypo name="controller-stop" size={58} />
              </TouchableHighlight>
              <TouchableHighlight
                underlayColor={BACKGROUND_COLOR}
                style={styles.wrapper}
                onPress={this.toggleModal}
                disabled={!this.state.isPlaybackAllowed || this.state.isLoading}
              >
                <MaterialIcons name="add" size={58} />
              </TouchableHighlight>
              <Modal isVisible={this.state.isModalVisible}>
                <View style={{ flex: 1 }}>
                  <Button title="Cancel" onPress={this.toggleModal} />
                  <Spacer>
                    <Text style={styles.Header} h3>
                      Create New Sound
                    </Text>
                  </Spacer>
                  <TextInput
                    style={{ height: 40 }}
                    placeholder="Name"
                    autoCapitalize="none"
                    backgroundColor="grey"
                    onChangeText={this.handleName}
                  />
                  <Spacer />
                  <TextInput
                    style={{ height: 40 }}
                    placeholder="Description"
                    backgroundColor="grey"
                    onChangeText={this.handleDesc}
                    autoCapitalize="none"
                  />

                  <Spacer>
                    <Button
                      title="Create"
                      onPress={() => {
                        if (this.sound != null) {
                          3;
                          const newSound = {
                            id: uuidv1(),
                            name: this.state.name,
                            desc: this.state.desc,
                            sound: this.soundInfo
                          };
                          this.sounds.push(newSound);
                          soundArray = this.sounds;
                          this._storeData();
                          this.setState({
                            isModalVisible: !this.state.isModalVisible
                          });
                        }
                      }}
                    />
                  </Spacer>
                </View>
              </Modal>
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
  },
  Header: {
    fontSize: 30,
    color: "#FFFFFF"
  }
});
