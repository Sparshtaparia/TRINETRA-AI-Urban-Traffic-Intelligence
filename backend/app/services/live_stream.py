import asyncio
import json
import random
import time
import uuid

# We will pass the websocket manager to this function so it can broadcast
async def generate_simulated_events(manager):
    segments = [f"SEG-{random.randint(1000, 9000)}" for _ in range(50)]
    
    while True:
        # Simulate wait between events (0.5s to 2s)
        await asyncio.sleep(random.uniform(0.5, 2.0))
        
        # Generate synthetic IoT event
        segment_id = random.choice(segments)
        base_severity = random.random()
        picq_delta = random.randint(1, 25)
        
        event = {
            "type": "violation_event",
            "payload": {
                "event_id": f"EVT-{str(uuid.uuid4())[:8].upper()}",
                "segment_id": segment_id,
                "timestamp": int(time.time() * 1000),
                "severity": base_severity,
                "picq_delta": picq_delta,
                "source": random.choice(["CCTV-AI", "IOT-SENSOR", "USER-APP"])
            }
        }
        
        await manager.broadcast(json.dumps(event))

async def generate_csv_stream(manager, df):
    # Process 5 rows every 2 seconds
    chunk_size = 5
    sleep_duration = 2.0
    
    # Ensure segment_id is a list/series we can iterate over
    # We will loop through the dataframe in chunks
    total_rows = len(df)
    
    while True:
        for i in range(0, total_rows, chunk_size):
            chunk = df.iloc[i:i+chunk_size]
            
            for _, row in chunk.iterrows():
                # Extract segment_id (assuming it exists after data_ingestion cleaning)
                segment_id = row.get("segment_id", f"SEG-{random.randint(1000, 9000)}")
                
                base_severity = random.random()
                picq_delta = random.randint(1, 25)
                
                event = {
                    "type": "violation_event",
                    "payload": {
                        "event_id": f"EVT-{str(uuid.uuid4())[:8].upper()}",
                        "segment_id": str(segment_id),
                        "timestamp": int(time.time() * 1000),
                        "severity": base_severity,
                        "picq_delta": picq_delta,
                        "source": "CSV-STREAM"
                    }
                }
                
                await manager.broadcast(json.dumps(event))
            
            await asyncio.sleep(sleep_duration)
