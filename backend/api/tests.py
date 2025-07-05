import docker

# Connect to Docker daemon
client = docker.from_env()

# Get the container (by name or ID)
container = client.containers.get('e257e9edfd8a2ac23730096e79e8efc3ba24823d74368778cf7de191483b2955')

# Stream logs
for line in container.logs(stream=True):
    print(line.decode('utf-8').strip())