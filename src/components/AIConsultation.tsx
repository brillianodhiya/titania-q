"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { useI18n } from "@/hooks/useI18n";
import {
  MessageCircle,
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export interface ConsultationMessage {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
}

interface AIConsultationProps {
  databaseName: string;
  onSendMessage: (message: string) => Promise<void>;
  messages: ConsultationMessage[];
  isGenerating: boolean;
}

export function AIConsultation({
  databaseName,
  onSendMessage,
  messages,
  isGenerating,
}: AIConsultationProps) {
  const { t } = useI18n();
  const [inputMessage, setInputMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isGenerating) return;

    const message = inputMessage.trim();
    setInputMessage("");
    await onSendMessage(message);
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(timestamp);
  };

  const suggestedQuestions = [
    "Apa saja tabel yang ada di database ini?",
    "Bagaimana struktur relasi antar tabel?",
    "Tabel mana yang paling sering digunakan?",
    "Apakah ada masalah dengan desain database ini?",
    "Bagaimana cara mengoptimalkan query di database ini?",
    "Apakah ada tabel yang tidak terhubung dengan tabel lain?",
  ];

  return (
    <Card className="w-full">
      <CardHeader className="pb-2 px-3 py-2">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          <h3 className="text-sm font-medium">{t("aiConsultation")}</h3>
          <span className="text-xs text-muted-foreground">
            {t("askAbout")} {databaseName}
          </span>
        </div>
      </CardHeader>

      <CardContent className="px-3 pb-3">
        <div className="space-y-4">
          {/* Messages */}
          <div className="h-64 border rounded-lg overflow-y-auto">
            {messages.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm mb-3">{t("askAboutDatabase")}</p>
                <div className="space-y-2">
                  <p className="text-xs font-medium">
                    {t("suggestedQuestions")}
                  </p>
                  <div className="grid grid-cols-1 gap-1">
                    {suggestedQuestions.slice(0, 3).map((question, index) => (
                      <button
                        key={index}
                        onClick={() => setInputMessage(question)}
                        className="text-xs text-left p-2 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.type === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.type === "ai" && (
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="h-3 w-3 text-primary" />
                      </div>
                    )}

                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.type === "user"
                          ? "bg-primary text-primary-foreground ml-auto"
                          : "bg-muted"
                      }`}
                    >
                      <div className="text-sm">
                        {message.type === "ai" ? (
                          <div className="prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-code:text-foreground prose-pre:bg-muted prose-pre:text-foreground prose-blockquote:text-foreground prose-li:text-foreground">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                code: ({
                                  children,
                                  className,
                                  ...props
                                }: any) => {
                                  const isInline =
                                    !className?.includes("language-");
                                  if (isInline) {
                                    return (
                                      <code
                                        className="bg-muted px-1 py-0.5 rounded text-sm font-mono"
                                        {...props}
                                      >
                                        {children}
                                      </code>
                                    );
                                  }
                                  return (
                                    <pre className="bg-muted p-3 rounded-lg overflow-x-auto">
                                      <code className={className} {...props}>
                                        {children}
                                      </code>
                                    </pre>
                                  );
                                },
                                h1: ({ children }) => (
                                  <h1 className="text-lg font-bold mb-2">
                                    {children}
                                  </h1>
                                ),
                                h2: ({ children }) => (
                                  <h2 className="text-base font-semibold mb-2">
                                    {children}
                                  </h2>
                                ),
                                h3: ({ children }) => (
                                  <h3 className="text-sm font-semibold mb-1">
                                    {children}
                                  </h3>
                                ),
                                ul: ({ children }) => (
                                  <ul className="list-disc list-inside mb-2 space-y-1">
                                    {children}
                                  </ul>
                                ),
                                ol: ({ children }) => (
                                  <ol className="list-decimal list-inside mb-2 space-y-1">
                                    {children}
                                  </ol>
                                ),
                                p: ({ children }) => (
                                  <p className="mb-2 last:mb-0">{children}</p>
                                ),
                                blockquote: ({ children }) => (
                                  <blockquote className="border-l-4 border-primary pl-4 italic my-2">
                                    {children}
                                  </blockquote>
                                ),
                                table: ({ children }) => (
                                  <div className="overflow-x-auto my-2">
                                    <table className="min-w-full border border-border rounded-lg">
                                      {children}
                                    </table>
                                  </div>
                                ),
                                thead: ({ children }) => (
                                  <thead className="bg-muted">{children}</thead>
                                ),
                                th: ({ children }) => (
                                  <th className="border border-border px-3 py-2 text-left font-semibold">
                                    {children}
                                  </th>
                                ),
                                td: ({ children }) => (
                                  <td className="border border-border px-3 py-2">
                                    {children}
                                  </td>
                                ),
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <div className="whitespace-pre-wrap">
                            {message.content}
                          </div>
                        )}
                      </div>
                      <div
                        className={`text-xs mt-1 ${
                          message.type === "user"
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        }`}
                      >
                        {formatTimestamp(message.timestamp)}
                      </div>
                    </div>

                    {message.type === "user" && (
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <User className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                ))}

                {isGenerating && (
                  <div className="flex gap-3 justify-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-3 w-3 text-primary" />
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span className="text-sm text-muted-foreground">
                          {t("aiThinking")}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="flex gap-2">
              <Textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={t("askAboutDatabase")}
                className="min-h-[60px] resize-none"
                disabled={isGenerating}
              />
              <Button
                type="submit"
                size="sm"
                disabled={!inputMessage.trim() || isGenerating}
                className="self-end"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Quick suggestions */}
            {messages.length === 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  {t("quickQuestions")}:
                </p>
                <div className="flex flex-wrap gap-1">
                  {suggestedQuestions.slice(0, 4).map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => setInputMessage(question)}
                      className="text-xs h-6 px-2"
                      disabled={isGenerating}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
