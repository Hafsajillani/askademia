import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Home from "@/screens/Home";
import { WebSocketProvider, Chat, ScreenShare, useWebSocket } from "@/screens/Dashboard";
import DashboardLayout from '@/components/layout/DashboardLayout';
import { MessageSquare, Monitor } from 'lucide-react';
import { ScrollArea } from "@/screens/Dashboard/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/screens/Dashboard/ui/card";
import Signup from './screens/Auth/Signup';
import Login from './screens/Auth/Login';

interface ChatMessage {
  text: string;
  sender: "User" | "Gemini";
  timestamp: string;
  isComplete: boolean;
}

const Dashboard = () => {
  return (
    <DashboardLayout>
      <WebSocketProvider url="ws://localhost:9085">
        <DashboardContent />
      </WebSocketProvider>
    </DashboardLayout>
  );
};

const DashboardContent = () => {
  const { isConnected, error, lastTranscription } = useWebSocket();
  const [messages, setMessages] = useState<ChatMessage[]>([{
    text: "Screen sharing session started. I'll transcribe what I see.",
    sender: "Gemini",
    timestamp: new Date().toLocaleTimeString(),
    isComplete: true
  }]);

  // Handle incoming transcriptions
  useEffect(() => {
    if (lastTranscription) {
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        
        // Check if the last message is from the same sender and is incomplete
        const shouldUpdateLast = lastMessage && 
                               lastMessage.sender === lastTranscription.sender &&
                               !lastMessage.isComplete;

        if (shouldUpdateLast) {
          // Update the last message by appending new text and updating completion status
          const updatedMessages = [...prev];
          updatedMessages[updatedMessages.length - 1] = {
            ...lastMessage,
            text: lastMessage.text + lastTranscription.text, // Append new text
            isComplete: lastTranscription.finished === true
          };
          return updatedMessages;
        }
        
        // Otherwise, add a new message entry
        const newMessage = {
          text: lastTranscription.text,
          sender: lastTranscription.sender,
          timestamp: new Date().toLocaleTimeString(),
          isComplete: lastTranscription.finished === true
        };
        return [...prev, newMessage];
      });
    }
  }, [lastTranscription]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-900">Your Teaching AI Assistant</h1>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className={`text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
            {error && <span className="text-xs text-red-500">Error: {error}</span>}
          </div>
        </div>
      </div>

      {/* Main Content - Side by Side Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Screen Share - Left Side */}
        <div className="w-2/3 flex flex-col">
          <div className="bg-white px-4 py-3 flex items-center space-x-3">
            <div className="p-2 bg-gray-100 rounded-sm border border-gray-200">
              <Monitor size={18} className="text-gray-700" />
            </div>
            <h2 className="text-md text-muted-foreground">Share your screen to talk to me</h2>
          </div>
          <div className="flex-1">
            <ScreenShare />
          </div>
        </div>

        {/* Chat History - Right Side */}
        <div className="w-1/3 flex flex-col">
          <div className="bg-white px-4 py-3 flex items-center space-x-3">
            <div className="p-2 bg-gray-100 rounded-sm border border-gray-200">
              <MessageSquare size={18} className="text-gray-700" />
            </div>
            <h2 className="text-md text-muted-foreground">Chat History</h2>
          </div>
          <div className="flex-1 p-4">
            <Card className="w-full h-full">
              {/*<CardHeader>
                 <CardTitle>Chat History</CardTitle>
              </CardHeader>*/}
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {messages.map((message, index) => (
                      <div 
                        key={index} 
                        className="flex items-start space-x-4 rounded-lg p-4 bg-muted/50"
                      >
                        <div className="">
                          <span className="text-xs font-medium text-primary-foreground h-8 w-8 rounded-full flex items-center justify-center bg-gray-100 border border-gray-300">
                            {message.sender === "Gemini" ? "AI" : "You"}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm leading-loose">{message.text}</p>
                          <p className="text-xs text-muted-foreground">
                            {message.timestamp}
                            {!message.isComplete && " (typing...)"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <div className="min-h-screen bg-white">
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path='/signup' element={<Signup />} />
          <Route path='/login' element={<Login />} />
        </Routes>
      </Router>
    </div>
  )
}

export default App