export async function consumeSseStream(
  response: Response,
  onEvent: (eventName: string, payloadText: string) => void
) {
  if (!response.body) {
    throw new Error("Live response stream is not available in this browser.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() ?? "";

    for (const block of blocks) {
      const lines = block.split("\n").filter(Boolean);
      const eventLine = lines.find((line) => line.startsWith("event: "));
      const dataLines = lines
        .filter((line) => line.startsWith("data: "))
        .map((line) => line.slice(6));

      if (!eventLine || dataLines.length === 0) {
        continue;
      }

      onEvent(eventLine.slice(7), dataLines.join("\n"));
    }
  }
}
