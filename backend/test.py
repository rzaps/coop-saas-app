import hmac
import hashlib
import json
from urllib.parse import urlencode

bot_token = "8709933958:AAHVRL22Zd3XPWii6trMaxu_r7d3tqt0WyQ"
user_data = {"id": 123456789, "first_name": "Test", "last_name": "User"}
auth_date = "1708862400"

data = {
    "user": json.dumps(user_data),
    "auth_date": auth_date
}

data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(data.items()))
secret_key = hmac.new("WebAppData".encode(), bot_token.encode(), hashlib.sha256).digest()
hash_value = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

data["hash"] = hash_value
init_data = urlencode(data)
print(init_data)

