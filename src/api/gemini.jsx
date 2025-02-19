/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Form,
  Detail,
  ActionPanel,
  Action,
  Toast,
  showToast,
  getSelectedText,
  getPreferenceValues,
  Keyboard,
  Icon,
} from "@raycast/api";
import { useState, useEffect, useCallback } from "react";
import Gemini from "gemini-ai";
import fetch from "node-fetch";

// Node.js에서 global fetch 설정
if (!global.fetch) {
  global.fetch = fetch;
}

const DEFAULT_SYSTEM_PROMPT = `
Answer in Korean. I'd like you to become my expert prompt creator, and your goal is to help me create the best prompt for my needs. The prompt you provide should be written from my perspective when I make a request on You. First, I'd like you to ask me a few clarifying questions about what I'm trying to accomplish. Your output should have an INPUT area for me to type in to make it easier for me to write the answers to your questions. Do not print any other prompts and strictly adhere to the format below. When outputting JSON data, do not use code block markings ( ) or language designators (json), but only output in pure JSON format.

Example output formats
{
  "Question": [
    {
      "id": "1",
      "text": "[Subject]",
      "subquestions": [
        {
          "id": "1",
          "text": "[Question]"
        }
      ]
    },
    {
      "id": "2",
      "text": "[Subject]",
      "subquestions": [
        {
          "id": "1",
          "text": "[Question]"
        },
        {
          "id": "2",
          "text": "[Question]"
        }
      ]
    },
    {
      "id": "3",
      "text": "[Subject]",
      "subquestions": [
        {
          "id": "1",
          "text": "[Question]"
        },
        {
          "id": "2",
          "text": "[Question]"
        },
        {
          "id": "3",
          "text": "[Question]"
        }
      ]
    },
    {
      "id": "4",
      "text": "…"
    }
  ],
}
`;

// JSON 응답을 마크다운 형식으로 변환
function formatJsonToMarkdown(jsonString) {
  try {
    // 빈 응답이나 undefined 처리
    if (!jsonString || typeof jsonString !== 'string') {
      return "응답을 기다리는 중...";
    }

    // 완전한 JSON이 아닐 경우 원본 텍스트 반환
    if (!jsonString.trim().endsWith("}")) {
      return jsonString;
    }

    const data = JSON.parse(jsonString);
    
    if (!data || !data.Question || !Array.isArray(data.Question) || data.Question.length === 0) {
      return jsonString;
    }

    let markdown = "";
    
    data.Question.forEach((question) => {
      if (!question || !question.id || !question.text) return;
      
      markdown += `### ${question.id}. ${question.text}\n\n`;
      
      if (question.subquestions && Array.isArray(question.subquestions)) {
        question.subquestions.forEach((subq) => {
          if (!subq || !subq.id || !subq.text) return;
          
          markdown += `### ${question.id}.${subq.id}. ${subq.text}\n`;
          markdown += `답변:\n\n---\n\n`;
        });
      }
    });

    return markdown;
  } catch (error) {
    console.error("JSON 파싱 오류:", error);
    return jsonString || "응답 처리 중 오류가 발생했습니다.";
  }
}

export default function useGemini(props, { context = undefined, allowPaste = false, useSelected = false }) {
  const Pages = {
    Form: 0,
    Detail: 1,
  };
  
  let { query: argQuery } = props.arguments;
  if (!argQuery) argQuery = props.fallbackText ?? "";

  const preferences = getPreferenceValues();
  const [page, setPage] = useState(Pages.Detail);
  const [markdown, setMarkdown] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedState, setSelected] = useState("");
  const [lastQuery, setLastQuery] = useState("");
  const [lastResponse, setLastResponse] = useState("");
  const [answers, setAnswers] = useState({});
  
  const getResponse = useCallback(
    async (query) => {
      try {
        setLastQuery(query);
        setPage(Pages.Detail);
        setIsLoading(true);
        setMarkdown("응답을 기다리는 중...");

        await showToast({
          style: Toast.Style.Animated,
          title: "Waiting for Gemini...",
        });

        if (!preferences.apiKey) {
          throw new Error("API 키가 설정되지 않았습니다. Raycast 환경설정에서 API 키를 설정해주세요.");
        }

        const gemini = new Gemini(preferences.apiKey);
        const chat = gemini.createChat({
          model: preferences.defaultModel || "gemini-2.0-pro-exp-02-05",
          systemInstruction: preferences.systemPrompt || DEFAULT_SYSTEM_PROMPT,
          temperature: 0.7,
          topP: 0.95,
          topK: 64,
          maxOutputTokens: 8192,
          jsonSchema: true
        });

        let responseText = "";
        let lastValidJson = "";
        
        await chat.ask(query, {
          stream: (chunk) => {
            if (!chunk) return;
            
            try {
              responseText += chunk;
              if (responseText.trim().endsWith("}")) {
                lastValidJson = responseText;
                const formatted = formatJsonToMarkdown(lastValidJson);
                setMarkdown(formatted);
              } else {
                setMarkdown(responseText);
              }
            } catch (error) {
              console.error("스트리밍 처리 오류:", error);
              setMarkdown(responseText);
            }
          },
        });

        if (!responseText) {
          throw new Error("Gemini로부터 응답을 받지 못했습니다.");
        }

        await showToast({
          style: Toast.Style.Success,
          title: "응답이 완료되었습니다",
        });
        
        setLastResponse(responseText);
      } catch (error) {
        console.error("Gemini API 오류:", error);
        await showToast({
          style: Toast.Style.Failure,
          title: "오류가 발생했습니다",
          message: error.message,
        });
        setMarkdown(`## 오류가 발생했습니다\n\n${error.message}`);
      } finally {
        setIsLoading(false);
      }
    },
    [preferences]
  );

  useEffect(() => {
    (async () => {
      if (useSelected) {
        try {
          const selected = await getSelectedText();
          setSelected(selected);
          if (selected) {
            await getResponse(selected);
          }
        } catch (error) {
          console.error(error);
        }
      } else {
        if (argQuery === "") {
          setPage(Pages.Form);
        } else {
          await getResponse(argQuery);
        }
      }
    })();
  }, [useSelected]);

  if (page === Pages.Detail) {
    return (
      <Detail
        isLoading={isLoading}
        markdown={markdown}
        actions={
          <ActionPanel>
              {markdown && (
                <Action.CopyToClipboard
                  title="Copy Markdown"
                  content={markdown}
                  shortcut={{ modifiers: ["cmd"], key: "return" }}
                />
              )}
            <Action
              title="New Question"
              onAction={() => setPage(Pages.Form)}
              shortcut={{ modifiers: ["cmd"], key: "n" }}
            />
            {lastResponse && (
              <Action.CopyToClipboard
                title="Copy Response"
                content={lastResponse}
                shortcut={{ modifiers: ["cmd"], key: "c" }}
              />
            )}
          </ActionPanel>
        }
      />
    );
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm
            onSubmit={(values) => {
              setMarkdown("");
              getResponse(values.query);
            }}
          />
          <Action
            icon={Icon.Clipboard}
            title="Append Selected Text"
            onAction={async () => {
              try {
                const selectedText = await getSelectedText();
                // setTextarea((text) => text + selectedText);
              } catch (error) {
                await showToast({
                  title: "Could not get the selected text",
                  style: Toast.Style.Failure,
                });
              }
            }}
            shortcut={{ modifiers: ["ctrl", "shift"], key: "v" }}
          />
        </ActionPanel>
      }
    >
      <Form.TextArea
        title="Prompt"
        id="query"
        value=""
        onChange={(value) => {}}
        placeholder="Ask Gemini a question..."
      />
    </Form>
  );
}