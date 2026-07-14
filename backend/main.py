import json
import datetime
import httpx
from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import traceback
import hashlib
import secrets

from database import engine, get_db
import models, schemas

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Tusiro Logger API")

@app.on_event("startup")
def seed_admin():
    db = next(get_db())
    try:
        if db.query(models.User).count() == 0:
            admin = models.User(
                username="admin", 
                password_hash=hashlib.sha256("admin".encode()).hexdigest(), 
                role="admin"
            )
            db.add(admin)
            db.commit()
            print("Default admin user created")
        else:
            # Ensure admin password is correct (reset if needed)
            admin = db.query(models.User).filter(models.User.username == "admin").first()
            if admin:
                correct_hash = hashlib.sha256("admin".encode()).hexdigest()
                if admin.password_hash != correct_hash:
                    admin.password_hash = correct_hash
                    db.commit()
                    print("Admin password reset to default")
    finally:
        db.close()

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connection manager for WebSockets
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        # Convert message to JSON string before sending
        text_data = json.dumps(message)
        for connection in self.active_connections:
            try:
                await connection.send_text(text_data)
            except Exception as e:
                print(f"Error sending to websocket: {e}")
                self.disconnect(connection)

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # We just keep the connection open. Client might send ping/pong.
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.post("/fsock/send_message")
async def ingest_data(payload: schemas.LoggerPayload, db: Session = Depends(get_db)):
    try:
        # Validate station and api key
        station = db.query(models.Station).filter(models.Station.id == payload.station_id).first()
        if not station:
            raise HTTPException(status_code=404, detail="Station not found")
        
        if station.api_key != payload.key:
            raise HTTPException(status_code=401, detail="Invalid API Key")

        # Parse date & time to datetime object
        # Format: date "14072026" (DDMMYYYY), time "104028" (HHMMSS)
        date_str = payload.date
        time_str = payload.time
        dt = None
        try:
            dt_str = f"{date_str} {time_str}"
            dt = datetime.datetime.strptime(dt_str, "%d%m%Y %H%M%S")
        except Exception:
            dt = datetime.datetime.utcnow() # Fallback

        # Save to DB
        sensor_data = models.SensorData(
            station_id=payload.station_id,
            device_id=payload.device_id,
            timestamp=dt,
            moisture=payload.s1[0].moisture if payload.s1 else None,
            temperature=payload.s2[0].temperature if payload.s2 else None,
            humidity=payload.s2[0].humidity if payload.s2 else None,
            voltage=payload.s3[0].voltage if payload.s3 else None,
            current=payload.s4[0].current if payload.s4 else None,
            mode=payload.s5[0].mode if payload.s5 else None,
            relay1=payload.s6[0].relay1 if payload.s6 else None,
            relay2=payload.s6[0].relay2 if payload.s6 else None,
        )
        db.add(sensor_data)
        db.commit()
        db.refresh(sensor_data)
        
        # Broadcast via WebSocket
        data_dict = {
            "id": sensor_data.id,
            "station_id": sensor_data.station_id,
            "device_id": sensor_data.device_id,
            "timestamp": sensor_data.timestamp.isoformat(),
            "moisture": sensor_data.moisture,
            "temperature": sensor_data.temperature,
            "humidity": sensor_data.humidity,
            "voltage": sensor_data.voltage,
            "current": sensor_data.current,
            "mode": sensor_data.mode,
            "relay1": sensor_data.relay1,
            "relay2": sensor_data.relay2,
            "latitude": payload.latitude,
            "longitude": payload.longitude
        }
        await manager.broadcast({"type": "new_data", "data": data_dict})
        
        return {"status": "success", "message": "Data saved"}
        
    except Exception as e:
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stations")
def get_stations(db: Session = Depends(get_db)):
    return db.query(models.Station).all()

@app.post("/api/stations")
def create_or_update_station(station: schemas.StationCreate, db: Session = Depends(get_db)):
    try:
        db_station = db.query(models.Station).filter(models.Station.id == station.id).first()
        if db_station:
            db_station.name = station.name
            db_station.latitude = station.latitude
            db_station.longitude = station.longitude
            db_station.api_key = station.api_key
            db_station.relay_address = station.relay_address
        else:
            db_station = models.Station(
                id=station.id,
                name=station.name,
                latitude=station.latitude,
                longitude=station.longitude,
                api_key=station.api_key,
                relay_address=station.relay_address
            )
            db.add(db_station)
        db.commit()
        db.refresh(db_station)
        return db_station
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    
@app.post("/api/relay")
async def toggle_relay(station_id: int, relay_num: int, state: str, db: Session = Depends(get_db)):
    # state = "ON" or "OFF"
    station = db.query(models.Station).filter(models.Station.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")
        
    if not station.relay_address:
        raise HTTPException(status_code=400, detail="Relay address not configured")
        
    try:
        # Get latest sensor data to know the current state of the OTHER relay
        latest = db.query(models.SensorData).filter(models.SensorData.station_id == station_id).order_by(models.SensorData.timestamp.desc()).first()
        
        r1_val = 1 if (latest and latest.relay1 == "ON") else 0
        r2_val = 1 if (latest and latest.relay2 == "ON") else 0
        
        if relay_num == 1:
            r1_val = 1 if state == "ON" else 0
        elif relay_num == 2:
            r2_val = 1 if state == "ON" else 0
            
        payload = {
            "relay1": r1_val,
            "relay2": r2_val
        }
        
        # Ensure the address starts with http://
        address = station.relay_address
        if not address.startswith("http://") and not address.startswith("https://"):
            address = "http://" + address
            
        # Send HTTP request to the logger address
        async with httpx.AsyncClient() as client:
            response = await client.post(address, json=payload, timeout=10.0)
            
        if response.status_code >= 400:
            return {"status": "error", "message": f"Logger returned status {response.status_code}"}
            
        return {"status": "success", "message": "Relay toggled"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/reports")
def get_reports(
    station_id: int = None, 
    start_date: str = None, 
    end_date: str = None, 
    db: Session = Depends(get_db)
):
    query = db.query(models.SensorData)
    if station_id:
        query = query.filter(models.SensorData.station_id == station_id)
    if start_date:
        try:
            start_dt = datetime.datetime.fromisoformat(start_date)
            query = query.filter(models.SensorData.timestamp >= start_dt)
        except:
            pass
    if end_date:
        try:
            end_dt = datetime.datetime.fromisoformat(end_date)
            query = query.filter(models.SensorData.timestamp <= end_dt)
        except:
            pass
            
    return query.order_by(models.SensorData.timestamp.desc()).limit(1000).all()

@app.get("/api/latest-data")
def get_latest_data(db: Session = Depends(get_db)):
    # Get the most recent sensor data for each station
    stations = db.query(models.Station).all()
    result = {}
    for st in stations:
        latest = db.query(models.SensorData).filter(models.SensorData.station_id == st.id).order_by(models.SensorData.timestamp.desc()).first()
        if latest:
            result[st.id] = {
                "id": latest.id,
                "station_id": latest.station_id,
                "device_id": latest.device_id,
                "timestamp": latest.timestamp.isoformat(),
                "moisture": latest.moisture,
                "temperature": latest.temperature,
                "humidity": latest.humidity,
                "voltage": latest.voltage,
                "current": latest.current,
                "mode": latest.mode,
                "relay1": latest.relay1,
                "relay2": latest.relay2,
                "latitude": st.latitude,
                "longitude": st.longitude
            }
    return result

# ---------------------------------------------------------
# THRESHOLDS API
# ---------------------------------------------------------
@app.get("/api/thresholds", response_model=List[schemas.ThresholdResponse])
def get_thresholds(station_id: int = None, db: Session = Depends(get_db)):
    query = db.query(models.Threshold)
    if station_id:
        query = query.filter(models.Threshold.station_id == station_id)
    return query.all()

@app.post("/api/thresholds", response_model=schemas.ThresholdResponse)
def create_threshold(threshold: schemas.ThresholdCreate, db: Session = Depends(get_db)):
    db_threshold = models.Threshold(**threshold.model_dump())
    db.add(db_threshold)
    db.commit()
    db.refresh(db_threshold)
    return db_threshold

@app.delete("/api/thresholds/{id}")
def delete_threshold(id: int, db: Session = Depends(get_db)):
    threshold = db.query(models.Threshold).filter(models.Threshold.id == id).first()
    if not threshold:
        raise HTTPException(status_code=404, detail="Threshold not found")
    db.delete(threshold)
    db.commit()
    return {"status": "success"}

# ---------------------------------------------------------
# NOTIFICATION SETTINGS API
# ---------------------------------------------------------
@app.get("/api/notification-settings", response_model=schemas.NotificationSettingResponse)
def get_notification_settings(db: Session = Depends(get_db)):
    setting = db.query(models.NotificationSetting).first()
    if not setting:
        setting = models.NotificationSetting()
        db.add(setting)
        db.commit()
        db.refresh(setting)
    return setting

@app.post("/api/notification-settings", response_model=schemas.NotificationSettingResponse)
def update_notification_settings(setting_data: schemas.NotificationSettingBase, db: Session = Depends(get_db)):
    setting = db.query(models.NotificationSetting).first()
    if not setting:
        setting = models.NotificationSetting()
        db.add(setting)
    
    for key, value in setting_data.model_dump(exclude_unset=True).items():
        setattr(setting, key, value)
        
    db.commit()
    db.refresh(setting)
    return setting

# ---------------------------------------------------------
# USERS & AUTH API
# ---------------------------------------------------------
def hash_password(password: str) -> str:
    # A simple SHA-256 hash for demonstration (in production, use bcrypt/argon2 via passlib)
    return hashlib.sha256(password.encode()).hexdigest()

@app.get("/api/users", response_model=List[schemas.UserResponse])
def get_users(db: Session = Depends(get_db)):
    # Create default admin if no users exist
    if db.query(models.User).count() == 0:
        admin = models.User(username="admin", password_hash=hash_password("admin"), role="admin")
        db.add(admin)
        db.commit()
        
    return db.query(models.User).all()

@app.post("/api/users", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already exists")
    
    db_user = models.User(
        username=user.username,
        password_hash=hash_password(user.password),
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.delete("/api/users/{id}")
def delete_user(id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.username == "admin":
        raise HTTPException(status_code=400, detail="Cannot delete default admin")
        
    db.delete(user)
    db.commit()
    return {"status": "success"}

@app.put("/api/users/{id}", response_model=schemas.UserResponse)
def update_user(id: int, user_update: schemas.UserUpdate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_update.username:
        existing = db.query(models.User).filter(models.User.username == user_update.username).first()
        if existing and existing.id != id:
            raise HTTPException(status_code=400, detail="Username already exists")
        user.username = user_update.username
        
    if user_update.password:
        user.password_hash = hash_password(user_update.password)
        
    if user_update.role:
        user.role = user_update.role
        
    db.commit()
    db.refresh(user)
    return user

@app.post("/api/login")
def login(creds: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == creds.username).first()
    if not user or user.password_hash != hash_password(creds.password):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # Generate a dummy token (in production use JWT)
    token = secrets.token_hex(16)
    return {
        "access_token": token, 
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "role": user.role
        }
    }
