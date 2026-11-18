
import { auth, db } from "./firebase.config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";

import {
    ref,
    set,
    get,
    onValue,
    push,
    onChildAdded,
    onDisconnect,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-database.js";


// HTML ELEMENTS
const usersList = document.getElementById("users-list");
const chatBox = document.getElementById("chat-box");
const chatForm = document.getElementById("chat-form");
const messageInput = document.getElementById("message-input");
const chatPanel = document.getElementById("chat-panel");
const emptyState = document.getElementById("empty-state");


// VARIABLES
let currentUser = null;
let selectedFriend = null;
let conversationId = null;

let stopMessages = null;
let stopFriendStatus = null;

let profiles = {};
let presences = {};


// CREATE SAME CHAT ID FOR BOTH USERS
function getConversationId(uid1, uid2) {

    return [uid1, uid2].sort().join("_");

}


// GET USER INITIALS
function getInitials(name) {

    return name
        .split(" ")
        .map(word => word[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

}


// ESCAPE USER TEXT BEFORE INSERTING HTML
function safeText(value = "") {

    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);

}


// UPDATE FRIEND STATUS
function updateFriendStatus(isOnline) {

    const status = document.getElementById("friend-status");

    status.innerHTML = `
        <span class="status-dot ${isOnline ? "online" : ""}"></span>
        ${isOnline ? "Online" : "Offline"}
    `;

}


// REFRESH USERS LIST
function refreshUsers() {

    const users = Object.values(profiles);

    usersList.innerHTML = "";

    const otherUsers = users.filter(user => {

        return user.uid !== currentUser.uid;

    });

    if (otherUsers.length === 0) {

        usersList.textContent = "No other users registered yet.";
        return;

    }

    otherUsers.sort((a, b) =>
        (a.name || "").localeCompare(b.name || "")
    );

    otherUsers.forEach(user => {

        const isOnline = presences[user.uid]?.state === "online";

        const button = document.createElement("button");

        button.className = "user-item";

        if (selectedFriend?.uid === user.uid) {
            button.classList.add("selected");
        }

        button.innerHTML = `
            <div class="avatar">
                ${safeText(getInitials(user.name || "User"))}
            </div>

            <div class="user-copy">
                <strong>${safeText(user.name || "User")}</strong>

                <small>
                    <span class="status-dot ${isOnline ? "online" : ""}"></span>
                    ${isOnline ? "Online" : "Offline"}
                </small>
            </div>
        `;

        button.addEventListener("click", () => {

            openChat(user);

        });

        usersList.appendChild(button);

    });

    // UPDATE CURRENT FRIEND STATUS
    if (selectedFriend) {

        const friend = profiles[selectedFriend.uid];

        if (friend) {

            selectedFriend = friend;

            updateFriendStatus(
                presences[friend.uid]?.state === "online"
            );

        }

    }

}


// OPEN FRIEND CHAT
function openChat(friend) {

    selectedFriend = friend;

    conversationId = getConversationId(
        currentUser.uid,
        friend.uid
    );

    emptyState.classList.add("hidden");
    chatPanel.classList.remove("hidden");

    document.getElementById("friend-name").textContent = friend.name;

    document.getElementById("friend-avatar").textContent =
        getInitials(friend.name || "User");

    updateFriendStatus(
        presences[friend.uid]?.state === "online"
    );

    refreshUsers();

    // STOP PREVIOUS CHAT LISTENER
    if (stopMessages) {
        stopMessages();
    }

    if (stopFriendStatus) {
        stopFriendStatus();
    }

    chatBox.innerHTML = "";

    // LISTEN TO FRIEND STATUS
    const friendStatusRef = ref(
        db,
        "presence/" + friend.uid
    );

    stopFriendStatus = onValue(friendStatusRef, snapshot => {

        const status = snapshot.val();

        updateFriendStatus(status?.state === "online");

    });


    // LOAD REALTIME MESSAGES
    const messagesRef = ref(
        db,
        "messages/" + conversationId
    );

    stopMessages = onChildAdded(messagesRef, snapshot => {

        const message = snapshot.val();

        showMessage(message, snapshot.key);

    });

    messageInput.focus();

}


// DISPLAY MESSAGE
function showMessage(message, messageId) {

    // Avoid duplicate messages
    if (document.getElementById("msg-" + messageId)) {
        return;
    }

    const isMine = message.senderId === currentUser.uid;

    const messageRow = document.createElement("div");

    messageRow.className = isMine
        ? "message-line mine"
        : "message-line theirs";

    messageRow.id = "msg-" + messageId;

    const bubble = document.createElement("div");

    bubble.className = "message-bubble";

    const sender = document.createElement("strong");

    sender.className = "message-sender";

    sender.textContent = isMine
        ? "You"
        : (selectedFriend?.name || "Friend");

    const text = document.createElement("p");

    text.textContent = message.text || "";

    const time = document.createElement("small");

    time.textContent = message.createdAt
        ? new Date(message.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        })
        : "";

    bubble.appendChild(sender);
    bubble.appendChild(text);
    bubble.appendChild(time);

    messageRow.appendChild(bubble);

    chatBox.appendChild(messageRow);

    chatBox.scrollTop = chatBox.scrollHeight;

}


// SEND MESSAGE
chatForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const messageText = messageInput.value.trim();

    if (!messageText || !selectedFriend || !conversationId) {
        return;
    }

    try {

        const messagesRef = ref(
            db,
            "messages/" + conversationId
        );

        await push(messagesRef, {

            senderId: currentUser.uid,

            senderName: currentUser.displayName || "User",

            text: messageText,

            createdAt: Date.now()

        });

        messageInput.value = "";

        messageInput.focus();

    } catch (error) {

        alert("Message error: " + error.message);

    }

});


// LOGOUT
document.getElementById("logout-btn").addEventListener("click", async () => {

    try {

        await signOut(auth);

        window.location.href = "index.html";

    } catch (error) {

        alert(error.message);

    }

});


// CHECK LOGIN USER
onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "index.html";

        return;

    }

    currentUser = user;

    // GET PROFILE
    const userSnapshot = await get(
        ref(db, "users/" + user.uid)
    );

    const profile = userSnapshot.val() || {};

    const name = profile.name || user.displayName || user.email;

    document.getElementById("my-name").textContent = name;

    document.getElementById("current-user-name").textContent = name;

    document.getElementById("my-avatar").textContent =
        getInitials(name);


    // SET ONLINE/OFFLINE PRESENCE
    const connectedRef = ref(db, ".info/connected");

    onValue(connectedRef, async snapshot => {

        if (snapshot.val() === true) {

            const presenceRef = ref(
                db,
                "presence/" + user.uid
            );

            await onDisconnect(presenceRef).set({

                state: "offline",

                lastChanged: serverTimestamp()

            });

            await set(presenceRef, {

                state: "online",

                lastChanged: serverTimestamp()

            });

        }

    });


    // LISTEN TO ALL USER PROFILES
    onValue(ref(db, "users"), snapshot => {

        profiles = snapshot.val() || {};

        refreshUsers();

    });


    // LISTEN TO ALL USER PRESENCE
    onValue(ref(db, "presence"), snapshot => {

        presences = snapshot.val() || {};

        refreshUsers();

    });

});
