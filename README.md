# <a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a> SocketRepo

---

# 🧠 `apps/server` – Mission Socket Server (NestJS)

The `server` app is a scalable, real-time **NestJS-based** backend that facilitates mission-based command-and-control communication using **Socket.IO**. It enables seamless interaction between **controller clients** and **device clients**, orchestrated through mission-specific rooms with full **type safety** and **ack-based event flows**.

---

## 📐 Architecture Overview

```
apps/
  server/               # NestJS app extending a shared socket gateway
libs/
  socket/               # Shared base gateway for Socket.IO (NestJS)
  types/                # Event schemas, enums, payload types (shared)
```

---

## ⚙️ Core Technologies

- **NestJS** – Modular and extensible backend framework
- **Socket.IO** – Real-time bidirectional communication
- **Zod** – Runtime schema validation for socket payloads
- **TypeScript** – Full-stack type safety
- **Room-based Routing** – Mission-based scoping of socket interactions

---

## 🧩 Main Components

### 🔌 `SocketBaseGateway` (from `@org/socket`)
Reusable base gateway class that:
- Wraps `WebSocketGateway` from NestJS
- Defines common connection lifecycle handlers (`connect`, `disconnect`)
- Enforces consistent event subscription logic
- Supports typed sockets and structured ACK patterns (`ackSuccess`, `ackError`)

### 🎯 `MissionsSocketGateway` (in `apps/server`)
Extends the base gateway to:
- Handle mission room joins with validation
- Send mission-wide (`SEND_MISSION_COMMAND`) or device-specific (`DEVICE_COMMAND`) commands
- Emit real-time device status updates to controllers
- Return live device lists per mission upon join

### 📚 Shared Types & Schemas (from `@org/types`)
- Zod-based schemas for validating all socket payloads
- Strongly typed event definitions for:
  - `ClientToServerEvents`
  - `ServerToClientEvents`
  - Payload + Acknowledgement contracts

---

## 📡 Event Highlights

| Event                         | Sender       | Receiver     | Description                                      |
|------------------------------|--------------|--------------|--------------------------------------------------|
| `JOIN_MISSION_ROOMS`         | Controller / Device | Server | Joins multiple mission rooms and returns devices |
| `DEVICE_COMMAND`             | Controller    | Device       | Sends a direct command to a specific device      |
| `SEND_MISSION_COMMAND`       | Controller    | All devices in mission | Broadcasts a command to all devices in a mission |
| `DEVICE_STATUS_UPDATE`       | Device        | Controllers  | Sends real-time device status to relevant rooms  |
| `DEVICE_JOINED_MISSION`      | Server        | Controllers  | Notifies when a device joins a mission room      |

---

## 🛡 Type Safety & Validation

All events are strictly validated on the server using Zod. Clients must adhere to schema-defined payloads, ensuring robust and predictable communication across the stack.

---

## 🚀 Example Workflow

1. A **device** connects with a `deviceId` and joins multiple mission rooms.
2. A **controller** joins the same mission rooms and receives a list of connected devices.
3. The controller sends a `DEVICE_COMMAND` to a specific device, or `SEND_MISSION_COMMAND` to all devices in the room.
4. Devices respond or update their status, which gets pushed back to all controllers in that mission room.

---

For detailed socket types and validation schemas, see:
- [`libs/types`](../../libs/types)
- [`libs/socket`](../../libs/socket)
