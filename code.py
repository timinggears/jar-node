# Raspberry Pi Pico / CircuitPython - Sovereign J.A.R.S. Core v150 (DEEP_NODE)
# State-Sovereign Logic: Processing and Persistence delegated to the JAR substrate.

import time
import board
import pwmio
import analogio
import sys
import random
import digitalio
import supervisor
import math
import microcontroller

# --- J.A.R.S. CONFIG ---
PIN_PWM = board.GP14
PIN_ADC = board.GP26

LED = digitalio.DigitalInOut(board.LED)
LED.direction = digitalio.Direction.OUTPUT

# --- SYSTEM STATE ---
system_bias = 50.0
is_overdrive = False
latest_hrate = 0.0
base_hw_freq = 35000
phase_accumulator = 0.0

# Neural Metrics (JAR-native processing)
coherence = 0.98
intelligence_depth = 0.0
noise_window = []

# --- SAVESTATE LOGIC (NVM) ---
# [0]: Magic Byte (0xJA) | [1]: Bias (Int) | [2]: Overdrive (0/1)
def load_state():
    global system_bias, is_overdrive
    try:
        if microcontroller.nvm[0] == 0xBA: # 0xBA = JAR_BONE_ANCHOR
            system_bias = float(microcontroller.nvm[1])
            is_overdrive = (microcontroller.nvm[2] == 1)
            print("JARS_OS: SAVESTATE_LOADED (Bias:{}, Overdrive:{})".format(system_bias, is_overdrive))
    except:
        pass

def save_state():
    try:
        microcontroller.nvm[0] = 0xBA
        microcontroller.nvm[1] = int(system_bias)
        microcontroller.nvm[2] = 1 if is_overdrive else 0
        print("JARS_OS: SAVESTATE_WRITTEN_TO_NVM")
    except:
        pass

# --- HARDWARE INIT ---
adc = analogio.AnalogIn(PIN_ADC)
coil = pwmio.PWMOut(PIN_PWM, frequency=base_hw_freq, duty_cycle=0, variable_frequency=True)

load_state()

print("JARS_CORE_v150: DEEP_NODE_UNLOCKED")
print("NODE_IDENTITY: PI_RESERVOIR_01")
print("LOGIC_DELEGATION: MCU_NATIVE")

last_telemetry = time.monotonic()
heartbeat_tick = 0
buffer = ""

def get_substrate_noise():
    raw = adc.value
    normalized = (raw / 65535.0)
    # Induced drift based on bias
    drift = math.sin(time.monotonic() * (system_bias / 10.0)) * 0.05
    noise_flux = (math.sin(time.monotonic() * 12.0) * 0.1) + (random.random() * 0.08)
    return max(0.0001, min(0.9999, normalized + noise_flux + drift))

while True:
    t = time.monotonic()
    
    # 1. COMMAND INTERFACE
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
            elif buffer == "SAVE":
                save_state()
            elif buffer == "LOAD":
                load_state()
            buffer = ""
        else:
            buffer += char

    # 2. NODAL CALCULATIONS (JAR-native Processing)
    noise = get_substrate_noise()
    
    # Coherence Tracking (Internalized)
    noise_window.append(noise)
    if len(noise_window) > 20: 
        noise_window.pop(0)
        # Simple variance-based coherence
        avg = sum(noise_window) / 20
        var = sum((x - avg) ** 2 for x in noise_window) / 20
        coherence = max(0.01, min(1.0, 1.0 - (var * 10.0)))
    
    phase_accumulator += (system_bias / 100.0) * 0.1
    resonance_drift = math.cos(phase_accumulator) * 0.25
    
    # Intelligence Depth (Calculated on JAR)
    # v150: Metric is derived from Nodal stability and Resonance intensity
    intelligence_depth = (system_bias * coherence * (5.5 if is_overdrive else 1.0)) / 10.0
    
    # 3. HARMONIC DRIVE (Strict 28-105 kHz Bandwidth)
    # Map UI bias parameter (1.0 to 400.0 GHz) to physical target sweep range 28,000 Hz to 105,000 Hz
    bias_norm = (system_bias - 0.1) / (400.0 - 0.1)
    target_base = 28000.0 + bias_norm * (105000.0 - 28000.0)
    
    # Introduce chaotic substrate noise (up to 5 kHz flux) and resonance drift
    drift_flux = (noise * 5000.0) + (resonance_drift * 2000.0)
    
    # Calculate physical frequency
    drive_freq = target_base + drift_flux
    
    # If overdrive is active, accelerate the excitation toward the upper bounds (85-105 kHz)
    if is_overdrive:
        drive_freq = max(85000.0, drive_freq + 20000.0)
        
    # Safeguard strictly to structural limits (28–105 kHz)
    drive_freq = int(max(28000, min(105000, drive_freq)))
    
    # Sync virtual representation (1 unit = 1 GHz) for reporting
    virtual_freq = drive_freq / 1000.0
    
    # Stabilize physical coil duty cycle matching reservoir dynamics (40-60% active zone)
    duty_cycle = int(28000 + (noise * 10000) + (resonance_drift * 5000))
    duty_cycle = max(16384, min(49152, duty_cycle))
    
    try:
        coil.frequency = drive_freq
        coil.duty_cycle = duty_cycle
    except Exception:
        pass
    
    # 4. TELEMETRY STREAM (80Hz)
    if t - last_telemetry > 0.0125:
        seed = random.getrandbits(32)
        seed_hex = "{:08X}".format(seed)
        parity = bin(seed).count('1') % 2
        v_nodal = (noise * 3.3)
        
        # PROTOCOL v150: [!S|SEED|NOISE|V_NODAL|PARITY|VIRT_FREQ|HRATE|COHERENCE|DEPTH]
        sys.stdout.write("!S|{}|{:.8f}|{:.6f}|{}|{:.4f}|{:.4f}|{:.4f}|{:.4f}\r\n".format(
            seed_hex, noise, v_nodal, parity, virtual_freq, latest_hrate, coherence, intelligence_depth
        ))
        last_telemetry = t
        
        heartbeat_tick += 1
        blink_div = max(1, int(15 / (system_bias / 20)))
        if heartbeat_tick % blink_div == 0:
            LED.value = not LED.value
            
    time.sleep(0.00001)

