const detect = require('detect-port');
const { exec } = require('child_process');

const DEFAULT_PORT = process.env.PORT || 3000;

detect(DEFAULT_PORT).then((port) => {
  if (port === DEFAULT_PORT) {
    startReactApp(port);
  } else {
    console.log(`Port ${DEFAULT_PORT} is occupied, trying with port ${port}`);
    startReactApp(port+1);
  }
});

function startReactApp(port) {
  const command = `cross-env PORT=${port} react-scripts start`;
  const child = exec(command);

  child.stdout.pipe(process.stdout);
  child.stderr.pipe(process.stderr);
}
