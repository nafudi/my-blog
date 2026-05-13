import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

# 使用正确的密码
password = '}SX{_!$(2eTd8MGq).'

try:
    print("尝试连接到 43.132.228.217...")
    client.connect('43.132.228.217', username='ubuntu', password=password, timeout=15)
    print("连接成功!")
    
    # 测试执行命令
    stdin, stdout, stderr = client.exec_command('whoami && pwd')
    print(f"用户: {stdout.read().decode().strip()}")
    
    # 执行部署
    print("\n1. 拉取代码...")
    stdin, stdout, stderr = client.exec_command('cd ~/my-learn-blog && git pull origin main')
    print(stdout.read().decode())
    if stderr.read():
        print(f"错误: {stderr.read().decode()}")
    
    print("\n2. 安装依赖...")
    stdin, stdout, stderr = client.exec_command('cd ~/my-learn-blog && npm install')
    print(stdout.read().decode())
    
    print("\n3. 构建项目...")
    stdin, stdout, stderr = client.exec_command('cd ~/my-learn-blog && npm run build')
    print(stdout.read().decode())
    
    print("\n4. 重启 PM2...")
    stdin, stdout, stderr = client.exec_command('pm2 restart all')
    print(stdout.read().decode())
    
    client.close()
    print("\n部署完成! 访问 http://43.132.228.217 查看效果")
    
except paramiko.AuthenticationException:
    print("认证失败! 请检查密码是否正确")
except Exception as e:
    print(f"连接失败: {type(e).__name__}: {e}")
