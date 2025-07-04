/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import { Collapse, Input, Button, Modal, Alert, Drawer, message } from "antd";
import "./App.css";
const { Search } = Input;

const localResetTime = new Date(
  Date.UTC(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate(),
    0,
    0,
    0
  )
)
  .toLocaleTimeString()
  .replaceAll(":00", "");

function App() {
  const [birthday, setBirthday] = useState({});
  const [nextBirthday, setNextBirthday] = useState({});
  const [img, setImg] = useState("");

  const items = [
    {
      key: "1",
      label: <a>Want to receive notifications?</a>,
      children: <Subscribe />,
    },
  ];

  useEffect(() => {
    let month = new Date().getMonth() + 1;
    let day = new Date().getDate();
    fetch(`/api/birthday?day=${day}&month=${month}`)
      .then((response) => response.json())
      .then((data) => {
        setBirthday(data);
      })
      .catch((error) => console.error(error));
  }, []);

  useEffect(() => {
    if (birthday["birthday_page"]) {
      fetch(`/api/birthday/art`, {
        method: "POST",
        body: JSON.stringify({
          url: birthday["birthday_page"],
          width: window.innerWidth,
        }),
        headers: { "Content-Type": "application/json" },
      })
        .then((response) => response.text())
        .then((data) => {
          setImg(data);
        })
        .catch((error) => console.error(error));
    }
  }, [birthday]);

  return (
    <>
      <AllBirthdays setNextBirthday={setNextBirthday} />
      {img && <img className="bg" src={"data:image/png;base64," + img} />}
      <div>
        {birthday["character"] == undefined && <h1>No birthdays today...</h1>}
        {birthday["character"] != undefined && (
          <h1>Today is {birthday["character"]}'s birthday!</h1>
        )}
      </div>
      <p style={{ fontSize: "0.9rem", margin: 0 }}>
        {new Date().toLocaleString("default", {
          month: "long",
          day: "numeric",
        })}
      </p>
      {birthday["character"] == undefined && 'character' in nextBirthday && 
        <p style={{ fontSize: "0.9rem", margin: 0, marginTop: "0.5rem" }}>
          Next birthday is {nextBirthday.character}'s on {nextBirthday.month} {nextBirthday.day_en}
        </p>
      }
      <Collapse ghost expandIcon={() => <></>} items={items} />
    </>
  );
}

function Subscribe() {
  const [url, setURL] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  function handleSubscribe() {
    let params = {
      method: "POST",
      body: JSON.stringify({ url: url }),
      headers: { "Content-Type": "application/json" },
    };

    setLoading(true);
    fetch("/api/subscribe", params)
      .then((response) => {
        if (response.status == 200) {
          messageApi.success("Subscribed");
          return response.json();
        } else {
          response.json().then((r) => {
            messageApi.error(r);
          });
        }
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        setLoading(false);
        setURL("");
      });
  }

  const SearchButton = (
    <Button type="primary" disabled={url === ""} loading={loading}>
      Subscribe
    </Button>
  );

  return (
    <>
      {contextHolder}
      <p>
        You can use webhooks to get notifications whenever it is a character's
        birthday. Notifications push at 12 AM UTC (or {localResetTime} local
        time).
        <br />
      </p>
      <Search
        enterButton={SearchButton}
        placeholder="URL Of Your Webhook..."
        value={url}
        onChange={(e) => setURL(e.target.value)}
        onSearch={handleSubscribe}
      />
      <br />
      <p>
        You can use Discord to get a webhook url.{" "}
        <a
          href="https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks"
          target="_blank" rel="noreferrer"
        >
          What's a webhook?
        </a>
      </p>
      <footer>
        <a
          style={{ color: "#d9363e", fontSize: "0.8rem" }}
          onClick={() => setIsModalOpen(!isModalOpen)}
        >
          Unsubscribe
        </a>
      </footer>
      <UnsubscribeModal isOpen={isModalOpen} setModal={setIsModalOpen} />
    </>
  );
}

function UnsubscribeModal({ isOpen, setModal }) {
  const [url, setURL] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  function handleUnsubscribe() {
    let params = {
      method: "POST",
      body: JSON.stringify({ url: url }),
      headers: { "Content-Type": "application/json" },
    };
    setLoading(true);
    fetch("/api/unsubscribe", params)
      .then((response) => {
        if (response.status == 200) {
          messageApi.success("Unsubscribed");
          setError(false);
          setModal(false);
          return response.json();
        } else response.json().then((e) => setError(e));
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        setLoading(false);
        setURL("");
      });
  }

  return (
    <>
      {contextHolder}
      <Modal
        open={isOpen}
        onCancel={() => setModal(false)}
        onOk={handleUnsubscribe}
        centered
        confirmLoading={loading}
      >
        <h2>Unsubscribe</h2>
        Enter your webhook url to unsubscribe it from this service.
        <p>
          <Input
            placeholder="URL Of Your Webhook to Unsubscribe"
            onChange={(e) => setURL(e.target.value)}
            value={url}
          />
        </p>
        {error && <Alert description={error} type="error" />}
      </Modal>
    </>
  );
}

function AllBirthdays({setNextBirthday = () => {}}) {
  const [birthdays, setBirthdays] = useState([]);
  const [filteredBirthdays, setFilteredBirthdays] = useState([]);
  const [filters, setFilters] = useState("");
  const [open, setOpen] = useState(false);
  // "icon"
  // "character"
  // "month"
  // "day"
  // "day_en"

  function getNextBirthday(birthday_list) {
    const now = new Date();

    const birthday_dates = birthday_list.map(birthday => {
      const thisYearBirthday = new Date(`${birthday.month} ${birthday.day}, ${now.getFullYear()}`);
      const year = now > thisYearBirthday ? now.getFullYear() + 1 : now.getFullYear();
      return {
        ...birthday,
        birthday_date: new Date(`${birthday.month} ${birthday.day}, ${year}`)
      };
    });

    const closest = birthday_dates.reduce((closest, character) => {
      const current = character.birthday_date;
      if (current <= now) return closest;

      const currentDiff = current - now;
      const closestDiff = closest ? closest.birthday_date - now : Infinity;

      return currentDiff < closestDiff ? character : closest;
    }, null);
    
    return closest
  }

  useEffect(() => {
    fetch("/api/birthday/all")
      .then((response) => response.json())
      .then((response) => {
        setBirthdays(response);
        setFilteredBirthdays(response);
        setNextBirthday(getNextBirthday(response))
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  useEffect(() => {
    if (filters)
      setFilteredBirthdays(
        filteredBirthdays.filter((char) =>
          char["character"].toLowerCase().includes(filters.toLowerCase())
        )
      );
    else setFilteredBirthdays(birthdays);
  }, [filters]);

  return (
    <>
      <Button
        style={{
          position: "fixed",
          top: "1rem",
          left: "1rem",
        }}
        onClick={() => setOpen(!open)}
      >
        Show All
      </Button>
      <Drawer open={open} onClose={() => setOpen(false)} placement="left">
        <a
          href="https://genshin-impact.fandom.com/wiki/Birthday"
          target="_blank" rel="noreferrer"
        >
          Birthday data collected from the wiki.
        </a>
        <Input
          placeholder="Search..."
          value={filters}
          onChange={(e) => setFilters(e.target.value)}
          style={{ marginBottom: "1rem", marginTop: "1rem" }}
        />
        <br />
        {birthdays &&
          filteredBirthdays.map((birthday, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-evenly",
              }}
            >
              <img src={birthday["icon"]} width={100} />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  flexDirection: "column",
                  textAlign: "center",
                }}
              >
                <h2 style={{ width: "min-content" }}>
                  {birthday["character"]}
                </h2>
                <p>
                  {birthday["month"]} {birthday["day_en"]}
                </p>
              </div>
            </div>
          ))}
      </Drawer>
    </>
  );
}

export default App;
