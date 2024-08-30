import express from "express";
import cors from "cors";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, AIMessage, BaseMessage } from "langchain/schema";
import { CallbackManager } from "langchain/callbacks";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(
	cors({
		origin: "http://localhost:5173", // Viteのデフォルトポート
		methods: ["POST"],
		allowedHeaders: ["Content-Type"],
	})
);
app.use(express.json());

console.log("Starting server...");
console.log("Gemini API Key: ", process.env.GOOGLE_API_KEY ? "Set" : "Not set");

const geminiModel = new ChatGoogleGenerativeAI({
	modelName: "gemini-1.5-pro",
	maxOutputTokens: 2048,
	temperature: 0,
	apiKey: process.env.GOOGLE_API_KEY,
	streaming: true,
});

console.log("Gemini model initialized");

const messageHistory: BaseMessage[] = [];

app.post("/chat", async (req, res) => {
	console.log("Received chat request");
	const { message } = req.body;

	if (!message) {
		console.log("Error: Message is required");
		return res.status(400).json({ error: "Message is required" });
	}

	console.log("User message:", message);
	messageHistory.push(new HumanMessage(message));

	res.writeHead(200, {
		"Content-Type": "text/plain",
		"Transfer-Encoding": "chunked",
		"Cache-Control": "no-cache",
		Connection: "keep-alive",
	});

	console.log("Selected model: Gemini");

	try {
		console.log("Starting stream");

		const stream = await geminiModel.stream(messageHistory as any, {
			callbacks: [
				{
					handleLLMNewToken(token: string) {
						console.log("Received token:", token);
						res.write(token);
					},
				},
			],
		});

		let assistantMessage = "";

		for await (const chunk of stream) {
			if (chunk.content) {
				assistantMessage += chunk.content;
			}
		}

		console.log("Stream completed");
		console.log("Full assistant message:", assistantMessage);

		messageHistory.push(new AIMessage(assistantMessage));

		res.end();
		console.log("Response sent");
	} catch (error) {
		console.error("Error during streaming:", error);
		res.write("An error occurred during the conversation.");
		res.end();
	}
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
