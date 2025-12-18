import json
import time
from fastapi.testclient import TestClient
from backend_fastapi.app.main import app

client = TestClient(app)


def pr(label, data):
    print(label + ': ' + json.dumps(data, ensure_ascii=False))


# 1) login
resp = client.post('/api/v1/auth/login', json={'email': 'admin@academia.com', 'password': '123456'})
resp.raise_for_status()
login = resp.json()
pr('login', {'ok': 'access_token' in login})
headers = {'Authorization': f"Bearer {login['access_token']}", 'Content-Type': 'application/json'}

# 2) create user
email = f"test.user.{int(time.time())}@academia.com"
payload = {'email': email, 'password': 'Admin123!', 'nombre': 'Test', 'apellido': 'User', 'rol': 'Docente', 'activo': True}
resp = client.post('/api/v1/users', headers=headers, json=payload)
resp.raise_for_status()
created = resp.json()
uid = created.get('data', {}).get('id')
pr('created', {'success': created.get('success'), 'id': uid})

# 3) update user
resp = client.put(f'/api/v1/users/{uid}', headers=headers, json={'telefono': '3000000000'})
resp.raise_for_status()
updated = resp.json()
pr('updated', {'success': updated.get('success')})

# 4) toggle
resp = client.patch(f'/api/v1/users/{uid}/toggle', headers=headers)
resp.raise_for_status()
toggled = resp.json()
pr('toggled', {'success': toggled.get('success'), 'activo': toggled.get('data', {}).get('activo')})

# 5) stats
resp = client.get('/api/v1/users/stats', headers=headers)
resp.raise_for_status()
stats = resp.json()
pr('stats', stats.get('data', {}))

# 6) delete (logical)
resp = client.delete(f'/api/v1/users/{uid}', headers=headers)
resp.raise_for_status()
deleted = resp.json()
pr('deleted', {'success': deleted.get('success'), 'activo': deleted.get('data', {}).get('activo')})
