import json
import threading
import docker
from channels.generic.websocket import WebsocketConsumer
from .models import ContainerRecord, DockerHost

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
        container = ContainerRecord.objects.get(container_id=container_id)
        client = docker.DockerClient(base_url=container.host.docker_api_url)
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

class TerminalConsumer(WebsocketConsumer):
    def connect(self):
        self.container_id = self.scope['url_route']['kwargs']['container_id']
        self.exec_id = self.scope['url_route']['kwargs']['exec_id']
        self.accept()
        self.start_terminal_session()

    def start_terminal_session(self):
        container_record = ContainerRecord.objects.get(container_id=self.container_id)
        docker_api_url = container_record.host.docker_api_url
        client = docker.DockerClient(base_url=docker_api_url)
        self.exec_socket = client.api.exec_start(
            exec_id=self.exec_id,
            socket=True,
            tty=True,
            stream=True
        )
        threading.Thread(target=self.stream_output).start()

    def stream_output(self):
        try:
            while True:
                data = self.exec_socket._sock.recv(4096)
                if not data:
                    print("No more data, closing stream_output")
                    break
                self.send(text_data=data.decode('utf-8', errors='replace'))
        except Exception as e:
            print(f"Exception in stream_output: {e}")

    def receive(self, text_data):
        self.exec_socket._sock.sendall(text_data.encode('utf-8'))

    def disconnect(self, close_code):
        if hasattr(self, 'exec_socket'):
            try:
                self.exec_socket.close()
            except Exception as e:
                print(f"Error closing exec_socket: {e}")
