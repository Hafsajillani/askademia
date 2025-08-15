import React, { useState, useEffect, useRef } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar } from "./ui/avatar";
import { AvatarImage } from "@radix-ui/react-avatar";
import { useWebSocket } from "./WebSocketProvider";

interface Message {
  text: string;
  sender: "User" | "Gemini";
  timestamp: number;
  isComplete: boolean;
  type: "text";
}

const Chat: React.FC = () => {
  const [inputText, setInputText] = useState("");
  const {
    sendMessage,
    lastTranscription,
    lastTextMessage,
    isConnected,
    error
  } = useWebSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(event.target.value);
  };

  const handleSendMessage = () => {
    if (inputText.trim() !== "") {
      sendMessage({ text: inputText });
      setMessages((prev) => [
        ...prev,
        {
          text: inputText,
          sender: "User",
          timestamp: Date.now(),
          isComplete: true,
          type: "text",
        },
      ]);
      setInputText("");
    }
  };

  // Handle transcription updates
  useEffect(() => {
    if (lastTranscription) {
      setMessages((prev) => {
        const lastMessage = prev.slice().reverse().find((m: Message) => m.type === "text" && m.sender === lastTranscription.sender);

        // Update last message if it's incomplete and from the same sender
        if (
          lastMessage &&
          lastMessage.sender === lastTranscription.sender &&
          !lastMessage.isComplete
        ) {
          return prev.map((msg) =>
            msg === lastMessage
              ? {
                  ...lastMessage,
                  text: lastMessage.text + lastTranscription.text,
                  isComplete: lastTranscription.finished === true,
                }
              : msg
          );
        }

        // Add new transcription message
        const newMessage: Message = {
          text: lastTranscription.text,
          sender: lastTranscription.sender,
          timestamp: Date.now(),
          isComplete: lastTranscription.finished === true,
          type: "text",
        };
        return [...prev, newMessage];
      });
    }
  }, [lastTranscription]);

  // Handle text message updates
  useEffect(() => {
    if (lastTextMessage) {
      setMessages((prev) => {
        const newMessage: Message = {
          text: lastTextMessage.text,
          sender: lastTextMessage.sender,
          timestamp: Date.now(),
          isComplete: true,
          type: "text",
        };
        return [...prev, newMessage];
      });
    }
  }, [lastTextMessage]);

  // Auto-scroll to the latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.sender === "Gemini" ? "justify-start" : "justify-end"
            } items-start space-x-2`}
          >
            {message.sender === "Gemini" && (
              <Avatar>
                <AvatarImage src="/placeholder-avatar.jpg" alt="Gemini Avatar" />
              </Avatar>
            )}
            <div
              className={`p-3 rounded-lg max-w-[70%] ${
                message.sender === "Gemini"
                  ? "bg-gray-100 text-gray-800"
                  : "bg-blue-500 text-white"
              }`}
            >
              {message.text && (
                <>
                  <p>{message.text}</p>
                  {!message.isComplete && (
                    <span className="text-xs text-gray-500">(typing...)</span>
                  )}
                </>
              )}
            </div>
            {message.sender === "User" && (
              <Avatar>
                <AvatarImage src="/user-avatar.jpg" alt="User Avatar" />
              </Avatar>
            )}
          </div>
        ))}
        <div ref={chatEndRef} />
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t flex space-x-2">
        <Input
          value={inputText}
          onChange={handleInputChange}
          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          placeholder="Type a message..."
          disabled={!isConnected}
        />
        <Button onClick={handleSendMessage} disabled={!isConnected}>
          Send
        </Button>
      </div>
    </div>
  );
};

export default Chat;