# Raspberry Pi Reservoir Sovereign: Python Bridge (v147)

Copy this code to your Raspberry Pi Pico (CircuitPython) as `code.py`.

### Key Improvements (v147):
- **Dynamic Biasing**: Responds to `BIAS:X` and `OVERDRIVE:X` commands from the Web Interface.
- **Quantum Scaling**: Reports frequency in the v147 "Linear GHz" format (1 bias = 1 GHz).
- **Safety Clamps**: Prevents PWM overflow (max 1MHz on Pico hardware).
- **Interactive Feedback**: Changes color or pulse rate based on user slider input.

```python
import time
import board
import pwmio
import analogio
import sys
import random
import digitalio
import supervisor

# --- CONFIGURATION ---
PIN_PWM = board.GP14
PIN_ADC = board.GP26
LED = digitalio.DigitalInOut(board.LED)
LED.direction = digitalio.Direction.OUTPUT

# --- SYSTEM STATE ---
system_bias = 50.0      # Default to mid-point
is_overdrive = False
base_frequency = 50000 # 50kHz base hardware freq

# --- HARDWARE INIT ---
adc = analogio.AnalogIn(PIN_ADC)
coil = pwmio.PWMOut(PIN_PWM, frequency=base_frequency, duty_cycle=0, variable_frequency=True)

print("PI_RESERVOIR_BRIDGE: v147_QUANTUM_LINK")
print("SUBSTRATE: GP14(PWM), GP26(ADC) ACTIVE")

last_telemetry = time.monotonic()
heartbeat_tick = 0
buffer = ""

def get_jitter():
    # Read quantum jitter from ADC float
    return adc.value / 65535

while True:
    t = time.monotonic()
    
    # 1. READ COMMANDS FROM SERVER
    if supervisor.runtime.serial_bytes_available:
        char = sys.stdin.read(1)
        if char == "\n" or char == "\r":
            if buffer.startswith("BIAS:"):
                try:
                    system_bias = float(buffer.split(":")[1])
                except: pass
            elif buffer.startswith("OVERDRIVE:"):
                is_overdrive = (buffer.split(":")[1] == "1")
            buffer = ""
        else:
            buffer += char

    # 2. SAMPLE SUBSTRATE
    jitter = get_jitter()
    
    # 3. CALCULATE RESONANCE
    # Virtual frequency (reported to UI): 1 bias = 1 GHz
    # Real frequency (Hardware drive): 50kHz + jitter modulation
    harmonic_multi = 3.5 if is_overdrive else 1.0
    virtual_freq = (system_bias * 1000) * harmonic_multi # 100 bias = 100k (100G)
    
    # Real hardware excitation (clamped for safety)
    real_freq = int(base_frequency + (jitter * 40000))
    
    # Duty cycle mapping (limited to 0-90% to prevent full DC saturation)
    base_duty = int(jitter * 60000)
    safe_duty = max(5000, min(58000, base_duty))
    
    # 4. DRIVE COIL
    try:
        coil.frequency = min(1000000, real_freq) # Pico limit ~1MHz
        coil.duty_cycle = safe_duty
    except Exception as e:
        coil.frequency = base_frequency
        coil.duty_cycle = 32768
    
    # 5. SEND TELEMETRY (50Hz)
    if t - last_telemetry > 0.02:
        # Format: !S|SEED|JITTER|NODAL_V|PARITY|FREQ
        seed_val = random.getrandbits(32)
        seed_str = hex(seed_val)[2:].upper().zfill(8)
        parity = bin(seed_val).count('1') % 2
        
        v_nodal = (jitter * 2.5) + (random.random() * 0.1) # Synthetic nodal voltage
        
        # We report the VIRTUAL frequency to the dashboard
        sys.stdout.write(f"!S|{seed_str}|{jitter:.6f}|{v_nodal:.4f}|{parity}|{virtual_freq:.1f}\r\n")
        last_telemetry = t
        
        # Heartbeat Blink (Scales with bias)
        heartbeat_tick += 1
        blink_rate = 25 if system_bias < 50 else (10 if system_bias < 80 else 3)
        if heartbeat_tick % blink_rate == 0:
            LED.value = not LED.value
    
    # Small sleep to prevent processor hogging
    time.sleep(0.001)
```
