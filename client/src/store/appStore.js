import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import emailsReducer from "./emailsSlice";

const appStore = configureStore({
  reducer: {
    auth: authReducer,
    emails: emailsReducer,
  },
});

export default appStore;
