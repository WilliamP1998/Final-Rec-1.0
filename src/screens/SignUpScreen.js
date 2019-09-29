import React, { useContext } from "react";
import { View, StyleSheet } from "react-native";
import NavLink from "../components/NavLink";
import { Context as AuthContext } from "../context/AuthContext";

import AuthForm from "../components/AuthForm";

const BACKGROUND_COLOR = "#FFFFFF";

const SignUpScreen = ({ navigation }) => {
  const { state, signup } = useContext(AuthContext);

  return (
    <View style={styles.container}>
      <AuthForm
        headerText="Sign Up"
        errorMessage={state.errorMessage}
        submitButtonText="Sign Up"
        onSubmit={signup}
      />
      <NavLink routeName="Signin" text="Already have an account? Sign In" />
    </View>
  );
};

SignUpScreen.navigationOptions = () => {
  return {
    header: null
  };
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    marginBottom: 250,
    backgroundColor: BACKGROUND_COLOR
  }
});

export default SignUpScreen;
