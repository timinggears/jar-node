# PI_RESERVOIR_SOVEREIGN: LINUX SYSTEM MANUAL

## 1. Hardware Requirements
- **Host**: Raspberry Pi 4/5 or Zero 2W.
- **Micro-Controller**: Raspberry Pi Pico (running the Harmonic Seed script).
- **Physical Nodal Coil**: Connected to GP14 (PWM Out).
- **ADC Feedback**: Connected to GP26 (Analog In).

## 2. Linux Environment Setup
To allow the web terminal to talk to your hardware via USB, you must grant permissions to the serial ports.

### Permission Fix (One-time)
Run this command in your Linux terminal to add your user to the dialout group:
```bash
sudo usermod -a -G dialout $USER
```
*Note: You will need to log out and back in for this to take effect.*

### Browser Configuration
1. Open Chrome/Edge.
2. Navigate to `chrome://flags/#enable-experimental-web-platform-features`.
3. Enable the flag and restart.

## 3. Deployment (Local Node)
If you want to run this dashboard entirely offline on your Linux machine:
1. **Export**: Use the 'Export to ZIP' feature in AI Studio.
2. **Install Node.js**:
   ```bash
   sudo apt update
   sudo apt install nodejs npm
   ```
3. **Launch**:
   ```bash
   npm install
   npm run dev
   ```

## 4. Nodal Protocol
The system communicates using the `!S|SEED|JITTER|VOLTAGE|PARITY|FREQ` packet format at 115200 baud.
