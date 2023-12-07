import { useState, useEffect } from "react";
import { Collapse, Input, Button, Modal, Alert, message } from "antd";
import "./App.css";
const { Search } = Input;

function App() {
  const [birthday, setBirthday] = useState({});

  const items = [
    {
      key: "1",
      label: <a>Want to receive notifications?</a>,
      children: <Subscribe />,
    },
  ];

  useEffect(() => {
    fetch("/api/birthday")
      .then((response) => response.json())
      .then((data) => {
        setBirthday(data);
      })
      .catch((error) => console.error(error));
  }, []);

  return (
    <>
      {birthday["character"] == undefined && <h1>No birthdays today...</h1>}
      {birthday["character"] != undefined && (
        <h1>Today is {birthday["character"]}'s birthday!</h1>
      )}
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
        birthday. Notifications push at 12am UTC.
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
        <a href="https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks">
          What's a webhook?
        </a>
      </p>
      <footer>
        <a
          style={{ color: "red", fontSize: "0.8rem" }}
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

export default App;
