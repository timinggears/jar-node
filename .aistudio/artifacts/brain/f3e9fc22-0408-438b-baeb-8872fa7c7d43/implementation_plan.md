# Revised Implementation Plan: Minimal STICK + RELEASE Patch & App Re-render Fix

Apply the exact minimal patch for STICK and RELEASE state freezing in `code.py` (and docs), provide web console controls via `server.ts`, and fix the React `Maximum update depth exceeded` re-render loop.

---

### User Review Required
> [!NOTE]
> This plan adopts your exact 3-step minimal patch for `code.py`:
> 1. Add `is_stuck`, `stuck_freq`, `stuck_duty` variables.
> 2. Add `STICK` and `RELEASE` serial command handlers.
> 3. Add `if is_stuck: coil.frequency = stuck_freq; coil.duty_cycle = stuck_duty` in the coil drive section.
>
> We also include the essential fix for the React `Maximum update depth exceeded` bug so your console doesn't freeze or crash in the browser.

---

### Proposed Changes

#### 1. Microcontroller Firmware (`code.py` & `PYTHON_CODE.md`)
Apply the exact 3-part patch to `code.py`:
- **Part 1 - Top state variables**:
  ```python
  # Stick state
  is_stuck = False
  stuck_freq = 35000
  stuck_duty = 32768
  ```
- **Part 2 - Serial command block**:
  ```python
  elif buffer == "STICK":
      is_stuck = True
      stuck_freq = coil.frequency
      stuck_duty = coil.duty_cycle
      print("OK:STICK_ACTIVE")
  elif buffer == "RELEASE":
      is_stuck = False
      print("OK:RELEASED")
  ```
- **Part 3 - Coil drive block**:
  ```python
  try:
      if is_stuck:
          # Freeze current state
          coil.frequency = stuck_freq
          coil.duty_cycle = stuck_duty
      else:
          if use_dual:
              # Existing dual-tone alternation (unchanged)
              if int(time.monotonic() / dual_switch_time) % 2 == 0:
                  coil.frequency = min(1000000, max(1000, freq_a))
              else:
                  coil.frequency = min(1000000, max(1000, freq_b))
          else:
              coil.frequency = drive_freq
          coil.duty_cycle = duty_cycle
  except Exception:
      pass
  ```
- Update `PYTHON_CODE.md` to keep documentation 100% in sync with `code.py`.

#### 2. Backend Serial Bridge (`server.ts`)
- In the serial command bridge, ensure `STICK` and `RELEASE` commands are properly routed:
  - Add socket event listeners:
    - `socket.on('hardware:stick', ...)` -> sends `"STICK\n"` to serial port
    - `socket.on('hardware:release', ...)` -> sends `"RELEASE\n"` to serial port
  - Handle `"OK:STICK_ACTIVE"` and `"OK:RELEASED"` in serial parser and broadcast `hardware:stick_status` to all connected clients.

#### 3. Frontend Re-render Fix (`src/components/PhysicalJarViewer.tsx` & `src/App.tsx`)
- Resolve the `Maximum update depth exceeded` re-render error:
  - Guard `setJarHeading` and `setDataSolverMetrics` against micro-re-renders by using strict threshold diffing and memoized refs.
  - Break the circular feedback loop between `PhysicalJarViewer` orientation emits and `App.tsx` state re-broadcasts.

#### 4. Frontend UI Controls (`src/components/PhysicalJarViewer.tsx` or `Taskbar.tsx`)
- Add convenient **STICK** and **RELEASE** controls:
  - Visual status pill/badge indicating whether the coil is `DYNAMIC` or `STICK ACTIVE` (Frozen).
  - Quick action buttons to send `STICK` and `RELEASE` commands with 1 click.

---

### Verification Plan

#### Automated Verification
1. `compile_applet`: Ensure clean build with zero TypeScript / bundler errors.

#### Runtime Verification
1. Send `STICK` via UI or terminal:
   - Microcontroller responds with `OK:STICK_ACTIVE`.
   - Coil frequency and duty cycle freeze in place.
2. Send `RELEASE`:
   - Microcontroller responds with `OK:RELEASED`.
   - Normal frequency modulation resumes.
3. Verify browser console is free of `Maximum update depth exceeded` error.
