import { socket } from "../app/config/socketio.config";

export const emitMessage = (id: string, key: string, data: object) => {
  socket().to(id).emit(key, data);
};

export const emitMessageToAdmin = (key: string, data: object) => {
  console.log("Emitting to Admin:", key, data); // Add this

  socket().to("Admin").emit(key, data);
};
