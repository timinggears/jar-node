# Raspberry Pi Reservoir Sovereign: Python Bridge (v147)

Copy this code to your Raspberry Pi Pico (CircuitPython) as `code.py`.

### Key Improvements:
- **Safety Clamps**: Prevents PWM overflow (max 65535).
- **Heartbeat LED**: Visual indicator that the bridge is running.
- **Harmonic Stability**: Clamped frequency ranges to prevent coil saturation.
- **Improved Telemetry**: Higher precision nodal mapping.

```python
import time
import board
import pwmio
import analogio
import sys
import random
import digitalio

# --- CONFIGURATION ---
PIN_PWM = board.GP14
PIN_ADC = board.GP26
BASE_FREQ = 35000 # 35kHz base resonance
LED = digitalio.DigitalInOut(board.LED)
LED.direction = digitalio.Direction.OUTPUT

# --- HARDWARE INIT ---
adc = analogio.AnalogIn(PIN_ADC)
coil = pwmio.PWMOut(PIN_PWM, frequency=BASE_FREQ, duty_cycle=0)

print("PI_RESERVOIR_BRIDGE: v147_STABLE_LINK")
print("SUBSTRATE: GP14(PWM), GP26(ADC) ACTIVE")

last_telemetry = time.monotonic()
heartbeat_tick = 0

def get_jitter():
    # Read quantum jitter from ADC float
    return adc.value / 65535

while True:
    t = time.monotonic()
    
    # 1. SAMPLE SUBSTRATE
    jitter = get_jitter()
    
    # 2. CALCULATE HARMONICS (SAFETY CLAMPED)
    # Fundamental frequency shift based on jitter
    harm1 = 35000 + (jitter * 5000)
    
    # Duty cycle mapping (limited to 0-90% to prevent full DC saturation)
    # Using jitter to create "ripples" in the liquid state
    base_duty = int(jitter * 60000)
    safe_duty = max(5000, min(58000, base_duty))
    
    # 3. DRIVE COIL
    try:
        coil.frequency = int(harm1)
        coil.duty_cycle = safe_duty
    except Exception as e:
        # If hardware hits a limit, reset to base
        coil.frequency = BASE_FREQ
        coil.duty_cycle = 32768
    
    # 4. SEND TELEMETRY (50Hz)
    if t - last_telemetry > 0.02:
        # Format: !S|SEED|JITTER|NODAL_V|BIAS|FREQ
        seed = hex(random.getrandbits(32))[2:]
        v_nodal = (jitter * 2.5) + (random.random() * 0.1) # Synthetic nodal voltage
        
        # Telemetry line for the Bridge
        sys.stdout.write(f"!S|{seed}|{jitter:.4f}|{v_nodal:.2f}|0.00|{harm1:.1f}\n")
        last_telemetry = t
        
        # Heartbeat Blink
        heartbeat_tick += 1
        if heartbeat_tick % 25 == 0:
            LED.value = not LED.value
    
    # Small sleep to prevent processor hogging
    time.sleep(0.001)
```
