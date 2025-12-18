import json, time, urllib.request
BASE = 'http://127.0.0.1:8000'

def req(method, path, headers=None, data=None, timeout=10):
    if data is not None and not isinstance(data, (bytes, bytearray)):
        data = json.dumps(data).encode()
    h = {'Content-Type': 'application/json'}
    if headers:
        h.update(headers)
    r = urllib.request.Request(BASE + path, data=data, headers=h, method=method)
    with urllib.request.urlopen(r, timeout=timeout) as resp:
        return resp.status, json.loads(resp.read().decode())

# 1) login (temporal rule '123456')
code, login = req('POST', '/api/v1/auth/login', data={'email':'admin@academia.com','password':'123456'})
print('login', code, 'access_token' in login)
access = login['access_token']
headers = {'Authorization': f'Bearer {access}'}

# 2) create user
email = f"test.user.{int(time.time())}@academia.com"
code, created = req('POST', '/api/v1/users', headers=headers, data={'email':email,'password':'Admin123!','nombre':'Test','apellido':'User','rol':'Docente','activo':True})
print('create', code, created.get('success'), created.get('data',{}).get('id'))
uid = created.get('data',{}).get('id')

# 3) update user
code, updated = req('PUT', f'/api/v1/users/{uid}', headers=headers, data={'telefono':'3000000000'})
print('update', code, updated.get('success'))

# 4) toggle
code, toggled = req('PATCH', f'/api/v1/users/{uid}/toggle', headers=headers)
print('toggle', code, toggled.get('success'), toggled.get('data',{}).get('activo'))

# 5) stats
code, stats = req('GET', '/api/v1/users/stats', headers=headers)
print('stats', code, stats.get('data'))

# 6) delete (logical)
code, deleted = req('DELETE', f'/api/v1/users/{uid}', headers=headers)
print('delete', code, deleted.get('success'), deleted.get('data',{}).get('activo'))
