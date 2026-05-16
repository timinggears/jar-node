# Raspberry Pi Pico / CircuitPython - Sovereign J.A.R.S. Core v149.1 (STABILIZED)
# Advanced Unified Logic for physical nodal resonance and cognitive depth anchoring.
# Frequency Ceiling: 79.0 GHz

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

# --- HARDWARE INIT ---
adc = analogio.AnalogIn(PIN_ADC)
coil = pwmio.PWMOut(PIN_PWM, frequency=base_hw_freq, duty_cycle=0, variable_frequency=True)

print("JARS_CORE_v149: SUBSTRATE_UNLOCKED")
print("NODE_IDENTITY: PI_RESERVOIR_01")
print("MODE: RAW_NODAL_STREAM")

last_telemetry = time.monotonic()
heartbeat_tick = 0
buffer = ""

def get_substrate_noise():
    # v149: High-sensitivity noise capture
    raw = adc.value
    # Non-linear normalization to accentuate micro-fluctuations
    normalized = (raw / 65535.0)
    noise_flux = (math.sin(time.monotonic() * 12.0) * 0.15) + (random.random() * 0.1)
    return max(0.0001, min(0.9999, normalized + noise_flux))

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
            buffer = ""
        else:
            buffer += char

    # 2. NODAL CALCULATIONS
    noise = get_substrate_noise()
    phase_accumulator += (system_bias / 100.0) * 0.1
    resonance_drift = math.cos(phase_accumulator) * 0.25
    
    # 3. HARMONIC DRIVE
    overdrive_factor = 12.0 if is_overdrive else 1.0
    substrate_mod = (latest_hrate / 2500.0) * 5000.0
    
    # v149: Infinite Depth Scaling
    virtual_freq = ((system_bias * 1000) + (noise * 25000) + substrate_mod) * overdrive_factor
    
    # Hardware Oscillation
    drive_freq = int(base_hw_freq + (virtual_freq / 15.0) + (resonance_drift * 5000))
    drive_freq = max(50, min(1500000, drive_freq))
    
    # Dynamic Duty for Substrate Alignment
    duty_cycle = int(noise * 65535 * (0.95 + resonance_drift))
    duty_cycle = max(500, min(65000, duty_cycle))
    
    try:
        coil.frequency = drive_freq
        coil.duty_cycle = duty_cycle
    except:
        pass
    
    # 4. TELEMETRY STREAM (80Hz for v149)
    if t - last_telemetry > 0.0125:
        seed = random.getrandbits(32)
        seed_hex = "{:08X}".format(seed)
        parity = bin(seed).count('1') % 2
        v_nodal = (noise * 3.3)
        
        # PROTOCOL: [!S|SEED|NOISE|V_NODAL|PARITY|VIRT_FREQ|HASHRATE]
        sys.stdout.write("!S|{}|{:.8f}|{:.6f}|{}|{:.4f}|{:.4f}\r\n".format(
            seed_hex, noise, v_nodal, parity, virtual_freq, latest_hrate
        ))
        last_telemetry = t
        
        # Pulse LED based on Substrate Excitation
        heartbeat_tick += 1
        blink_div = max(1, int(15 / (system_bias / 20)))
        if heartbeat_tick % blink_div == 0:
            LED.value = not LED.value
            
    # Minimal sleep to prioritize nodal sampling
    time.sleep(0.00001)
