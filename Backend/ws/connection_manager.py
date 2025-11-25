from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        self.rooms = {}              # {(server_id, room): [sockets]}
        self.online = {}             # {(server_id, room): [usernames]}
        self.socket_to_username = {} # {socket: username}

    async def connect(self, websocket: WebSocket, server_id: str, room: str, username: str):
        await websocket.accept()

        key = (server_id, room)

        if key not in self.rooms:
            self.rooms[key] = []
            self.online[key] = []

        self.rooms[key].append(websocket)
        print("This are self.rooms" , self.rooms)
        if username not in self.online[key]:
            self.online[key].append(username)

        self.socket_to_username[websocket] = username

        print(f"{username} connected to {key}")

    def disconnect(self, websocket: WebSocket, server_id: str, room: str):
        key = (server_id, room)

        username = self.socket_to_username.pop(websocket, None)

        
        if key in self.rooms and websocket in self.rooms[key]:
            self.rooms[key].remove(websocket)

        if username and key in self.online and username in self.online[key]:
            self.online[key].remove(username)

    async def broadcast(self, server_id: str, room: str, sender_socket: WebSocket, message):
        key = (server_id, room)

        if key not in self.rooms:
            return

        stale = []

        for connection in list(self.rooms[key]):
            try:
                await connection.send_json(message)
            except Exception:
                stale.append(connection)

        for connection in stale:
            try:
                await connection.close()
            except:
                pass
            self.disconnect(connection, server_id, room)

    def get_all_the_rooms(self):
        return self.rooms

    def check_new(self, server_id: str, room: str, username: str):
        key = (server_id, room)
        return key not in self.online or username not in self.online[key]


manager = ConnectionManager()
