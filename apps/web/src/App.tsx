import { useState, useEffect } from 'react';
import './App.css'

function App() {
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    fetch("http://localhost:3000/messages")
      .then((res) => res.json())
      .then(setMessages);
  }, []);

  return (
    <div>
      <h1>Messages</h1>

      {messages.map((message) => (
        <div key={message._id}>
          {message.text}
        </div>
      ))}
    </div>
  );
}

export default App
