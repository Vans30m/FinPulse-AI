import { useState } from "react";

export default function YahooExtensionTest() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const testYahoo = () => {
    setLoading(true);
    setError("");
    setResult(null);

    const requestId = crypto.randomUUID();

    const timeout = setTimeout(() => {
      window.removeEventListener("message", handleResponse);
      setLoading(false);
      setError(
        "Extension did not respond. Make sure the Chrome extension is installed and enabled."
      );
    }, 15000);

    function handleResponse(event: MessageEvent) {
      if (event.source !== window) return;

      const message = event.data;

      if (
        message?.source !== "FINPULSE_YAHOO_BRIDGE" ||
        message?.requestId !== requestId
      ) {
        return;
      }

      clearTimeout(timeout);
      window.removeEventListener("message", handleResponse);
      setLoading(false);

      if (!message.response?.ok) {
        setError(
          message.response?.error ||
            `Yahoo returned HTTP ${message.response?.status}`
        );
        return;
      }

      try {
        setResult(JSON.parse(message.response.body));
      } catch {
        setResult(message.response.body);
      }
    }

    window.addEventListener("message", handleResponse);

    window.postMessage(
      {
        source: "FINPULSE",
        type: "YAHOO_REQUEST",
        requestId,
        url:
          "https://query1.finance.yahoo.com/v8/finance/chart/RELIANCE.NS?range=1d&interval=1d",
        method: "GET",
      },
      "*"
    );
  };

  return (
    <div style={{ padding: 30 }}>
      <h1>FinPulse Yahoo Extension Test</h1>

      <button
        onClick={testYahoo}
        disabled={loading}
        style={{
          padding: "12px 20px",
          cursor: "pointer",
        }}
      >
        {loading ? "Testing..." : "Test Yahoo Connection"}
      </button>

      {error && (
        <pre style={{ marginTop: 20, color: "red" }}>
          {error}
        </pre>
      )}

      {result && (
        <pre
          style={{
            marginTop: 20,
            padding: 20,
            background: "#111",
            color: "#0f0",
            overflow: "auto",
            maxHeight: 500,
          }}
        >
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}