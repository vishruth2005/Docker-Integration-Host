# Import your model
from .models import ContainerRecord

# Get an existing DockerHost instance (or create a new one)
container = ContainerRecord.objects.get(container_id='ddbfcf692f95')  # or filter by some field

# Test connection
stats = container.stats()

print("stats" , stats)
