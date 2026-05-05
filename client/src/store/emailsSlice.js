import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [],
  unreadNotifications: 0,
};

const emailsSlice = createSlice({
  name: "emails",
  initialState,
  reducers: {
    setEmails: (state, action) => {
      state.items = action.payload || [];
    },
    upsertEmailFromNotification: (state, action) => {
      const email = action.payload;
      const idx = state.items.findIndex((e) => e.gmail_message_id === email.message_id);
      if (idx === -1) {
        state.items.unshift({ subject: email.subject, sender: email.sender, gmail_message_id: email.message_id });
      }
      state.unreadNotifications += 1;
    },
    clearEmailNotifications: (state) => {
      state.unreadNotifications = 0;
    },
  },
});

export const { setEmails, upsertEmailFromNotification, clearEmailNotifications } = emailsSlice.actions;
export default emailsSlice.reducer;
