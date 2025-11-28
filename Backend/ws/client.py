import websockets
import asyncio

async def test_websocket():
    room_id = "0424cce9-cc07-11f0-afe3-a02942707ff5"
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1OTViMmFkZC1jYmI3LTExZjAtYmFiYi1hMDI5NDI3MDdmZjUiLCJ1c2VybmFtZSI6Im1haW4iLCJleHAiOjE3NjQzMDM2NzZ9.2THBtvBx0mmjYs9hVDrXk05vOCbe2NBhojUQFeBf4jA"
    
    uri = f"ws://127.0.0.1:8000/ws/{room_id}?token={token}"
    
    async with websockets.connect(uri) as websocket:
        print("Connected!")
        await websocket.send("Hello")
        response = await websocket.recv()
        print(f"Received: {response}")

asyncio.run(test_websocket())