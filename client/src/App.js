// import React, { useState, useEffect } from 'react';
// import './App.css';

// function App() {
//   const[messages,setMessages]=useState([]);
//   const[input,setInput]= useState('');
//   const[socket,setSocket]=useState(null);

//   useEffect(() => {
//     const newSocket = new WebSocket('ws://192.168.55.103:5000');
//     setSocket(newSocket);

//     newSocket.onopen = () => {
//       console.log('WebSocket connection established');

//     };
//     newSocket.onmessage=(event)=>{
//       const message=event.data.toString();
//       setMessages((prevMessages)=>[...prevMessages,message]);
//     };
//     newSocket.onclose= () => {
//       console.log('WebSocket connection closed');
//     };
//     newSocket.onerror =(error)=>{
//       console.error('WebSocket error:', error);
//     };
//     return () => {
//       newSocket.close();
//     };
//   }, []);
//   const sendMessage=()=>{
//     if(input.trim() && socket && socket.readyState === WebSocket.OPEN){
//       socket.send(input);
//       setInput('');
//     }
//   };
//   return (
//     <div className="App">
//       <div className="chat-window">
//        {messages.map((message, index)=>(
//         <div key={index} className="message">
//           {message}
//         </div>
//        ))}
//       </div>
//       <input
//         type="text"
//         value={input}
//         onChange={(e) => setInput(e.target.value)}
//         onKeyUp={(e) => e.key === 'Enter' && sendMessage()}
//       />
//       <button onClick={sendMessage}>Send</button>
//     </div>
//   );
// }

// export default App;

import React, { useEffect, useRef, useState } from 'react';
import './App.css';

const username = prompt('Enter your name');
const avatar = `https://api.dicebear.com/7.x/thumbs/svg?seed=${username}`;

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [users, setUsers] = useState([]);
  const [typing, setTyping] = useState('');
  const socketRef = useRef(null);
  const userId = useRef(Math.random().toString(36).substring(7));
  const typingTimeout = useRef(null);


  useEffect(() => {
    if (socketRef.current) return; // prevent duplicate connections
  
    const socket = new WebSocket('ws://localhost:5000');
    socketRef.current = socket;
  
    socket.onopen = () => {
      console.log('✅ WebSocket connected');
  
      socket.send(
        JSON.stringify({
          type: 'join',
          userId: userId.current,
          username,
          avatar,
        })
      );
    };
  
    socket.onmessage = (e) => {
      const data = JSON.parse(e.data);
  
      if (data.type === 'users') {
        setUsers(data.users);
        return;
      }
  
      if (data.type === 'typing') {
        setTyping(data.username);
        setTimeout(() => setTyping(''), 800);
        return;
      }
  
      if (data.type === 'message') {
        setMessages((prev) => [...prev, data]);
      }
    };
  
    socket.onerror = (err) => {
      console.error('WebSocket error', err);
    };
  
    socket.onclose = () => {
      console.log('❌ WebSocket closed');
      socketRef.current = null;
    };
  
    // ❌ DO NOT close socket here
    return () => {};
  }, []);
  

  const sendMessage = () => {
    if (
      !input.trim() ||
      !socketRef.current ||
      socketRef.current.readyState !== WebSocket.OPEN
    )
      return;
  
    socketRef.current.send(
      JSON.stringify({
        type: 'message',
        text: input,
        userId: userId.current,
        username,
        avatar,
        time: new Date().toLocaleTimeString(),
      })
    );
  
    setInput('');
  };
  
  const handleTyping = () => {
    if (
      !socketRef.current ||
      socketRef.current.readyState !== WebSocket.OPEN
    ) {
      return;
    }
    socketRef.current.send(
      JSON.stringify({
        type: 'typing',
        username,
      })
    );
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {}, 800);
  };

  return (
    <div className="App">
      <div className="sidebar">
        <h3>Online</h3>
        {users.map((u, i) => (
          <div key={i} className="user">
            <img src={u.avatar} alt="" />
            {u.username}
          </div>
        ))}
      </div>

      <div className="chat">
        <div className="chat-window">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`message ${
                m.userId === userId.current ? 'self' : 'other'
              }`}
            >
              <img src={m.avatar} alt="" />
              <div>
                <strong>{m.username}</strong>
                <p>{m.text}</p>
                <span>{m.time}</span>
              </div>
            </div>
          ))}
        </div>

        {typing && <div className="typing">{typing} is typing…</div>}

        <div className="input-area">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyUp={handleTyping}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message…"
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
}

export default App;
