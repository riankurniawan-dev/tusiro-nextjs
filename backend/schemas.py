from pydantic import BaseModel
from typing import List, Optional, Any

class S1(BaseModel):
    moisture: Optional[float] = None

class S2(BaseModel):
    temperature: Optional[float] = None
    humidity: Optional[float] = None

class S3(BaseModel):
    voltage: Optional[float] = None

class S4(BaseModel):
    current: Optional[float] = None

class S5(BaseModel):
    mode: Optional[str] = None

class S6(BaseModel):
    relay1: Optional[str] = None
    relay2: Optional[str] = None

class LoggerPayload(BaseModel):
    station_id: int
    device_id: int
    date: str
    time: str
    latitude: str
    longitude: str
    s1: List[S1]
    s2: List[S2]
    s3: List[S3]
    s4: List[S4]
    s5: List[S5]
    s6: List[S6]
    address: str
    key: str

class StationCreate(BaseModel):
    id: int
    name: str
    latitude: str
    longitude: str
    api_key: str
    relay_address: str
    
    class Config:
        from_attributes = True

class ThresholdCreate(BaseModel):
    station_id: int
    sensor: str
    operator: str
    value1: float
    value2: Optional[float] = None

class ThresholdResponse(ThresholdCreate):
    id: int
    
    class Config:
        from_attributes = True

class NotificationSettingBase(BaseModel):
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_user: Optional[str] = None
    smtp_pass: Optional[str] = None
    telegram_bot_token: Optional[str] = None
    telegram_chat_id: Optional[str] = None

class NotificationSettingResponse(NotificationSettingBase):
    id: int

    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    username: str
    password: str
    role: str = "viewer"

class UserUpdate(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    username: str
    role: str
    
    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    username: str
    password: str
