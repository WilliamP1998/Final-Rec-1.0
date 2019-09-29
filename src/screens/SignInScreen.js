import React, { useContext } from "react";
import { View, StyleSheet } from "react-native";
import NavLink from "../components/NavLink";
import { Context as AuthContext } from "../context/AuthContext";

import AuthForm from "../components/AuthForm";

const BACKGROUND_COLOR = "#FFFFFF";

const SignInScreen = ({ navigation }) => {
  const { state, signin } = useContext(AuthContext);

  return (
    <View style={styles.container}>
      <AuthForm
        headerText="Sign In"
        errorMessage={state.errorMessage}
        submitButtonText="Sign In"
        onSubmit={signin}
      />
      <NavLink routeName="Signup" text="Don't have an account? Sign Up" />
    </View>
  );
};

SignInScreen.navigationOptions = () => {
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

export default SignInScreen;
