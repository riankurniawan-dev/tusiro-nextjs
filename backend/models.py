from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
import datetime
from database import Base

class Station(Base):
    __tablename__ = "stations"

    id = Column(Integer, primary_key=True, index=True) # station_id from logger
    name = Column(String(100), default="New Station")
    latitude = Column(String(50))
    longitude = Column(String(50))
    api_key = Column(String(100), index=True)
    relay_address = Column(String(200))
    
    sensor_data = relationship("SensorData", back_populates="station", cascade="all, delete-orphan")

class SensorData(Base):
    __tablename__ = "sensor_data"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    station_id = Column(Integer, ForeignKey("stations.id"))
    device_id = Column(Integer)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    
    # Sensors
    moisture = Column(Float, nullable=True)
    temperature = Column(Float, nullable=True)
    humidity = Column(Float, nullable=True)
    voltage = Column(Float, nullable=True)
    current = Column(Float, nullable=True)
    
    # Status
    mode = Column(String(20), nullable=True)
    relay1 = Column(String(10), nullable=True)
    relay2 = Column(String(10), nullable=True)
    
    station = relationship("Station", back_populates="sensor_data")

class Threshold(Base):
    __tablename__ = "thresholds"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    station_id = Column(Integer, ForeignKey("stations.id"))
    sensor = Column(String(50)) # e.g. moisture, temperature
    operator = Column(String(20)) # greater, smaller, equal, between
    value1 = Column(Float)
    value2 = Column(Float, nullable=True) # Used for 'between'

class NotificationSetting(Base):
    __tablename__ = "notification_settings"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    smtp_host = Column(String(100), nullable=True)
    smtp_port = Column(Integer, nullable=True)
    smtp_user = Column(String(100), nullable=True)
    smtp_pass = Column(String(100), nullable=True)
    telegram_bot_token = Column(String(150), nullable=True)
    telegram_chat_id = Column(String(100), nullable=True)

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(50), unique=True, index=True)
    password_hash = Column(String(200))
    role = Column(String(20), default="viewer") # admin, viewer
