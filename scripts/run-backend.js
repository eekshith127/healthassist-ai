import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const backendDir = path.join(rootDir, 'backend')

// Detect python executable in .venv (Windows vs Unix)
const winVenvPython = path.join(backendDir, '.venv', 'Scripts', 'python.exe')
const unixVenvPython = path.join(backendDir, '.venv', 'bin', 'python')

let pythonPath = 'python'
if (fs.existsSync(winVenvPython)) {
  pythonPath = winVenvPython
} else if (fs.existsSync(unixVenvPython)) {
  pythonPath = unixVenvPython
}

const runScript = path.join(backendDir, 'run.py')

const proc = spawn(pythonPath, [runScript], {
  cwd: rootDir,
  stdio: 'inherit',
  env: {
    ...process.env,
    PYTHONPATH: rootDir,
  },
})

proc.on('close', (code) => {
  process.exit(code ?? 0)
})
