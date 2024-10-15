import { WebSocketServer } from "ws";

// Initialize WebSocket Server
const wss = new WebSocketServer({ port: 3002 });
const clients = new Set();

wss.on("connection", (ws) => {
  clients.add(ws);
  console.log("A new client connected");

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === "join") {
        console.log(`User joined`);
      }
    } catch (error) {
      console.error("Error parsing message", error);
    }
  });

  ws.on("close", () => {
    clients.delete(ws);
    console.log("A client disconnected");
  });
});

// Function to send notifications to all connected clients
const sendNotificationToAll = (notification) => {
  const message = JSON.stringify({
    type: "new_notification",
    notification: {
      id: notification.id,
      message: notification.message,
      fullName: notification.fullName,
      email: notification.email,
      appointmentCount: notification.appointmentCount,
    },
  });

  console.log("Sending message to all clients:", message);
  clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(message);
    }
  });
};

// New function to handle a new email and notify clients
const handleNewEmail = (newNotification) => {
  // Construct the notification message from the newNotification object
  const notificationMessage = {
    message: `New appointment added: ${newNotification.appointment_count}/20 (${newNotification.message})`,
    id: `${newNotification.id}`,
  };

  // Send notification to all clients
  sendNotificationToAll(notificationMessage);
};

export { wss, sendNotificationToAll, handleNewEmail };
