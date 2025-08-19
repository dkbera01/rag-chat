import { useState } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ProgressBar from "./components/ProgressBar";
import SourceButtons from "./components/SourceButtons";
import RagStore from "./components/RagStore";
import ChatWindow from "./components/ChatWindow";
import Modal from "./components/Modal";
import { Upload, Loader } from "lucide-react";

import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "langchain/document";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker?url";

import toast, { Toaster } from "react-hot-toast";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";

export default function ChatbotApp() {
  const [showFileModal, setShowFileModal] = useState(false);
  const [showWebsiteModal, setShowWebsiteModal] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [refreshStore, setRefreshStore] = useState(false);

  const [files, setFiles] = useState<File[]>([]);
  const [websiteLinks, setWebsiteLinks] = useState("");
  const [rawText, setRawText] = useState("");
  const [sourceCount, setSourceCount] = useState(0);

  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);

  // loaders for different processes
  const [loadingChat, setLoadingChat] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);
  const [loadingText, setLoadingText] = useState(false);
  const [loadingWebsite, setLoadingWebsite] = useState(false);

  // Chat message sending
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return toast.error("Please enter a message!");
    if (selectedCollections.length === 0) return toast.error("Please select at least one collection!");

    setChatHistory((prev) => [...prev, { sender: "user", text: chatInput }]);
    setChatInput("");

    setLoadingChat(true);
    try {
      const embeddings = new OpenAIEmbeddings({
        model: "text-embedding-3-large",
        openAIApiKey: import.meta.env.VITE_OPENAI_API_KEY,
      });

      let allResults: any[] = [];
      for (const collectionName of selectedCollections) {
        const vectorStore = await QdrantVectorStore.fromExistingCollection(
          embeddings,
          { url: import.meta.env.VITE_QDRANT_URL, collectionName }
        );

        const vectorRetriever = vectorStore.asRetriever({ k: 5 });
        const relevantSearch = await vectorRetriever.invoke(chatInput);
        allResults.push(...relevantSearch);
      }

      const SYSTEM_PROMPT = `
        You are a helpful assistant. Use the following context to answer the user's question.
        Only answer based on the available context.
        Context: ${JSON.stringify(allResults)}
      `;

      const res = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemPrompt: SYSTEM_PROMPT, userPrompt: chatInput }),
      });

      const data = await res.json();
      setChatHistory((prev) => [...prev, { sender: "bot", text: data.text }]);
    } catch (err) {
      toast.error("Error fetching AI response!");
      console.error(err);
    } finally {
      setLoadingChat(false);
    }
  };

  // Add source handler
  const handleAddSource = async (type: "file" | "website" | "text") => {
    if (type === "file") {
      if (files.length === 0) return toast.error("Please select a file!");
      setLoadingFile(true);

      try {
        for (const file of files) {
          const arrayBuffer = await file.arrayBuffer();
          const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

          let fullText = "";
          for (let i = 1; i <= pdfDoc.numPages; i++) {
            const page = await pdfDoc.getPage(i);
            const content = await page.getTextContent();
            fullText += content.items.map((item) => item.str).join(" ") + "\n";
          }

          const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
          const docs = await splitter.splitDocuments([new Document({ pageContent: fullText, metadata: { fileName: file.name } })]);

          const embeddings = new OpenAIEmbeddings({ model: "text-embedding-3-large", openAIApiKey: import.meta.env.VITE_OPENAI_API_KEY });
          await QdrantVectorStore.fromDocuments(docs, embeddings, { url: import.meta.env.VITE_QDRANT_URL, collectionName: `${file.name}` });
        }
        toast.success("Files processed successfully!");
      } catch (err) {
        toast.error("Error processing files!");
        console.error(err);
      } finally {
        setLoadingFile(false);
      }
    }

    if (type === "text") {
      if (!rawText.trim()) return toast.error("Please enter some text!");
      setLoadingText(true);

      try {
        const title = rawText.slice(0, 30).replace(/\s+/g, "_");
        const embeddings = new OpenAIEmbeddings({ model: "text-embedding-3-large", openAIApiKey: import.meta.env.VITE_OPENAI_API_KEY });
        await QdrantVectorStore.fromDocuments([new Document({ pageContent: rawText, metadata: { title: title } })], embeddings, {
          url: import.meta.env.VITE_QDRANT_URL,
          collectionName: `${title}_${Date.now()}`,
        });
        toast.success("Text processed successfully!");
      } catch (err) {
        toast.error("Error processing text!");
        console.error(err);
      } finally {
        setLoadingText(false);
      }
    }

    if (type === "website") {
      if (!websiteLinks.trim()) return toast.error("Please enter website links!");
      setLoadingWebsite(true);

      try {
        await new Promise((resolve) => setTimeout(resolve, 2000)); // simulate
        toast.success("Website processed successfully!");
      } catch (err) {
        toast.error("Error processing website links!");
        console.error(err);
      } finally {
        setLoadingWebsite(false);
      }
    }

    setRefreshStore((prev) => !prev);
    setSourceCount((count) => Math.min(10, count + 1));
    setFiles([]);
    setWebsiteLinks("");
    setRawText("");
    setShowFileModal(false);
    setShowWebsiteModal(false);
    setShowTextModal(false);
  };

  return (
    <div className="min-h-screen flex flex-col text-white bg-gradient-to-br from-[#1a001a] to-[#06191c]">
      <Toaster position="top-right" reverseOrder={false} />
      <Header />

      <div className="p-4 space-y-4">
        <SourceButtons
          onFile={() => setShowFileModal(true)}
          onWebsite={() => setShowWebsiteModal(true)}
          onText={() => setShowTextModal(true)}
        />
        <ProgressBar sourceCount={sourceCount} />
      </div>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
        <RagStore refresh={refreshStore} onSelectChange={(collections) => setSelectedCollections(collections)} />
        <ChatWindow
          chatHistory={chatHistory}
          chatInput={chatInput}
          setChatInput={setChatInput}
          handleSendMessage={handleSendMessage}
          loading={loadingChat}
        />
      </main>

      <Footer />

      {/* File Modal */}
      {showFileModal && (
        <Modal title="Upload File" onClose={() => setShowFileModal(false)}>
          <div className="bg-black/40 rounded-xl p-6 border border-dashed border-white/20 hover:bg-black/50 transition relative flex flex-col items-center justify-center mb-6">
            <input
              type="file"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files))}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <Upload className="w-10 h-10 text-cyan-400 mb-2" />
            <p className="text-gray-300">Click or drag files to upload</p>
            {files.length > 0 && <div className="text-sm text-gray-300 mt-3">{files.length} file(s) selected</div>}
          </div>
          <button
            onClick={() => handleAddSource("file")}
            className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 rounded-xl font-semibold text-lg flex items-center justify-center gap-2"
            disabled={loadingFile}
          >
            {loadingFile && <Loader className="w-5 h-5 animate-spin" />}
            Add Source
          </button>
        </Modal>
      )}

      {/* Website Modal */}
      {showWebsiteModal && (
        <Modal title="Add Website Link" onClose={() => setShowWebsiteModal(false)}>
          <textarea
            placeholder="Paste website links here..."
            value={websiteLinks}
            onChange={(e) => setWebsiteLinks(e.target.value)}
            className="w-full p-3 rounded bg-black/60 border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-500 h-48 mb-6"
          />
          <button
            onClick={() => handleAddSource("website")}
            className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 rounded-xl font-semibold text-lg flex items-center justify-center gap-2"
            disabled={loadingWebsite}
          >
            {loadingWebsite && <Loader className="w-5 h-5 animate-spin" />}
            Add Source
          </button>
        </Modal>
      )}

      {/* Text Modal */}
      {showTextModal && (
        <Modal title="Paste Text" onClose={() => setShowTextModal(false)}>
          <textarea
            placeholder="Paste any raw text content here..."
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            className="w-full p-3 rounded bg-black/60 border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-500 h-48 mb-6"
          />
          <button
            onClick={() => handleAddSource("text")}
            className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 rounded-xl font-semibold text-lg flex items-center justify-center gap-2"
            disabled={loadingText}
          >
            {loadingText && <Loader className="w-5 h-5 animate-spin" />}
            Add Source
          </button>
        </Modal>
      )}
    </div>
  );
}
