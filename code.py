# Raspberry Pi Pico / CircuitPython - Sovereign J.A.R.S. Core v147
# Official Unified Logic for physical nodal resonance synchronization.

import time
import board
import pwmio
import analogio
import sys
import random
import digitalio
import supervisor

# --- J.A.R.S. CONFIG ---
# Physical substrate interface pins
PIN_PWM = board.GP14
PIN_ADC = board.GP26

LED = digitalio.DigitalInOut(board.LED)
LED.direction = digitalio.Direction.OUTPUT

# --- SYSTEM STATE ---
# Modulated by the Web Interface via the JARS Serial Bridge
system_bias = 50.0      # Fundamental resonance (50.0 = 50GHz Virtual)
is_overdrive = False
latest_hrate = 0.0
base_hw_freq = 35000   # Hardware carrier freq

# --- HARDWARE INIT ---
adc = analogio.AnalogIn(PIN_ADC)
coil = pwmio.PWMOut(PIN_PWM, frequency=base_hw_freq, duty_cycle=0, variable_frequency=True)

print("PI_RESERVOIR_BRIDGE: v147_JARS_LINK_ESTABLISHED")
print("SUBSTRATE: GP14(PWM), GP26(ADC) ACTIVE")

last_telemetry = time.monotonic()
heartbeat_tick = 0
buffer = ""

def get_substrate_jitter():
    # Capture interference from the liquid/nodal state
    v = (adc.value / 65535) * 3.3
    return v / 3.3 # Normalized 0.0 - 1.0

while True:
    t = time.monotonic()
    
    # 1. JARS COMMAND PARSING
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

    # 2. SAMPLE SUBSTRATE
    jitter = get_substrate_jitter()
    
    # 3. CALCULATE UNIFIED RESONANCE (JARS v147)
    # Virtual frequency must match JARS Simulator: 1 Bias = 1 GHz
    overdrive_multi = 3.5 if is_overdrive else 1.0
    
    # JARS v147: Hashrate Modulation
    hashrate_mod = (latest_hrate / 10000.0) * 5000.0 # Up to 5GHz shift
    
    # We include a jitter component for "Live" feedback on the dashboard
    virtual_freq = ((system_bias * 1000) + (jitter * 5000) + hashrate_mod) * overdrive_multi
    
    # Real hardware excitation (PWM drive)
    # Hardware frequency depends on bias + jitter + hrate
    hr_hw_mod = int((latest_hrate / 10000.0) * 10000)
    real_freq = int(base_hw_freq + (jitter * 45000) + hr_hw_mod)
    base_duty = int(jitter * 65535 * 0.9)
    safe_duty = max(5000, min(58000, base_duty))
    
    # 4. DRIVE COIL
    try:
        coil.frequency = min(1000000, real_freq)
        if t % 0.1 > 0.05: # Slight oscillation for liquid state stability
             coil.duty_cycle = safe_duty
    except Exception:
        coil.frequency = base_hw_freq
        coil.duty_cycle = 32768
    
    # 5. STREAM JARS TELEMETRY (50Hz)
    if t - last_telemetry > 0.02:
        seed_val = random.getrandbits(32)
        seed_hex = "{:08X}".format(seed_val)
        parity = bin(seed_val).count('1') % 2
        v_nodal = (jitter * 3.3)
        
        # JARS Unified Protocol: [!S|SEED|JITTER|V_NODAL|PARITY|VIRT_FREQ|HASHRATE]
        sys.stdout.write("!S|{}|{:.6f}|{:.4f}|{}|{:.1f}|{:.2f}\r\n".format(seed_hex, jitter, v_nodal, parity, virtual_freq, latest_hrate))
        last_telemetry = t
        
        # Heartbeat (Rate scales with bias)
        heartbeat_tick += 1
        blink_rate = 25 if system_bias < 50 else (10 if system_bias < 80 else 3)
        if heartbeat_tick % blink_rate == 0:
            LED.value = not LED.value
    
    time.sleep(0.001)
