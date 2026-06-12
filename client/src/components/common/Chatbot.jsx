import { useState, useRef, useEffect } from 'react';
import api from '../../store/api/baseApi';

export default function Chatbot() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const chatEndRef = useRef(null);

  // Auto scroll down when new messages appear
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input;
    setInput('');
    setLoading(true);

    // Update UI instantly for the user's message
    setMessages(prev => [...prev, { text: userText, sender: 'user' }]);

    try {
      const { data } = await api.post('/chat', {
        message: userText,
        history: chatHistory // Pass existing chat memory history to backend
      });

      if (data.reply) {
        // Update UI with the Bot response
        setMessages(prev => [...prev, { text: data.reply, sender: 'bot' }]);
        
        // Append both turns to the persistent memory history for the next request
        setChatHistory(prev => [
          ...prev,
          { role: 'user', content: userText },
          { role: 'assistant', content: data.reply }
        ]);
      } else {
        setMessages(prev => [...prev, { text: "Sorry, I encountered an issue.", sender: 'bot' }]);
      }
    } catch (error) {
      console.error("Error communicating with backend:", error);
      setMessages(prev => [...prev, { text: "Connection error. Try again.", sender: 'bot' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={styles.floatingButton}
        title="Chat with our Shop Assistant"
      >
        <span className="fas fa-headset fs-3"></span>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div style={styles.chatContainer}>
          <div style={styles.header}>
            <span className="d-flex align-items-center gap-2">
              <span className="fas fa-headset"></span> Shop Assistant
            </span>
            <button onClick={() => setIsOpen(false)} style={styles.closeButton}>
              <span className="fas fa-times"></span>
            </button>
          </div>
          
          <div style={styles.chatWindow}>
            {messages.length === 0 && (
              <p style={{ textAlign: 'center', color: '#888', marginTop: '20px' }}>Ask me about our products, shipping, or rules!</p>
            )}
            {messages.map((msg, index) => (
              <div key={index} style={{ ...styles.messageBubble, alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', backgroundColor: msg.sender === 'user' ? '#3874ff' : '#f1f1f1', color: msg.sender === 'user' ? '#fff' : '#333' }}>
                {msg.text}
              </div>
            ))}
            {loading && <div style={{ ...styles.messageBubble, alignSelf: 'flex-start', color: '#888', backgroundColor: '#f1f1f1' }}>Thinking...</div>}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendMessage} style={styles.inputArea}>
            <input 
              type="text" 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              placeholder="Ask something..." 
              style={styles.input}
              disabled={loading}
            />
            <button type="submit" style={styles.button} disabled={loading || !input.trim()}>
              <span className="fas fa-paper-plane"></span>
            </button>
          </form>
        </div>
      )}
    </>
  );
}

// Quick Basic Styles
const styles = {
  floatingButton: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: '#3874ff',
    color: '#fff',
    border: 'none',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999
  },
  chatContainer: { 
    width: '360px', 
    height: '500px', 
    border: '1px solid #ccc', 
    borderRadius: '12px', 
    display: 'flex', 
    flexDirection: 'column', 
    overflow: 'hidden', 
    fontFamily: 'Arial, sans-serif', 
    position: 'fixed', 
    bottom: '90px', 
    right: '20px', 
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)', 
    backgroundColor: '#fff',
    zIndex: 9999
  },
  header: { 
    background: '#3874ff', 
    padding: '15px', 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  closeButton: {
    background: 'transparent',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '16px'
  },
  chatWindow: { 
    flex: 1, 
    padding: '15px', 
    overflowY: 'auto', 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '10px',
    backgroundColor: '#f8f9fa'
  },
  messageBubble: { 
    maxWidth: '85%', 
    padding: '10px 14px', 
    borderRadius: '16px', 
    fontSize: '14px', 
    lineHeight: '1.4' 
  },
  inputArea: { 
    display: 'flex', 
    borderTop: '1px solid #eee', 
    padding: '10px',
    backgroundColor: '#fff'
  },
  input: { 
    flex: 1, 
    padding: '10px 15px', 
    border: '1px solid #ddd', 
    borderRadius: '20px', 
    outline: 'none', 
    fontSize: '14px' 
  },
  button: { 
    background: '#3874ff', 
    color: '#fff', 
    border: 'none', 
    borderRadius: '50%', 
    width: '40px',
    height: '40px',
    marginLeft: '8px', 
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }
};
