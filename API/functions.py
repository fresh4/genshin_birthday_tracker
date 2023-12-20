import json
import requests as rq
import re, calendar, os, base64
from datetime import date
import mongo
from flask import request, jsonify
from dotenv import load_dotenv, find_dotenv

COLLECTION = os.getenv("WEBHOOKS_COLLECTION")

load_dotenv(find_dotenv())
db = mongo.get_database()
subscribers = db.get_collection(COLLECTION)

def get_character_by_birthday(input_month = None, input_day = None, input_year = None) -> dict:
  input_month = date.today().month if input_month == None else input_month
  input_day = date.today().day if input_day == None else input_day
  input_year = date.today().year if input_year == None else input_year

  birthdays = construct_birthday_list()
  today = {
    "month": str(input_month),
    "day": str(input_day)
  }

  is_leap = calendar.isleap(input_year)
  if not is_leap:
    obj = next((c for c in birthdays if c['month'] == "February" and c['day'] == "29"), None)
    if obj:
      idx = birthdays.index(obj)
      birthdays[idx] = {"character": birthdays[idx]["character"], "month": birthdays[idx]["month"], "day": "28"}

  for i in birthdays:
    month = str(list(calendar.month_name).index(i["month"]))
    day = str(i["day"])
    if day == today["day"] and month == today["month"]:
      return i
  return {}

def construct_birthday_list() -> list:
  birthdays = []

  html = rq.get("https://genshin-impact.fandom.com/wiki/Birthday")
  html = html.text.split("article-table")[1].split("</>")[0].replace("\n", "")
  html = html.split("<tbody>")[1].split("</tbody>")[0]

  table = html.split("<tr>")[3:]

  for i in table:
    img = re.search(r"(https:.*?.png)", i).group(1)
    birthday_page = re.search(r"\"(\/wiki/Birthday\/.*?)\"", i).group(1)

    data = re.split(r"<td.*?>", i)[1:]
    name = re.sub(r"<.*?>", "", data[1])
    bdate = re.sub(r"<.*?>", "", data[2])
    bday = re.sub(r"\D*", "", bdate)

    birthdays.append({
      "icon": img,
      "character": name,
      "month": bdate.split(" ")[0],
      "day": bday,
      "day_en": bdate.split(" ")[1],
      "birthday_page": birthday_page
    })
  return birthdays

def get_available_birthday_image(url: str, width: int = 600):
  img_w = 600 if width < 1500 else 1000
  try:
    x = rq.get("https://genshin-impact.fandom.com" + url, headers={"Cache-Control": "no-cache"}).text
    link = re.search(r"=\"(https:\/\/.*?_Birthday_.*?\.(png|jpg))", x).group(1)
    img = rq.get(link+f"/revision/latest/scale-to-width-down/{img_w}").content
    return base64.b64encode(img).decode('utf-8')
  except AttributeError:
    return None

def send_webhooks():
  birthday = get_character_by_birthday()
  if not birthday: return 

  for sub in subscribers.find():
    url = sub["webhook"]
    data = {
      "content": f"It's {birthday['character']}'s birthday today! ({birthday['month']} {birthday['day']})"
    }
    rq.post(url, data=json.dumps(data), headers={'Content-Type': 'application/json'})

def auth(func):
    def inner1(*args, **kwargs):
      try:
        if "Authorization" not in request.headers:
          raise Exception("No authorization token passed")
        if request.headers["Authorization"] == "Bearer " + os.getenv("auth"):
          return func(*args, **kwargs)
        else:
          raise Exception("Invalid Authorization")
      except Exception as e:
        return jsonify("Unauthorized"), 401
    return inner1