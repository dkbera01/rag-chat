import { Send, Loader } from "lucide-react";
export default function ChatWindow({
  chatHistory,
  chatInput,
  setChatInput,
  handleSendMessage,
  loading,
}: {
  chatHistory: { sender: string; text: string }[];
  chatInput: string;
  setChatInput: (val: string) => void;
  handleSendMessage: () => void;
  loading: boolean;
}) {
  return (
    <section className="bg-black/50 rounded-2xl p-4 shadow-lg flex flex-col">
      <h2 className="text-xl font-semibold mb-3">Chat</h2>
      <div className="flex-1 overflow-y-auto space-y-2 mb-3 p-2 bg-black/30 rounded">
        {chatHistory.map((msg, idx) => (
          <div
            key={idx}
            className={`p-2 rounded-lg max-w-xs ${
              msg.sender === "user"
                ? "bg-cyan-600 self-end ml-auto"
                : "bg-gray-700 self-start mr-auto"
            }`}
          >
            {msg.text}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-gray-200 animate-pulse">
            <Loader className="w-5 h-5 text-cyan-400 animate-spin" />
            <span>Waitting for response...</span>
          </div>
        )}
      </div>
      <div className="flex">
        <input
          type="text"
          placeholder="Ask something..."
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          className="flex-1 p-2 rounded-l bg-black/60 border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          disabled={loading}
        />
        <button
          onClick={handleSendMessage}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-r font-semibold flex items-center justify-center"
          disabled={loading}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </section>
  );
}
