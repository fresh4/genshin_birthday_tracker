import requests as rq
import re, calendar, os
from datetime import date
from flask import request, jsonify
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

def get_character_by_birthday(input_month = date.today().month, input_day = date.today().day, input_year = date.today().year) -> dict:
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
  html = html.content.decode().split("article-table")[1].split("</>")[0].replace("\n", "")
  html = html.split("<tbody>")[1].split("</tbody>")[0]

  table = html.split("<tr>")[3:]

  for i in table:
    data = re.split(r"<td.*?>", i)[1:]
    name = re.sub(r"<.*?>", "", data[1])
    bdate = re.sub(r"<.*?>", "", data[2])
    bday = re.sub(r"\D*", "", bdate)

    birthdays.append({
      "character": name,
      "month": bdate.split(" ")[0],
      "day": bday
    })
  return birthdays

# defining a decorator
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