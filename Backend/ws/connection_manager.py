from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        self.rooms = {} #{(room_id) : [sockets]}
        self.socket_to_username = {} #{socket: username}              


    async def connect(self, websocket: WebSocket, room_id :str , username:str):
        await websocket.accept()

        # key = (server_id, room)

        if room_id not in self.rooms:
            self.rooms[room_id] = []

        self.rooms[room_id].append(websocket)
        print("This are self.rooms" , self.rooms)
     

        self.socket_to_username[websocket] = username


    def disconnect(self, websocket: WebSocket, room_id: str):

        if room_id in self.rooms and websocket in self.rooms[room_id]:

            self.rooms[room_id].remove(websocket) 

    async def broadcast(self, room_id: str, message):
        # key = (server_id, room)

        if room_id not in self.rooms:
            return

        stale = []

        for connection in list(self.rooms[room_id]):
            try:
                await connection.send_json(message)
            except Exception:
                stale.append(connection)

        for connection in stale:
            try:
                await connection.close()
            except:
                pass
            self.disconnect(connection, room_id)

    def get_all_the_rooms(self):
        return self.rooms

    def check_new(self, server_id: str, room: str, username: str):
        key = (server_id, room)
        return key not in self.online or username not in self.online[key]


manager = ConnectionManager()
