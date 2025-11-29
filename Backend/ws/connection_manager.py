from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        self.rooms = {}  # room_id -> [websockets]
        self.servers = {}  # server_id -> [websockets] for server-level events
        self.deleted_rooms = {}
        self.socket_to_username = {}   
        self.message = {
        }            


    async def connect(self, websocket: WebSocket, room_id :str , username:str):
        

        if room_id not in self.rooms:
            self.rooms[room_id] = []

        self.rooms[room_id].append(websocket)
        print("This are self.rooms" , self.rooms)
    

        self.socket_to_username[websocket] = username

    async def connect_to_server(self, websocket: WebSocket, server_id: str, username: str):
        """Connect a WebSocket to a server for server-level events (room creation, etc.)"""
        if server_id not in self.servers:
            self.servers[server_id] = []
        
        self.servers[server_id].append(websocket)
        self.socket_to_username[websocket] = username
        print(f"Connected to server {server_id}, total connections: {len(self.servers[server_id])}")
    async def connect_to_message(self , websocket: WebSocket , payload : object) :
        if payload.room_id not in self.message :
            self.message[payload.room_id] = []
        self.message[payload.room_id].append(payload.message)


    async def broadcast_delete_message(self , room_id , message_id) :
        if room_id not in self.message :
            return
        # clash : [{message_id : 1 , content : "kch hoga" }]
        messages = self.message[room_id]
        for i in range(len(messages)) :
            if messages[i]['message_id'] == message_id :
                messages.pop(i)
                break
        self.message[room_id] = messages


        payload = {
            "action" : "delete_message",
            "message_id" : message_id
        }

        if room_id in self.rooms:
            for conn in list(self.rooms[room_id]):
                try:
                    await conn.send_json(payload)
                except Exception:
                    pass
                
            


    def get_all_rooms(self):
        return self.rooms

    def disconnect(self, websocket: WebSocket, room_id: str):

        if room_id in self.rooms and websocket in self.rooms[room_id]:

            self.rooms[room_id].remove(websocket) 

    def disconnect_from_server(self, websocket: WebSocket, server_id: str):
        """Disconnect a WebSocket from a server"""
        if server_id in self.servers and websocket in self.servers[server_id]:
            self.servers[server_id].remove(websocket)
            if len(self.servers[server_id]) == 0:
                del self.servers[server_id]

    async def broadcast(self, room_id: str, message):

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

    async def broadcast_to_server(self, server_id: str, message):
        """Broadcast a message to all WebSocket connections in a server"""
        if server_id not in self.servers:
            return

        stale = []

        for connection in list(self.servers[server_id]):
            try:
                await connection.send_json(message)
            except Exception:
                stale.append(connection)

        for connection in stale:
            try:
                await connection.close()
            except:
                pass
            self.disconnect_from_server(connection, server_id)

    def get_all_the_rooms(self):
        return self.rooms

    def check_new(self, server_id: str, room: str, username: str):
        key = (server_id, room)
        return key not in self.online or username not in self.online[key]


manager = ConnectionManager() 

