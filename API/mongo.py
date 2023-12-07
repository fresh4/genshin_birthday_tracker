from pymongo import MongoClient
from dotenv import find_dotenv, load_dotenv
import os

load_dotenv(find_dotenv())

def get_database():
  # Provide the mongodb atlas url to connect python to mongodb using pymongo
  CONNECTION_STRING = os.environ.get("MONGO_CONNECTION_STRING")

  # Create a connection using MongoClient. You can import MongoClient or use pymongo.MongoClient
  client = MongoClient(CONNECTION_STRING)

  return client[os.getenv("MONGO_DB_NAME")]
