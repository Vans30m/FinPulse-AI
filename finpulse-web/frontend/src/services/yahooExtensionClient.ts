export function yahooRequest<T = any>(
  url: string,
  options: {
    method?: "GET" | "POST";
    headers?: Record<string, string>;
    body?: unknown;
  } = {}
): Promise<T> {
  return new Promise((resolve, reject) => {
    const requestId = crypto.randomUUID();

    const timeout = window.setTimeout(() => {
      window.removeEventListener(
        "message",
        handleResponse
      );

      reject(
        new Error(
          "FinPulse Yahoo Extension did not respond."
        )
      );
    }, 15000);

    function handleResponse(event: MessageEvent) {
      if (event.source !== window) return;

      const message = event.data;

      if (
        message?.source !==
          "FINPULSE_YAHOO_BRIDGE" ||
        message?.requestId !== requestId
      ) {
        return;
      }

      clearTimeout(timeout);

      window.removeEventListener(
        "message",
        handleResponse
      );

      const response = message.response;

      if (!response?.ok) {
        reject(
          new Error(
            response?.error ||
              `Yahoo HTTP ${response?.status}`
          )
        );

        return;
      }

      try {
        resolve(
          typeof response.body === "string"
            ? JSON.parse(response.body)
            : response.body
        );
      } catch {
        reject(
          new Error(
            "Yahoo returned invalid JSON."
          )
        );
      }
    }

    window.addEventListener(
      "message",
      handleResponse
    );

    window.postMessage(
      {
        source: "FINPULSE",
        type: "YAHOO_REQUEST",
        requestId,
        url,
        method: options.method || "GET",
        headers: options.headers || {},
        body: options.body,
      },
      "*"
    );
  });
}