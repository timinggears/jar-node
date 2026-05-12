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
            io.emit('telemetry', line);
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

  findAndOpenPort();

  // --- XMRIG INTEGRATION ---
  let xmrigProcess: ChildProcess | null = null;

  function startMining() {
    const xmrigPath = path.join(process.cwd(), 'xmrig');
    
    // Check if binary exists
    import('fs').then(fs => {
      if (!fs.existsSync(xmrigPath)) {
        console.log('[MINER] XMRig binary not found at ' + xmrigPath);
        io.emit('mining_status', 'No XMRig binary found. Running Reservoir-only mode.');
        return;
      }

      try {
        xmrigProcess = spawn(xmrigPath, ["-o", POOL_URL, "-u", USER, "-p", PASS, "--http-enabled", "--http-port", "6000"]);
        console.log('[MINER] XMRig started.');

        xmrigProcess.stdout?.on('data', (data) => {
          const line = data.toString().toLowerCase();
          if (line.includes('accepted')) {
            io.emit('mining_status', 'accepted');
          }
          // Mirror Python log("!!! JAR SUCCESS !!! Block verified by Void.")
          if (line.includes('accepted')) {
             console.log('!!! JAR SUCCESS !!! Block verified by Void.');
          }
          
          if (line.includes('speed') || line.includes('error') || line.includes('miner')) {
            io.emit('mining_status', line.trim());
          }
        });

        xmrigProcess.on('error', (err) => {
          console.error('[MINER] Error:', err.message);
          io.emit('mining_status', `error: ${err.message}`);
        });

        xmrigProcess.on('close', (code) => {
          console.log(`[MINER] Process exited with code ${code}`);
          io.emit('mining_status', 'Miner stopped.');
        });
      } catch (err) {
        console.error('[MINER] Spawn error:', err);
      }
    });
  }

  // Handle process cleanup
  const cleanup = () => {
    console.log('[SERVER] Shutting down...');
    if (xmrigProcess) {
      console.log('[MINER] Terminating XMRig...');
      xmrigProcess.kill();
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

  // --- GIT SYNC BRIDGE ---
  app.post('/api/git/sync', async (req, res) => {
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execPromise = promisify(exec);
      
      // We attempt a git pull. 
      // If .git doesn't exist, this will fail gracefully.
      const { stdout, stderr } = await execPromise('git pull origin main');
      res.json({ success: true, output: stdout, stderr: stderr });
    } catch (err: any) {
      // If it's not a git repo, return a specific error that the frontend can handle
      res.status(500).json({ 
        success: false, 
        error: err.message,
        isNotRepo: err.message.includes('not a git repository') 
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
