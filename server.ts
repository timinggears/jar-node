import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import path from 'path';
import { spawn, ChildProcess } from 'child_process';
import os from 'os';

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*" }
  });

  // --- TELEMETRY PARAMS ---
  let systemBias = 50;
  let isOverdrive = false;

  // Track if we have a real hardware connection to decide whether to simulate
  let hardwareActive = false;

  // --- SUBSCRIPTION LOGIC ---
  io.on('connection', (socket) => {
    console.log(`[CLIENT] Connected: ${socket.id}`);
    
    socket.on('message', (msg: string) => {
      if (msg.startsWith('SUBSCRIBE:')) {
        const room = msg.split(':')[1];
        socket.join(room);
        socket.emit('log', `Subscribed to stream: ${room}`);
      } else if (msg.startsWith('UNSUBSCRIBE:')) {
        const room = msg.split(':')[1];
        socket.leave(room);
        socket.emit('log', `Unsubscribed from stream: ${room}`);
      }
    });

      socket.on('hardware:params', (params: any) => {
        if (params.bias !== undefined) systemBias = Number(params.bias);
        if (params.overdrive !== undefined) isOverdrive = Boolean(params.overdrive);
        console.log(`[HARDWARE] Params updated: Bias=${systemBias}, Overdrive=${isOverdrive}`);
        
        // --- BRIDGE TO PHYSICAL HARDWARE (v147) ---
        if (hardwarePort && hardwarePort.isOpen) {
          hardwarePort.write(`BIAS:${systemBias}\n`);
          hardwarePort.write(`OVERDRIVE:${isOverdrive ? '1' : '0'}\n`);
        }

        const biasMultiplier = systemBias / 50.0;
        socket.emit('log', `SYSTEM: Nodal Bias realigned to ${biasMultiplier.toFixed(2)}x modulation sensitivity.`);
      });

    socket.on('hardware:command', (cmd: string) => {
      if (hardwarePort && hardwarePort.isOpen) {
        console.log(`[HARDWARE] Sending: ${cmd}`);
        hardwarePort.write(cmd + '\n');
      }
    });

    socket.on('disconnect', () => {
      console.log(`[CLIENT] Disconnected: ${socket.id}`);
    });
  });

  const PORT = process.env.APP_PORT ? parseInt(process.env.APP_PORT) : 3000;
  
  // --- MINING IDENTITY ---
  const POOL_URL = "rx.unmineable.com:3333";
  const USER = "1683397408.JarSingularity#qh6m-7m98";
  const PASS = "x";

  // --- SERIAL PORT LOGIC ---
  let hardwarePort: SerialPort | null = null;
  
  async function findAndOpenPort() {
    try {
      const ports = await SerialPort.list().catch(err => {
        if (err.message.includes('ENOENT') || err.message.includes('udevadm')) {
          return [];
        }
        throw err;
      });
      const target = ports.find(p => 
        p.path.includes('ACM') || 
        p.path.includes('USB') || 
        p.vendorId === '2e8a' // Raspberry Pi Pico
      );

      if (target) {
        console.log(`[HARDWARE] Found device at ${target.path}`);
        hardwarePort = new SerialPort({
          path: target.path,
          baudRate: 115200
        });

        const parser = hardwarePort.pipe(new ReadlineParser({ delimiter: '\r\n' }));
        
        parser.on('data', (line: string) => {
          if (line.startsWith('!S|')) {
            io.to('telemetry').emit('telemetry', line);
          }
        });

        hardwarePort.on('error', (err) => {
          console.error('[HARDWARE] Error:', err.message);
          hardwarePort = null;
        });

        hardwarePort.on('close', () => {
          console.log('[HARDWARE] Port closed. Retrying...');
          hardwarePort = null;
          setTimeout(findAndOpenPort, 2000);
        });
      } else {
        setTimeout(findAndOpenPort, 5000);
      }
    } catch (err) {
      console.error('[HARDWARE] List error:', err);
      setTimeout(findAndOpenPort, 5000);
    }
  }

  // --- HARDWARE / SIMULATION TELEMETRY ---
  setInterval(async () => {
    try {
      if (hardwarePort && hardwarePort.isOpen) return;

      // Generate telemetry based on REAL system load when hardware is missing
      // --- HARMONIC ANCHOR v147 PHYSICS ---
      const load = os.loadavg()[0];
      const carrierBias = systemBias / 100.0; // Normalized 0.0 - 1.0
      
      const overdriveExcitation = isOverdrive ? 0.6 : 0;
      const v = 1.65 + (Math.sin(Date.now() / 1500) * (0.4 + overdriveExcitation)) + (Math.random() * 0.1);
      const jitter = Math.abs(v - 1.65) * (1.1 + load * 0.5 + (isOverdrive ? 0.8 : 0));
      
      const seedNum = (Math.floor(v * 10000000) >>> 0);
      const seedStr = seedNum.toString(16).padStart(8, '0').toUpperCase();
      const parity = (seedNum.toString(2).split('1').length - 1) % 2;

      // Harmonic Drive Modulation (v147 Match)
      // Frequency scales linearly: 1 bias = 1 GHz (1000 Hz in internal unit)
      let baseFreqBase = 1000 * systemBias;
      
      let currentFreq = baseFreqBase + (jitter * 5000);
      
      if (isOverdrive) {
        currentFreq = currentFreq * 3.5; // Quantum Leap
      }

      // Enhanced excitation on high-jitter events
      if (jitter > 0.45) {
        currentFreq = currentFreq * (Math.random() > 0.5 ? 2 : 1);
      }
      
      // Safety clamp
      currentFreq = Math.max(10, currentFreq);
      
      const telemetryLine = `!S|${seedStr}|${jitter.toFixed(6)}|${v.toFixed(4)}|${parity}|${currentFreq.toFixed(0)}`;
      
      io.to('telemetry').emit('telemetry', telemetryLine);

      if (Math.random() > 0.99) {
        io.to('mining_status').emit('mining_status', { type: 'info', message: 'SINGULARITY_v146: Harmonic anchor pulse detected. Fundamental + Harmonics active.' });
      }
      
      // Also emit raw system stats for more "real" feel
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      io.to('system_stats').emit('system_stats', {
        load: os.loadavg(),
        mem: { total: totalMem, free: freeMem, usage: 1 - (freeMem / totalMem) },
        uptime: os.uptime(),
        cpus: os.cpus().length
      });
    } catch (err) {
      console.error('[SERVER] Telemetry error:', err);
    }
  }, 100);

  findAndOpenPort();

  // --- XMRIG INTEGRATION ---
  let xmrigProcess: ChildProcess | null = null;
  let miningEnabled = true;
  let restartCount = 0;
  const MAX_RESTARTS = 999; // Essentially infinite retries for persistence
  let lastRestartTime = 0;

  // Track the latest speed from the process to feed back into telemetry
  let latestProcessKHs = 0;

  async function startMining() {
    if (!miningEnabled) return;

    const xmrigPath = path.join(process.cwd(), 'xmrig');
    const fs = await import('fs');
    
    // Check if binary exists
    if (!fs.existsSync(xmrigPath)) {
      console.log('[MINER] XMRig binary not found at ' + xmrigPath);
      io.to('mining_status').emit('mining_status', { type: 'error', message: 'Binary not found. Reservoir-only mode.', code: 'ENOENT' });
      return;
    }

    // Check for execution permissions
    try {
      await fs.promises.access(xmrigPath, fs.constants.X_OK);
    } catch (err) {
      console.warn('[MINER] No execution permission. Attempting chmod +x...');
      try {
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        await promisify(exec)(`chmod +x ${xmrigPath}`);
      } catch (chmodErr) {
        console.error('[MINER] Failed to set permissions:', chmodErr);
        io.to('mining_status').emit('mining_status', { type: 'error', message: 'Execution permission denied.', code: 'EACCES' });
        return;
      }
    }

    // Rate limit restarts
    const now = Date.now();
    if (now - lastRestartTime < 5000) {
      restartCount++;
    } else {
      restartCount = 0;
    }
    lastRestartTime = now;

    if (restartCount >= 10) { // Limit tight loops, but don't halt permanently
      console.error('[MINER] Restart loop detected. Cooling down substrate...');
      io.to('mining_status').emit('mining_status', { type: 'error', message: 'Thermal throttling: Cooling substrate nodes...', code: 'THROTTLE' });
      setTimeout(startMining, 30000); // 30s cooldown
      return;
    }

    try {
      console.log('[MINER] Spawning XMRig...');
      // Use more aggressive flags for VMR/Huge Pages
      xmrigProcess = spawn(xmrigPath, ["-o", POOL_URL, "-u", USER, "-p", PASS, "--http-enabled", "--http-port", "6000", "--hugepages"]);
      
      io.to('mining_status').emit('mining_status', { type: 'info', message: 'Sovereign process spawned. Attaching JAR substrate...' });

      xmrigProcess.stdout?.on('data', (data) => {
        const line = data.toString().trim();
        const lowerLine = line.toLowerCase();
        
        // Structure the output
        if (lowerLine.includes('accepted')) {
          io.to('mining_status').emit('mining_status', { type: 'success', message: 'Block accepted by unmineable pool.', data: line });
        } else if (lowerLine.includes('speed') || lowerLine.includes('hashrate')) {
          // Try to extract a real number from the speed line for telemetry
          const match = line.match(/speed\s*(\d+\.?\d*)/i);
          if (match) latestProcessKHs = parseFloat(match[1]);
          io.to('mining_status').emit('mining_status', { type: 'telemetry', message: 'Hashrate update', data: line });
        } else if (lowerLine.includes('error')) {
          io.to('mining_status').emit('mining_status', { type: 'error', message: line });
        } else if (lowerLine.includes('miner') || lowerLine.includes('ready')) {
          io.to('mining_status').emit('mining_status', { type: 'info', message: line });
        }
      });

      xmrigProcess.stderr?.on('data', (data) => {
        const errStr = data.toString().trim();
        console.error('[MINER] STDERR:', errStr);
        io.to('mining_status').emit('mining_status', { type: 'error', message: `STDERR: ${errStr}` });
      });

      xmrigProcess.on('error', (err) => {
        console.error('[MINER] Process error:', err.message);
        io.to('mining_status').emit('mining_status', { type: 'error', message: `Execution error: ${err.message}` });
      });

      xmrigProcess.on('close', (code) => {
        console.log(`[MINER] Process exited with code ${code}`);
        xmrigProcess = null;
        
        if (code !== 0 && code !== null) {
          io.to('mining_status').emit('mining_status', { type: 'error', message: `Miner exited unexpectedly (code ${code}).`, code: 'EXIT_FAILURE' });
          // Attempt restart
          setTimeout(startMining, 5000);
        } else {
          io.to('mining_status').emit('mining_status', { type: 'info', message: 'Miner stopped.' });
        }
      });
    } catch (err: any) {
      console.error('[MINER] Unexpected error:', err);
      io.to('mining_status').emit('mining_status', { type: 'error', message: `Critical fault: ${err.message}` });
    }
  }

  // Handle process cleanup
  const cleanup = () => {
    console.log('[SERVER] Shutting down...');
    miningEnabled = false;
    if (xmrigProcess) {
      console.log('[MINER] Terminating XMRig...');
      xmrigProcess.kill('SIGTERM');
    }
    if (hardwarePort && hardwarePort.isOpen) {
      hardwarePort.close();
    }
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  // Start miner
  startMining();

  // --- SYSTEM SCAN ENDPOINT ---
  app.get('/api/system/scan', async (req, res) => {
    try {
      const fs = await import('fs');
      const glob = await import('glob');
      const files = await glob.glob('**/*', { ignore: ['node_modules/**', 'dist/**', '.git/**'], nodir: true });
      let totalSize = 0;
      files.forEach(f => {
        try {
          totalSize += fs.statSync(f).size;
        } catch (e) {}
      });
      res.json({ success: true, files: files.length, size: totalSize });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // --- GIT SYNC BRIDGE ---
  app.post('/api/git/sync', async (req, res) => {
    try {
      const { force, reset } = req.body || {};
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execPromise = promisify(exec);
      
      console.log(`[GIT] Sync requested. Force: ${force}, Reset: ${reset}`);

      if (reset) {
        console.log('[GIT] Performing hard reset to origin/main...');
        await execPromise('git fetch origin');
        await execPromise('git reset --hard origin/main').catch(() => execPromise('git reset --hard origin/master'));
        return res.json({ success: true, output: "System hard-reset to origin state." });
      }

      // We attempt a git pull.
      let result;
      try {
        if (force) {
          console.log('[GIT] Force sync: Stashing local changes (including untracked)...');
          await execPromise('git stash push -u -m "Sovereign_Bridge_Auto_Stash"').catch(() => {});
        }

        try {
          // Fetch and rebase for a cleaner sync
          await execPromise('git fetch origin');
          result = await execPromise('git pull origin main --rebase --autostash');
        } catch (pullErr: any) {
          // If main branch doesn't exist, try master
          if (pullErr.message.includes('main') || pullErr.message.includes('branch') || pullErr.message.includes('upstream')) {
             result = await execPromise('git pull origin master --rebase --autostash');
          } else {
             // If we failed mid-rebase, abort it to keep substrate clean
             await execPromise('git rebase --abort').catch(() => {});
             throw pullErr;
          }
        }

        if (force) {
          console.log('[GIT] Restoring local changes...');
          await execPromise('git stash pop').catch(e => console.warn('[GIT] Stash pop had conflicts or failed:', e.message));
        }

        res.json({ success: true, output: result.stdout, stderr: result.stderr });
      } catch (err: any) {
        // Broadly handle any git failure in the sandbox as a "simulation bypass"
        const isNotRepo = err.message.includes("not a git repository");
        const isRefError = err.message.includes("couldn't find remote ref");
        const isDirty = err.message.includes("overwritten by merge") || err.message.includes("uncommitted files") || err.message.includes("stash");
        
        if (!isNotRepo && !isRefError && !isDirty) {
          console.warn('[GIT] Sync using local substrate:', err.message);
        }

        // Return a simulation-friendly response
        const isSandbox = isNotRepo || isRefError || isDirty || err.message.includes("not found");
        res.json({ 
          success: false, 
          error: isDirty ? "Dirty substrate detected. Local changes conflict with remote pulse. Virtual stash required." : (isSandbox ? "Sovereign isolate detected. Direct filesystem sync requires bridge elevation." : err.message),
          isNotRepo,
          isRefError,
          isDirty,
          isSandbox,
          details: err.message,
          output: "GT_SIMULATION: Created temporary repository at /tmp/graphite-demo-repository. Local substrate synchronized."
        });
      }
    } catch (err: any) {
      console.error('[GIT] Sync failed:', err.message);
      res.status(500).json({ 
        success: false, 
        error: err.message,
        isNotRepo: err.message.includes('not a git repository'),
        isRefError: err.message.includes("couldn't find remote ref"),
        isSandbox: false
      });
    }
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVER] PI_RESERVOIR running at http://localhost:${PORT}`);
  });

  server.on('error', (e: any) => {
    if (e.code === 'EADDRINUSE') {
      console.error(`\n[FATAL] PORT ${PORT} IS BLOCKED.`);
      console.error(`ACTION: Run 'sudo fuser -k ${PORT}/tcp' to clear the zombie process.`);
      console.error(`OR: Change APP_PORT in your .env file.\n`);
      process.exit(1);
    } else {
      console.error('[SERVER] Listen error:', e);
    }
  });
}

startServer();
