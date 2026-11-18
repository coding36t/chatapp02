import { db } from "./firebase.config.js";
import {
  set,
  push,
  ref,
  onChildAdded,
  remove,
  onChildRemoved,
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-database.js";

const chatBox = document.getElementById("chat-box");
const chatForm = document.getElementById("chat-form");
const messageInput = document.getElementById("message-input");
const userNameInput = document.getElementById("username");
const messageRef = ref(db, "messages");

const sendMessage = async (e) => {
  e.preventDefault();
  const userMessage = messageInput.value;
  const userName = userNameInput.value;
  try {
    await push(messageRef, {
      message: userMessage,
      name: userName,
    });
  } catch (err) {
    console.log(err, "err message");
  }
};

window.deleteMessage = function (messageKey) {
  remove(ref(db, "messages/" + messageKey));
  console.log(messageKey);
};

onChildAdded(messageRef, (snapshot) => {
  const data = snapshot.val();
  console.log(data);
  chatBox.innerHTML += `<div class='user-message' id='${snapshot.key}'>
        <div>
        <strong>${data.name}:</strong>${data.message}
        </div>
        <button onclick="deleteMessage('${snapshot.key}')">Delete</button>
    </div>`;

  chatBox.scrollTop = chatBox.scrollHeight;
});

onChildRemoved(messageRef, (snapshot) => {
  const parent = document.getElementById("chat-box");
  const child = document.getElementById(snapshot.key);
  // Remove the child from the parent
  if (parent && child) {
    parent.removeChild(child);
  }
});
chatForm.addEventListener("submit", sendMessage);
