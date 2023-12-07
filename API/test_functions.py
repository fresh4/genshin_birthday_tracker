import functions as fn
import pytest
from datetime import datetime

def test_canary():
  assert True

def test_get_birthdays():
  birthdays = fn.construct_birthday_list()
  assert len(birthdays) > 0


def test_get_valid_birthday():
  test_date = datetime.strptime("03/01/2023", "%d/%m/%Y")
  response = fn.get_character_by_birthday(test_date.month, test_date.day)
  assert response["character"] == "Wanderer"

def test_get_invalid_birthday():
  # Until someone gets a birthday on 1/1...
  test_date = datetime.strptime("01/01/2023", "%d/%m/%Y")
  response = fn.get_character_by_birthday(test_date.month, test_date.day)
  print(response)
  assert not response

def test_bennet_birthday_on_leap_year():
  test_date = datetime.strptime("29/02/2020", "%d/%m/%Y")
  response = fn.get_character_by_birthday(test_date.month, test_date.day, test_date.year)
  assert response["character"] == "Bennett"

def test_bennet_birthday_on_normal_year():
  test_date = datetime.strptime("28/02/2021", "%d/%m/%Y")
  response = fn.get_character_by_birthday(test_date.month, test_date.day, test_date.year)
  assert response["character"] == "Bennett"