import requests, json, os
import functions as fn
import mongo
from datetime import datetime
from waitress import serve
from flask import Flask, request, jsonify
from dotenv import load_dotenv, find_dotenv
from paste.translogger import TransLogger
load_dotenv(find_dotenv())

COLLECTION = os.getenv("WEBHOOKS_COLLECTION")

app = Flask(__name__)
db = mongo.get_database()
subscribers = db.get_collection(COLLECTION)

@app.route("/api/birthday", methods=["GET"])
def get_birthday():
  day = request.args.get("day")
  month = request.args.get("month")
  if not day or not month:
    res = fn.get_character_by_birthday()
  else:
    res = fn.get_character_by_birthday(month, day)

  return jsonify(res)

@app.route("/api/birthday/all", methods=["GET"])
def get_all_birthdays():
  birthdays = fn.construct_birthday_list()
  return jsonify(birthdays), 200

@app.route("/api/birthday/art", methods=["POST"])
def get_birthday_art():
  url = request.get_json()["url"]
  width = request.get_json()["width"]
  img = fn.get_available_birthday_image(url, width)
  return img

@app.route("/api/subscribe", methods=["POST"])
def add_subscriber():
  url = request.get_json()["url"]
  exists = subscribers.find_one({"webhook": url})
  if exists:
    return jsonify("Webhook already subscribed"), 409

  # Validate the submitted URL
  try:
    test_post_data = {"content": "This webhook has been subscribed to the Genshin Birthday API. You can unsubscribe at any time on [the website](https://genshin-birthdays.com/)."}
    test_post = requests.post(url, data=json.dumps(test_post_data), headers={"Content-Type": "application/json"})
    if test_post.status_code >= 400:
      raise Exception("Invalid URL")
  except Exception as e:
    return jsonify("Invalid URL"), 422
  
  subscribers.insert_one({
    "webhook": url
  })
  return jsonify("Subscribed"), 200

@app.route("/api/unsubscribe", methods=["POST"])
def remove_subscriber():
  url = request.get_json()["url"]
  response = subscribers.delete_one({"webhook": url}).deleted_count
  if not response:
    return jsonify("Webhook already unsubscribed."), 404
  return jsonify(response), 200

@app.route("/api/publish", methods=["POST"])
@fn.auth
def send_webhooks():
  birthday = fn.get_character_by_birthday()
  if not birthday: return jsonify("No birthdays today."), 200

  for sub in subscribers.find():
    url = sub["webhook"]
    data = {
      "content": f"It's {birthday['character']}'s birthday today! ({birthday['month']} {birthday['day']})"
    }
    requests.post(url, data=json.dumps(data), headers={'Content-Type': 'application/json'})
  return jsonify("Sent webhooks"), 200

if __name__ == "__main__":
  # app.run(debug=True)
  serve(TransLogger(app), host="0.0.0.0", port=5000)