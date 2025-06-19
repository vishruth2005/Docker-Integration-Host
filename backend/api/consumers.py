import json
import threading
import docker
from channels.generic.websocket import WebsocketConsumer

class ChatConsumer(WebsocketConsumer):
    def connect(self):
        self.accept()
        self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'WebSocket connection established!'
        }))

    def receive(self, text_data):
        data = json.loads(text_data)
        container_id = data.get("container_id")

        if container_id:
            thread = threading.Thread(target=self.stream_container_logs, args=(container_id,))
            thread.start()
        else:
            self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'No container_id provided'
            }))

    def stream_container_logs(self, container_id):
        client = docker.from_env()
        try:
            container = client.containers.get(container_id)

            for line in container.logs(stream=True, follow=True, stdout=True, stderr=True):
                self.send(text_data=json.dumps({
                    'type': 'log',
                    'message': line.decode('utf-8').strip()
                }))
        except docker.errors.NotFound:
            self.send(text_data=json.dumps({
                'type': 'error',
                'message': f'Container with ID {container_id} not found'
            }))
        except Exception as e:
            self.send(text_data=json.dumps({
                'type': 'error',
                'message': str(e)
            }))
