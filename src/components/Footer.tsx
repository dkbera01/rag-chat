export default function Footer() {
  return (
    <footer className="p-4 text-center text-sm border-t border-white/10">
      © {new Date().getFullYear()} AI Chatbot with RAG • Built with React + Tailwind
    </footer>
  );
}
