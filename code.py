# Raspberry Pi Pico / CircuitPython - Nodal Reservoir Bridge v147
# Save this file to your Pico as 'code.py'

import time
import board
import pwmio
import analogio
import sys
import random
import digitalio
import supervisor

# --- CONFIGURATION ---
# GP14 is the PWM output for the coil
# GP26 is the ADC input for the feedback probe
PIN_PWM = board.GP14
PIN_ADC = board.GP26

LED = digitalio.DigitalInOut(board.LED)
LED.direction = digitalio.Direction.OUTPUT

# --- SYSTEM STATE ---
# These variables are modulated by the Web Interface via the Serial Bridge
system_bias = 50.0      # Fundamental resonance (50.0 = 50GHz Virtual)
is_overdrive = False
base_hw_freq = 35000   # Hardware carrier freq (Base excitation)

# --- HARDWARE INIT ---
adc = analogio.AnalogIn(PIN_ADC)
# variable_frequency=True allows the feedback loop to shift harmonics
coil = pwmio.PWMOut(PIN_PWM, frequency=base_hw_freq, duty_cycle=0, variable_frequency=True)

print("PI_RESERVOIR_BRIDGE: v147_QUANTUM_LINK")
print("SUBSTRATE: GP14(PWM), GP26(ADC) ACTIVE")

last_telemetry = time.monotonic()
heartbeat_tick = 0
buffer = ""

def get_substrate_jitter():
    # Capture noise floor from the liquid state
    v = (adc.value / 65535) * 3.3
    return v / 3.3 # Normalized 0.0 - 1.0

while True:
    t = time.monotonic()
    
    # 1. READ COMMANDS FROM SERVER BRIDGE
    # Commands arrive as "BIAS:X.X\n" or "OVERDRIVE:X\n"
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
    jitter = get_substrate_jitter()
    
    # 3. CALCULATE RESONANCE
    # Virtual frequency (reported to UI): 1 bias = 1 GHz
    # 50 bias = 50,000Hz internal = 50.0 GHz UI Label
    overdrive_multi = 3.5 if is_overdrive else 1.0
    virtual_freq = (system_bias * 1000) * overdrive_multi
    
    # Real hardware excitation (PWM drive)
    # We modulate the base 35kHz carrier with substrate jitter
    real_freq = int(base_hw_freq + (jitter * 45000))
    
    # Duty cycle mapping (limited to 0-90% to prevent full DC saturation)
    base_duty = int(jitter * 65535 * 0.9)
    safe_duty = max(5000, min(58000, base_duty))
    
    # 4. DRIVE COIL
    try:
        coil.frequency = min(1000000, real_freq) # Pico limit ~1MHz
        coil.duty_cycle = safe_duty
    except Exception as e:
        # Failsafe restart
        coil.frequency = base_hw_freq
        coil.duty_cycle = 32768
    
    # 5. SEND TELEMETRY (50Hz)
    if t - last_telemetry > 0.02:
        # Format: !S|SEED|JITTER|NODAL_V|PARITY|FREQ
        seed_val = random.getrandbits(32)
        seed_hex = "{:08X}".format(seed_val)
        parity = bin(seed_val).count('1') % 2
        
        v_nodal = (jitter * 3.3)
        
        # Telemetry line for the Bridge: [Header|Seed|Jitter|Voltage|Parity|Freq]
        sys.stdout.write("!S|{}|{:.6f}|{:.4f}|{}|{:.1f}\r\n".format(seed_hex, jitter, v_nodal, parity, virtual_freq))
        last_telemetry = t
        
        # Heartbeat Blink (Pulse rate scales with system bias)
        heartbeat_tick += 1
        blink_rate = 25 if system_bias < 50 else (10 if system_bias < 80 else 3)
        if heartbeat_tick % blink_rate == 0:
            LED.value = not LED.value
    
    # Tiny sleep for stability
    time.sleep(0.001)
