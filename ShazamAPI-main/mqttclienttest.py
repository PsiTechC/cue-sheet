#!/usr/bin/env python3
import paho.mqtt.client as mqtt
import json

BROKER_URL = "test.mosquitto.org"
BROKER_PORT = 1883
TOPIC = "myTopic/waterData"

def on_connect(client, userdata, flags, rc):
    """Callback for when the client receives a CONNACK response from the server."""
    if rc == 0:
        print("Connected successfully to broker.")
        client.subscribe(TOPIC)
        print(f"Subscribed to topic: {TOPIC}")
    else:
        print(f"Connection failed with result code {rc}")

def on_message(client, userdata, msg):
    """Callback for when a PUBLISH message is received from the server."""
    payload_str = msg.payload.decode("utf-8")
    print(f"\nTopic: {msg.topic}\nRaw Message: {payload_str}")

    # Attempt to parse JSON
    try:
        data = json.loads(payload_str)
        
        # Extract all values
        device_id = data.get("deviceID")
        distance = data.get("distance")
        water_level = data.get("waterLevel")
        battery_voltage = data.get("batteryVoltage")
        solar_voltage = data.get("solarVoltage")
        temp = data.get("temp")
        humidity = data.get("hum")

        # Print all parsed values
        print("Parsed data:")
        print(f"  Device ID:      {device_id}")
        print(f"  Distance:       {distance} cm")
        print(f"  Water Level:    {water_level} cm")
        print(f"  Battery Voltage: {battery_voltage} V")
        print(f"  Solar Voltage:  {solar_voltage} V")
        print(f"  Temperature:    {temp} C")
        print(f"  Humidity:       {humidity} %")
    except json.JSONDecodeError as e:
        print("Error parsing JSON:", e)

def main():
    # Create an MQTT client
    client = mqtt.Client(client_id="PythonSub")

    # Assign callbacks
    client.on_connect = on_connect
    client.on_message = on_message

    # For test.mosquitto.org, no username/password required
    client.connect(BROKER_URL, BROKER_PORT, keepalive=60)

    # Blocking loop to process network traffic
    client.loop_forever()

if __name__ == "__main__":
    main()
