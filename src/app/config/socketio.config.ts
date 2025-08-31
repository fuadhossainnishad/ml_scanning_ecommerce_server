import httpStatus from "http-status";
import { Server } from "http";
import { Socket, Server as SocketIoServer } from "socket.io";
import AppError from "../error/AppError";

let io: SocketIoServer;
export const socketio = (server: Server) => {
  io = new SocketIoServer(server, {
    cors: {
      origin: ["*"],
      methods: ["GET", "POST"],
    },
  });
  io.on("connection", (socket: Socket) => {
    console.log("Admin connected via Socket.IO:", socket.id);

    socket.on("join", (id: string, admin?: boolean) => {
      console.log(`userId: ${id} ready to receive notification`);
      socket.join(id);

      if (admin) {
        console.log("Admin connected via Socket.IO:", admin);
        socket.join("Admin");
      }
    });
    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
};

export const socket = () => {
  if (!io) {
    throw new AppError(httpStatus.NOT_FOUND, "Socket id not found");
  }
  return io;
};
