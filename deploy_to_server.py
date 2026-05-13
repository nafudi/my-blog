import paramiko

SSH_KEY_PATH = r'C:\Users\Administrator\.ssh\cb_ed25519'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

pkey = paramiko.Ed25519Key.from_private_key_file(SSH_KEY_PATH)
client.connect('43.132.228.217', username='ubuntu', pkey=pkey)

# Pull latest code
stdin, stdout, stderr = client.exec_command('cd /var/www/my-blog && git pull origin main')
print(stdout.read().decode())
err = stderr.read().decode()
if err:
    print(f'Git pull error: {err}')

# Install deps
stdin, stdout, stderr = client.exec_command('cd /var/www/my-blog && npm install')
print(stdout.read().decode())

# Start build in tmux (avoids SSH timeout for long builds)
build_cmd = 'tmux new-session -d -s build_session "cd /var/www/my-blog && npm run build 2>&1 | tee /tmp/build.log; touch /tmp/build_done"'
client.exec_command(build_cmd)
print('Build started in tmux')

client.close()

# Wait for build completion (streaming approach)
import paramiko as p2
ssh2 = p2.SSHClient()
ssh2.set_missing_host_key_policy(p2.AutoAddPolicy())
ssh2.connect('43.132.228.217', username='ubuntu', pkey=p2.Ed25519Key.from_private_key_file(SSH_KEY_PATH))

wait_cmd = (
    'tail -F /tmp/build.log 2>/dev/null & '
    'TAIL_PID=$!; '
    'while [ ! -f /tmp/build_done ]; do sleep 0.5; done; '
    'kill $TAIL_PID 2>/dev/null; '
    'echo "===BUILD_DONE==="'
)

print('\nStreaming build log...\n')
stdin, stdout, stderr = ssh2.exec_command(wait_cmd)
for line in stdout:
    decoded = line.strip()
    if decoded == '===BUILD_DONE===':
        print('\nBuild completed!')
        break
    if decoded:
        print(f'  {decoded}')

# Restart PM2 and cleanup
stdin, stdout, stderr = ssh2.exec_command(
    'pm2 restart my-blog && '
    'tmux kill-session -t build_session 2>/dev/null; '
    'rm -f /tmp/build_done'
)
stdout.read()
print('PM2 restarted, cleanup done')

ssh2.close()
print('\nDeployment complete!')
