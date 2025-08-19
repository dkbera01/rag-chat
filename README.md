# RAG Chat

**Retrieve, Augment, Generate Chatbot Application**

## Overview

RAG Chat is an open-source chatbot application designed to retrieve and process information from various sources, augment its knowledge, and generate human-like responses. The application utilizes a combination of natural language processing (NLP) and machine learning (ML) techniques to provide a conversational interface for users.

## Features

* Multi-source information retrieval: Retrieve information from files (PDF, text), websites, and raw text input.
* Text extraction and processing: Extract text from PDF files, split into chunks, and store embeddings in a Qdrant vector store.
* Knowledge augmentation: Leverage stored information to improve chatbot responses.
* Conversational interface: User-friendly interface for interactive conversations.
* Response generation: Generate human-like responses based on user input and acquired knowledge.

## Technical Details

* Frontend: React + TypeScript
* Backend: Node.js + Express.js
* NLP and ML: OpenAI embeddings, Qdrant vector store
* Database: Qdrant vector store for efficient storage and retrieval

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/dkbera01/rag-chat.git
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Start the application:

```bash
npm start
# or
yarn start
```

4. Open in your web browser:

```
http://localhost:3000
```

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository.
2. Make your changes.
3. Submit a pull request.

## License

RAG Chat is licensed under the MIT License.

## Acknowledgments

* OpenAI – for providing embeddings and API.
* Qdrant – for providing the vector store and API.

## Roadmap

* Improve conversational interface and response generation.
* Integrate additional sources of information (databases, APIs).
* Enhance knowledge augmentation and retrieval mechanisms.

## Contact

For questions, suggestions, or feedback, contact: [dkbera01@gmail.com](mailto:dkbera01@gmail.com)
