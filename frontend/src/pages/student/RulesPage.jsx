import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const RULES_ACCEPTED_KEY = "piscall_rules_accepted";
export function RulesPage() {
  const navigate = useNavigate();
  const rulesFrameRef = useRef(null);

  useEffect(() => {
    const frame = rulesFrameRef.current;
    if (!frame) return undefined;

    const handleLoad = () => {
      const document = frame.contentDocument;
      const startButton = document?.querySelector("#startBtn");
      if (!startButton) return;

      const handleStart = (event) => {
        if (startButton.classList.contains("is-disabled")) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        sessionStorage.setItem(RULES_ACCEPTED_KEY, "true");
        navigate("/join", { state: { fromRules: true } });
      };

      startButton.addEventListener("click", handleStart, true);
      frame._piscallStartHandler = handleStart;
    };

    frame.addEventListener("load", handleLoad);
    return () => {
      frame.removeEventListener("load", handleLoad);
      const startButton = frame.contentDocument?.querySelector("#startBtn");
      if (startButton && frame._piscallStartHandler) {
        startButton.removeEventListener(
          "click",
          frame._piscallStartHandler,
          true,
        );
      }
    };
  }, [navigate]);

  return (
    <iframe
      ref={rulesFrameRef}
      className="block min-h-screen w-full border-0"
      title="Aturan main Piscall"
      src="/rules.html"
    />
  );
}

export { RULES_ACCEPTED_KEY };
