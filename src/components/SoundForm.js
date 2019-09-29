import React, { useState, useContext } from "react";
import { StyleSheet } from "react-native";
import { Text, Input, Button } from "react-native-elements";
import Spacer from "./Spacer";

export const sounds = [];

const SoundForm = sound => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  return (
    <>
      <Spacer>
        <Text style={styles.Header} h3>
          Create New Sound
        </Text>
      </Spacer>
      <Input
        label="Name"
        autoAcpitalize="none"
        autoCapitalized={false}
        value={name}
        unique={true}
        onChangeText={setName}
      />
      <Spacer />
      <Input
        autoAcpitalize="none"
        autoCapitalized={false}
        label="Description"
        value={description}
        onChangeText={setDescription}
      />

      <Spacer>
        <Button
          title="Create"
          onPress={() => {
            if (sound != null) {
              const newSound = { name: name, desc: description, sound: sound };

              sounds.push(newSound);
            }
          }}
        />
      </Spacer>
    </>
  );
};
const styles = StyleSheet.create({
  errorMessage: {
    fontSize: 16,
    color: "red",
    marginLeft: 15,
    marginTop: 15
  },
  Header: {
    color: "#FFFFFF"
  }
});

export default SoundForm;
