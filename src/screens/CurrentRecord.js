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
import { sounds } from "../components/SoundForm";
import { navigator } from "../navigationRef";

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
const RATE_SCALE = 3.0;

export default class CurrentRecord extends React.Component {
  constructor(props) {
    super(props);
    this.currentSound = [];
    this.recording = null;
    this.sound = null;
    this.isSeeking = false;
    this.shouldPlayAtEndOfSeek = false;
    this.state = {
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
      shouldCorrectPitch: true,
      volume: 1.0,
      rate: 1.0,
      isModalVisible: false
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

  _askForPermissions = async () => {
    const response = await Permissions.askAsync(Permissions.AUDIO_RECORDING);
    this.setState({
      haveRecordingPermissions: response.status === "granted"
    });
  };
  _onPlayPausePressed = () => {
    if (this.sound != null) {
      if (this.state.isPlaying) {
        this.sound.pauseAsync();
      } else {
        this.sound.playAsync();
      }
    }
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

  _trySetRate = async (rate, shouldCorrectPitch) => {
    if (this.sound != null) {
      try {
        await this.sound.setRateAsync(rate, shouldCorrectPitch);
      } catch (error) {
        // Rate changing could not be performed, possibly because the client's Android API is too old.
      }
    }
  };

  _onRateSliderSlidingComplete = async value => {
    this._trySetRate(value * RATE_SCALE, this.state.shouldCorrectPitch);
  };

  _onPitchCorrectionPressed = async value => {
    this._trySetRate(this.state.rate, !this.state.shouldCorrectPitch);
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
    const { navigation } = this.props;
    const name = navigation.getParam("name");

    this.sound = new Audio.Sound();

    for (let i = 0; i < sounds.length; i++) {
      if (sounds[i].name === name) {
        this.currentSound = sounds[i];
        this.sound.loadAsync(this.currentSound.sound);
        console.log(this.sound);
      }
    }
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
                onPress={this._onPlayPausePressed}
              >
                {this.state.isPlaying ? (
                  <Foundation name="pause" size={58} />
                ) : (
                  <Foundation name="play" size={58} />
                )}
              </TouchableHighlight>
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
          <View
            style={[
              styles.buttonsContainerBase,
              styles.buttonsContainerBottomRow
            ]}
          >
            <Text
              style={[styles.timestamp, { fontFamily: "cutive-mono-regular" }]}
            >
              Rate:
            </Text>
            <Slider
              style={styles.rateSlider}
              trackImage={ICON_TRACK_1.module}
              thumbImage={ICON_THUMB_1.module}
              value={this.state.rate / RATE_SCALE}
              onSlidingComplete={this._onRateSliderSlidingComplete}
            />
            <TouchableHighlight
              underlayColor={BACKGROUND_COLOR}
              style={styles.wrapper}
              onPress={this._onPitchCorrectionPressed}
            >
              <Text style={[{ fontFamily: "cutive-mono-regular" }]}>
                PC: {this.state.shouldCorrectPitch ? "yes" : "no"}
              </Text>
            </TouchableHighlight>
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

  rateSlider: {
    width: DEVICE_WIDTH / 2.0
  }
});
