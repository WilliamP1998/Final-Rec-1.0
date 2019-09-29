import createDataContext from "./createDataContext";
import recorderApi from "../api/recorder";
import { AsyncStorage } from "react-native";
import { navigate } from "../navigationRef";

const authReducer = (state, action) => {
  switch (action.type) {
    case "add_error":
      return { ...state, errorMessage: action.payload };
    case "signin":
      return { errorMessage: "", token: action.payload };
    case "signout":
      return { token: null, errorMessage: "" };
    default:
      return state;
  }
};
const tryLocalSignIn = dispatch => async () => {
  const token = await AsyncStorage.getItem("token");
  if (token) {
    dispatch({ type: "signin", payload: token });
    navigate("Recorder");
  } else {
    navigate("Signup");
  }
};

const signup = dispatch => async ({ email, password }) => {
  try {
    const response = await recorderApi.post("/signup", { email, password });
    await AsyncStorage.setItem("token", response.data.token);
    dispatch({ type: "signin", payload: response.data.token });

    navigate("Recorder");
  } catch (err) {
    dispatch({
      type: "add_error",
      payload: "Something went wrong with sign up"
    });
  }
};

const signin = dispatch => async ({ email, password }) => {
  try {
    const response = await recorderApi.post("/signin", { email, password });
    await AsyncStorage.setItem("token", response.data.token);
    dispatch({ type: "signin", payload: response.data.token });

    navigate("Recorder");
  } catch (err) {
    dispatch({
      type: "add_error",
      payload: "Something went wrong with sign in"
    });
  }
};

const signout = dispatch => async () => {
  await AsyncStorage.removeItem("token");
  dispatch({ type: "signout" });
  navigate("loginFlow");
};
export const { Provider, Context } = createDataContext(
  authReducer,
  { signin, signout, signup, tryLocalSignIn },
  { token: null, errorMessage: "" }
);
