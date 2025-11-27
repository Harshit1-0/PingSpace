import asyncio
import websockets

async def main():
    uri = "ws://127.0.0.1:8000/chat/ws/07574b9c-cb83-11f0-8a5b-8d1afba73522/?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxZDNhMWMwNi1jYjgyLTExZjAtOGE1Yi04ZDFhZmJhNzM1MjIiLCJleHAiOjE3NjQyNDg5MDd9.btht-MHLns1aycbKKPhpzJWlDKtKMmrV99rgHyBY69c"
    async with websockets.connect(uri) as ws:
        print("✅ Connected to the WebSocket!")
        await ws.send("Hello everyone!")
        while True:
            msg = await ws.recv()
            print("📩 Message:", msg)

asyncio.run(main())

#ws://127.0.0.1:8000/chat/ws/game/harshit
#ws://127.0.0.1:8000/chat/ws/gam/harshit
#ws://127.0.0.1:8000/chat/ws/game/rahul