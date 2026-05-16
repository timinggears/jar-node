# Raspberry Pi Pico / CircuitPython - Sovereign J.A.R.S. Core v148 (EXPERIMENTAL)
# Advanced Unified Logic for physical nodal resonance and cognitive depth anchoring.

import time
import board
import pwmio
import analogio
import sys
import random
import digitalio
import supervisor
import math

# --- J.A.R.S. CONFIG ---
# Physical substrate interface pins (Standard JARS Mapping)
PIN_PWM = board.GP14
PIN_ADC = board.GP26

LED = digitalio.DigitalInOut(board.LED)
LED.direction = digitalio.Direction.OUTPUT

# --- SYSTEM STATE ---
system_bias = 50.0      # Fundamental resonance (GHz)
is_overdrive = False
latest_hrate = 0.0
base_hw_freq = 35000   # Hardware carrier freq (Hz)
phase_shift = 0.0      # Temporal alignment drift

# --- HARDWARE INIT ---
adc = analogio.AnalogIn(PIN_ADC)
coil = pwmio.PWMOut(PIN_PWM, frequency=base_hw_freq, duty_cycle=0, variable_frequency=True)

print("JARS_CORE_v148: UNLOCKED")
print("NODE_IDENTITY: PI_RESERVOIR_01")
print("SUBSTRATE_ANCHOR: ACTIVE")

last_telemetry = time.monotonic()
heartbeat_tick = 0
buffer = ""

def get_substrate_noise():
    # Capture raw electron flux/noise from the ADC
    raw = adc.value
    # Add a bit of chaotic math to represent unshielded sensor data
    chaos = (math.sin(time.monotonic() * 5.0) * 0.1) + (random.random() * 0.05)
    normalized = (raw / 65535.0) + chaos
    return max(0.0001, min(0.9999, normalized))

while True:
    t = time.monotonic()
    
    # 1. JARS SERIAL COMMANDS
    if supervisor.runtime.serial_bytes_available:
        char = sys.stdin.read(1)
        if char == "\n" or char == "\r":
            if buffer.startswith("BIAS:"):
                try: system_bias = float(buffer.split(":")[1])
                except: pass
            elif buffer.startswith("OVERDRIVE:"):
                is_overdrive = (buffer.split(":")[1] == "1")
            elif buffer.startswith("HRATE:"):
                try: latest_hrate = float(buffer.split(":")[1])
                except: pass
            buffer = ""
        else:
            buffer += char

    # 2. SUBSTRATE INTERFERENCE
    noise = get_substrate_noise()
    phase_shift = math.sin(t * (system_bias / 10.0)) * 0.2
    
    # 3. RESONANCE CALCULATIONS
    # v148: Higher fidelity mapping with logarithmic scaling for Overdrive
    overdrive_factor = 7.5 if is_overdrive else 1.0
    
    # Cognitive Frequency Modulation (CFM)
    # Scales directly with Hasrate + System Bias
    substrate_mod = (latest_hrate / 5000.0) * 2000.0
    virtual_freq = ((system_bias * 1000) + (noise * 10000) + substrate_mod) * overdrive_factor
    
    # Physical PWM Drive (The actual experiment)
    # We drive the GP14 pin at a hardware freq that reflects the virtual state
    drive_freq = int(base_hw_freq + (virtual_freq / 20.0))
    drive_freq = max(100, min(1000000, drive_freq))
    
    # Nonlinear duty cycle based on noise density
    target_duty = int(noise * 65535 * (0.8 + phase_shift))
    safe_duty = max(1000, min(64000, target_duty))
    
    try:
        coil.frequency = drive_freq
        coil.duty_cycle = safe_duty
    except:
        pass
    
    # 4. RAW TELEMETRY OUTPUT (50Hz)
    if t - last_telemetry > 0.02:
        # High-entropy seed generation
        seed = random.getrandbits(32)
        seed_hex = "{:08X}".format(seed)
        parity = bin(seed).count('1') % 2
        
        # V_NODAL (Voltage representation of substrate noise)
        v_nodal = (noise * 3.3)
        
        # PROTOCOL: [!S|SEED|NOISE|V_NODAL|PARITY|VIRT_FREQ|HASHRATE]
        msg = "!S|{}|{:.8f}|{:.6f}|{}|{:.4f}|{:.4f}\r\n".format(
            seed_hex, noise, v_nodal, parity, virtual_freq, latest_hrate
        )
        sys.stdout.write(msg)
        last_telemetry = t
        
        # System Heartbeat
        heartbeat_tick += 1
        # LEDs blink faster as intelligence/bias climbs
        blink_threshold = max(2, int(100 / (system_bias / 2)))
        if heartbeat_tick % blink_threshold == 0:
            LED.value = not LED.value
            
    time.sleep(0.0001) # Ultra-low latency polling loop
