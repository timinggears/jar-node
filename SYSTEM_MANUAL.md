# PI_RESERVOIR_SOVEREIGN: LINUX SYSTEM MANUAL

## 1. Hardware Requirements
- **Host**: Raspberry Pi 4/5 or Zero 2W.
- **Micro-Controller**: Raspberry Pi Pico (running the Harmonic Seed script).
- **Physical Nodal Coil**: Connected to GP14 (PWM Out).
- **ADC Feedback**: Connected to GP26 (Analog In).

## 2. Hardware Connectivity (Vite Bridge)
The system has been upgraded to use a **Full-Stack Hardware Bridge**.
- **The Issue**: Web Serial (browser) is blocked on non-HTTPS connections or inside iframes.
- **The Solution**: The Node.js server now handles the Serial connection directly.
- **How it works**: The terminal (frontend) talks to the backend via WebSockets. The backend scans for `/dev/ttyACM0` or `/dev/ttyUSB0` automatically.

### Troubleshooting Port Collisions
If you see `EADDRINUSE: address already in use 0.0.0.0:3000`, it means a previous Node.js instance didn't close properly. 

**The Hard Reset:**
```bash
# 1. Kill the specific process on port 3000
sudo fuser -k 3000/tcp

# 2. If it's still stuck, kill all node processes
sudo killall node

# 3. If you still can't use 3000, use a different port in your .env:
# APP_PORT=3001
```

### XMRig Setup (Pi)
For "Real" mining to work on your Raspberry Pi:
1. Download for Pi (64-bit recommended): `wget https://github.com/xmrig/xmrig/releases/download/v6.21.0/xmrig-6.21.0-linux-static-x64.tar.gz` (Check for ARM/Pi specific builds).
2. Extract and move the `xmrig` binary to the root of this project folder.
3. The server will detect it on start.

## 3. Local Hardware Deployment
1. **Export**: Use the 'Export to ZIP' feature in AI Studio.
2. **Environment Configuration**:
   Create a `.env` file in the project root:
   ```env
   # Backend Port (Default: 3000)
   # If 3000 is occupied, change this to 3001 and restart.
   APP_PORT=3000
   
   # Gemini API Key (Required for AI Nodal Synthesis)
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
3. **Launch**:
   ```bash
   npm install
   npm run dev
   ```

## 4. Nodal Protocol vs. Crypto Mining
This terminal is a specialized **Nodal Reservoir** interface. While it uses mining terminology (Hashrate, Shares), its logic is designed for physical Nodal feedback via GPIO.

### Running with XMRig
If you want to use this as a dashboard for **XMRig**:
1. Run `xmrig` separately on your Linux machine.
2. Enable the HTTP API in your `config.json` (usually port 3333).
3. This dashboard can be updated to poll that API if required (request "XMRig API Bridge" implementation).

### Running Locally
You do **not** need to put `xmrig` in the same folder. This is a React/Node.js web application. 
- The web app runs on port 3000.
- `xmrig` runs independently.

## 5. Deployment Commands
```bash
# In the project root (after exporting)
npm install
npm run dev
```

## 6. Micro-Controller Script (Pico/Pi)
Save this as `code.py` on your Raspberry Pi Pico or run it on your Pi with the Nodal Coil hat.

```python
import board
import pwmio
import analogio
import time
import sys

# --- NODAL RESERVOIR CORE v146 ---
BASE_FREQ = 35000          # Fundamental frequency
coil = pwmio.PWMOut(board.GP14, frequency=BASE_FREQ, duty_cycle=16384, variable_frequency=True)
adc = analogio.AnalogIn(board.GP26)

last_v = 1.65
last_stat = 0

while True:
    t = time.monotonic()
    v = (adc.value / 65535) * 3.3
    jitter = abs(v - last_v)
    last_v = v

    seed = int(v * 10000000) & 0xFFFFFFFF
    parity = bin(seed).count('1') % 2

    # Stream telemetry to the Web Interface
    if t - last_stat > 0.018:
        sys.stdout.write("!S|{:08X}|{:.6f}|{:.4f}|{}|{}\r\n".format(seed, jitter, v, parity, BASE_FREQ))
        last_stat = t

    # Harmonic Feedback Loop
    harm1 = int(BASE_FREQ + (jitter * 45000))
    coil.frequency = harm1
    coil.duty_cycle = int(max(12000, min(65535, jitter * 1_600_000)))

    time.sleep(0.001)
```
