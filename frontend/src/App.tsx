import React, { useState, useEffect, useRef } from "react";

const App: React.FC = () => {
	const [input, setInput] = useState("");
	const [messages, setMessages] = useState<
		Array<{ role: string; content: string }>
	>([]);
	const [isLoading, setIsLoading] = useState(false);
	const messagesEndRef = useRef<null | HTMLDivElement>(null);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	useEffect(scrollToBottom, [messages]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!input.trim()) return;

		const userMessage = { role: "user", content: input };
		setMessages((prevMessages) => [...prevMessages, userMessage]);
		setInput("");
		setIsLoading(true);

		try {
			const response = await fetch("http://localhost:3001/chat", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ message: input }),
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const reader = response.body?.getReader();
			const decoder = new TextDecoder();

			if (!reader) {
				throw new Error("Failed to get reader from response");
			}

			const assistantMessage = { role: "assistant", content: "" };
			setMessages((prevMessages) => [...prevMessages, assistantMessage]);

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				const chunk = decoder.decode(value);
				assistantMessage.content += chunk;
				setMessages((prevMessages) => [
					...prevMessages.slice(0, -1),
					{ ...assistantMessage },
				]);
			}
		} catch (error) {
			console.error("Error:", error);
			setMessages((prevMessages) => [
				...prevMessages,
				{ role: "assistant", content: "Error: Failed to get response" },
			]);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex justify-center items-center min-h-screen bg-gray-100">
			<div className="w-full max-w-6xl px-4 sm:px-6 lg:px-8">
				<div className="grid grid-cols-12 gap-4">
					{/* 左側のスペース（将来的なサイドバー用） */}
					<div className="hidden lg:block lg:col-span-2"></div>

					{/* チャットウィンドウ */}
					<div className="col-span-12 lg:col-span-8">
						<div className="h-[600px] flex flex-col border border-gray-300 rounded-lg overflow-hidden bg-white shadow-lg">
							<div className="flex-1 overflow-y-auto p-4 space-y-4">
								{messages.map((message, index) => (
									<div
										key={index}
										className={`max-w-[80%] p-3 rounded-lg ${
											message.role === "user"
												? "bg-blue-500 text-white ml-auto"
												: "bg-gray-200 text-gray-800"
										}`}
									>
										{message.content}
									</div>
								))}
								<div ref={messagesEndRef} />
							</div>
							<form
								onSubmit={handleSubmit}
								className="flex p-4 bg-gray-50"
							>
								<input
									type="text"
									value={input}
									onChange={(e) => setInput(e.target.value)}
									placeholder="Type your message..."
									disabled={isLoading}
									className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
								<button
									type="submit"
									disabled={isLoading}
									className="px-4 py-2 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400"
								>
									Send
								</button>
							</form>
						</div>
					</div>

					{/* 右側のスペース（将来的なサイドバー用） */}
					<div className="hidden lg:block lg:col-span-2"></div>
				</div>
			</div>
		</div>
	);
};

export default App;
