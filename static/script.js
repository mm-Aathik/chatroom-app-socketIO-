const socket = io();

let usernameColors = {}; // Store a color for each username

// Function to generate a unique color based on username
function getUsernameColor(username) {
    if (!usernameColors[username]) {
        // Generate a random color if one doesn't exist for this user
        usernameColors[username] = `hsl(${Math.random() * 360}, 50%, 75%)`; // Light pastel color
    }
    return usernameColors[username];
}

// Join a room with a username
function joinRoom() {
    const username = document.getElementById('username').value;
    const roomID = document.getElementById('roomID').value;
    //const passcode = document.getElementById('passcode').value;

    socket.emit('joinRoom', { username, roomID, /*passcode*/ });

    updateRoomIDDisplay(roomID);
}

// Create a room and display the room ID and passcode
/*
function createRoom() {
    socket.emit('createRoom', ({ roomID, passcode }) => {
        alert(`Room created! Room ID: ${roomID}, Passcode: ${passcode}`);
    });
}
*/

// Create a room and display the room ID and passcode
function createRoom() {
    socket.emit('createRoom', ({ roomID, passcode }) => {
        // Display the room info in the modal
        document.getElementById('roomIDText').textContent = roomID;
        //document.getElementById('passcodeText').textContent = passcode;

        const modal = document.getElementById('roomInfoModal');
        modal.style.display = "block";

        // Close the modal when the user clicks on <span> (x)
        document.querySelector('.close-btn').onclick = function() {
            modal.style.display = "none";
        };

        // Close the modal when the user clicks anywhere outside of the modal
        window.onclick = function(event) {
            if (event.target == modal) {
                modal.style.display = "none";
            }
        };
    });
}


// Delete a room
function deleteRoom() {
    const roomID = document.getElementById('currentRoomID').value;
    if (confirm('Are you sure you want to delete this room?')) {
        socket.emit('deleteRoom', roomID);
    }

    // Clear the room ID display after the room is deleted
    document.getElementById('currentRoomID').textContent = 'Room ID: Not joined';
}

// Send message to the room
function sendMessage() {
    const message = document.getElementById('message').value;
    socket.emit('chatMessage', message);
    document.getElementById('message').value = ''; // Clear input
}

// Display chat messages with time
socket.on('chatMessage', ({ username, message, timestamp }) => {
    console.log('time: ', timestamp)
    const chatBox = document.getElementById('chatBox');

    const textColor = username === 'System' ? 'red' : 'black';
    const user = username === 'System' ? '---> ' : `${username}: `;
    
    const color = getUsernameColor(username); // Get or generate color for the user
    const messageElement = document.createElement('p');
    
    messageElement.innerHTML = `<strong>${user}</strong> ${message} <span>(${timestamp})</span>`;
    messageElement.style.backgroundColor = color; // Set the background color
    messageElement.style.padding = '5px';
    messageElement.style.borderRadius = '5px';
    messageElement.style.color = textColor;
    
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight; // Scroll to the latest message
});

// Display chat history when joining a room
socket.on('chatHistory', (messages) => {
    const chatBox = document.getElementById('chatBox');
    chatBox.innerHTML = ''; // Clear previous chat
    messages.forEach(({ username, message, timestamp }) => {
        const color = getUsernameColor(username); // Get or generate color for the user
        const textColor = username === 'System' ? 'red' : 'black';
        const user = username === 'System' ? '---> ' : `${username}: `;
        const messageElement = document.createElement('p');
        
        messageElement.innerHTML = `<strong>${user}</strong> ${message} <span style="font-size: 0.8em; color: #555;">(${timestamp})</span>`;
        messageElement.style.backgroundColor = color; // Set the background color
        messageElement.style.padding = '5px';
        messageElement.style.borderRadius = '5px';

        messageElement.style.color = textColor;
        
        chatBox.appendChild(messageElement);
    });
});

// Function to copy text to clipboard
function copyToClipboard(elementId) {
    const text = document.getElementById(elementId).textContent;

    if (navigator.clipboard) {
        // Use the Clipboard API if available
        navigator.clipboard.writeText(text).then(() => {
            alert('Copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy: ', err);
        });
    } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            //alert('Copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
        document.body.removeChild(textArea);
    }
}




// Handle errors
socket.on('error', (message) => {
    alert(message);
});


document.addEventListener('DOMContentLoaded', (event) => {
    // Your code here
    document.getElementById('message').addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            sendMessage();
        }
    });
});



// Update the display of the room ID
function updateRoomIDDisplay(roomID) {
    const roomIDDisplay = document.getElementById('currentRoomID');
    roomIDDisplay.textContent = `Room ID: ${roomID}`;
}