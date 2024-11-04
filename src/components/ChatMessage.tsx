import { Bot, User, Terminal } from "lucide-react";
import { marked } from "marked";
import { markedHighlight } from "marked-highlight";
import { useEffect, useState } from "react";
import type { FC } from "react";
import hljs from "highlight.js";
import type { Message } from "@/types/message";

interface Props {
  message: Message;
  isInitialSystem?: boolean;
}

marked.setOptions({
  gfm: true,
  breaks: true,
  silent: true,
});

marked.use(
  markedHighlight({
    langPrefix: "hljs language-",
    highlight(code, lang, info) {
      // check if info has ext, if so, use that as lang
      lang = info.split(".")[1] || lang;
      //console.log(info);
      //console.log(lang);
      const language = hljs.getLanguage(lang) ? lang : "plaintext";
      return hljs.highlight(code, { language }).value;
    },
  })
);

export const ChatMessage: FC<Props> = ({ message }) => {
  const [parsedContent, setParsedContent] = useState("");

  useEffect(() => {
    const processContent = async () => {
      console.log(message.content);
      try {
        // Transform thinking tags before markdown parsing
        const processedContent = message.content.replace(
          /<thinking>([\s\S]*?)<\/thinking>/g,
          (_, content) =>
            `<details><summary>Thinking</summary>\n\n${content}\n\n</details>`
        );

        // Parse markdown to HTML
        let parsedResult = await marked.parse(processedContent, {
          async: true,
        });
        console.log(parsedResult);

        // Wrap code blocks in details/summary
        parsedResult = parsedResult.replace(
          /<pre><code class="([^"]+)">([\s\S]*?)<\/code><\/pre>/g,
          (_, classes, code) => {
            console.log(code);
            const langtag = (classes.split(" ")[1] || "Code").replace(
              "language-",
              ""
            );
            return `
            <details>
              <summary>${langtag}</summary>
              <pre><code class="${classes}">${code}</code></pre>
            </details>
          `;
          }
        );

        console.log(parsedResult);
        setParsedContent(parsedResult);
      } catch (error) {
        console.error("Error parsing markdown:", error);
        setParsedContent(message.content);
      }
    };

    processContent();
  }, [message.content]);

  // All messages (including system) are displayed in the same style
  return (
    <div
      className={`py-8 ${
        message.role === "assistant"
          ? "bg-accent/50"
          : message.role === "system"
          ? "bg-muted/50"
          : ""
      }`}
    >
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-start space-x-4">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              message.role === "assistant"
                ? "bg-gptme-600 text-white"
                : message.role === "system"
                ? "bg-slate-500 text-white"
                : "bg-blue-600 text-white"
            }`}
          >
            {message.role === "assistant" ? (
              <Bot className="w-5 h-5" />
            ) : message.role === "system" ? (
              <Terminal className="w-5 h-5" />
            ) : (
              <User className="w-5 h-5" />
            )}
          </div>
          <div
            className={`flex-1 chat-message prose prose-sm dark:prose-invert ${
              message.role === "system" ? "text-muted-foreground" : ""
            }`}
            dangerouslySetInnerHTML={{ __html: parsedContent }}
          />
        </div>
      </div>
    </div>
  );
};
