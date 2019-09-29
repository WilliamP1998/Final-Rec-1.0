import React, { useContext } from "react";
import { View, StyleSheet, Text } from "react-native";
import { Button } from "react-native-elements";
import Spacer from "../components/Spacer";
import { Context as AuthContext } from "../context/AuthContext";
import { SafeAreaView } from "react-navigation";

const BACKGROUND_COLOR = "#FFFFFF";

const AccountScreen = () => {
  const { signout } = useContext(AuthContext);
  return (
    <View style={styles.background}>
      <SafeAreaView forceInset={{ top: "always" }}>
        <Text style={{ fontSize: 30 }}>Account</Text>
        <Spacer>
          <Button title="Sign Out" onPress={signout} />
        </Spacer>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: BACKGROUND_COLOR
  }
});

export default AccountScreen;
