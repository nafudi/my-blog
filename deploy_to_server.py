import paramiko
import os

password = os.environ.get('SERVER_PASS', '}SX{_!$(2eTd8MGq).')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('43.132.228.217', username='ubuntu', password=password)

# 执行部署命令
commands = [
    'cd ~/my-learn-blog && git pull origin main',
    'cd ~/my-learn-blog && npm install',
    'cd ~/my-learn-blog && npm run build',
    'pm2 restart all'
]

for cmd in commands:
    print(f"\n>>> 执行: {cmd}")
    stdin, stdout, stderr = client.exec_command(cmd)
    print(stdout.read().decode())
    err = stderr.read().decode()
    if err:
        print(f"错误: {err}")

client.close()
print("\n部署完成!")
