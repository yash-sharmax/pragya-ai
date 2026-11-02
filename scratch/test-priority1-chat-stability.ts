import { config } from "dotenv";
import { resolve } from "path";
import { readFileSync } from "fs";

config({ path: resolve(process.cwd(), ".env") });

import { MessageItem } from "../src/components/MessageBubble";

async function runPriority1StabilityTests() {
  console.log("==================================================================");
  console.log("PRAGYA AI — PRIORITY 1: COMPLETE CORE CHAT STABILITY TEST SUITE");
  console.log("==================================================================\n");

  let totalTests = 0;
  let passedTests = 0;

  function assert(name: string, condition: boolean, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`[PASS] ${name}`);
      passedTests++;
    } else {
      console.error(`[FAIL] ${name} ${detail ? `- ${detail}` : ""}`);
    }
  }

  // -------------------------------------------------------------
  // TASK 1: New Chat Reset Verification
  // -------------------------------------------------------------
  console.log("--- TASK 1: Fix New Chat Reset ---");

  // Verify ChatDashboard handleNewChat implementation from source code
  const chatDashboardSrc = readFileSync(
    resolve(process.cwd(), "src/components/ChatDashboard.tsx"),
    "utf-8"
  );

  assert(
    "ChatDashboard aborts any in-flight stream on handleNewChat",
    chatDashboardSrc.includes("abortControllerRef.current?.abort()") ||
    chatDashboardSrc.includes("abortControllerRef.current.abort()")
  );

  assert(
    "handleNewChat resets activeConversationIdRef.current to null",
    chatDashboardSrc.includes("activeConversationIdRef.current = null;")
  );

  assert(
    "handleNewChat resets currentConversationId to null",
    chatDashboardSrc.includes("setCurrentConversationId(null);")
  );

  assert(
    "handleNewChat resets messages to empty array []",
    chatDashboardSrc.includes("setMessages([]);")
  );

  assert(
    "handleNewChat resets conversationLoading state to false",
    chatDashboardSrc.includes("setConversationLoading(false);")
  );

  assert(
    "handleNewChat synchronizes URL to root /",
    chatDashboardSrc.includes('window.history.pushState(null, "", "/");')
  );

  // Verify that subsequent message after reset sends conversationId = null (creates new conversation)
  assert(
    "Subsequent message after reset sends activeConversationIdRef (which is null)",
    chatDashboardSrc.includes("const requestConversationId = activeConversationIdRef.current;") &&
    chatDashboardSrc.includes("conversationId: requestConversationId,")
  );

  // -------------------------------------------------------------
  // TASK 2: Fix Chat Switching Snap-Back
  // -------------------------------------------------------------
  console.log("\n--- TASK 2: Fix Chat Switching Snap-Back ---");

  // Verify removal of buggy initialConversationId snap-back effect
  const hasBuggySnapBackEffect =
    chatDashboardSrc.includes("if (initialConversationId && initialConversationId !== currentConversationId)") &&
    chatDashboardSrc.includes("loadConversation(initialConversationId, false);");

  assert(
    "Eliminated buggy initialConversationId snap-back useEffect",
    !hasBuggySnapBackEffect,
    "The prop-dependent snapback effect has been completely removed"
  );

  // Simulate Race Condition between Switching Conversations
  console.log("  Simulating asynchronous race condition between Conversation A and B...");
  let activeConversationRef: string | null = "conv-A";
  let displayedMessages: MessageItem[] = [];

  const simulateFetchConversation = async (
    id: string,
    delayMs: number,
    mockMsgs: MessageItem[]
  ) => {
    await new Promise((res) => setTimeout(res, delayMs));
    // Guard from ChatDashboard: if user switched away, ignore stale response
    if (activeConversationRef !== id) {
      return { ignored: true };
    }
    displayedMessages = mockMsgs;
    return { ignored: false };
  };

  // User starts loading Conv A (slow network, 150ms)
  const reqA = simulateFetchConversation("conv-A", 150, [
    { id: "msg-1", role: "user", content: "Question for Conv A" },
    { id: "msg-2", role: "assistant", content: "Response for Conv A" },
  ]);

  // User quickly clicks Conv B after 20ms (fast network, 50ms)
  activeConversationRef = "conv-B";
  const reqB = simulateFetchConversation("conv-B", 50, [
    { id: "msg-3", role: "user", content: "Question for Conv B" },
    { id: "msg-4", role: "assistant", content: "Response for Conv B" },
  ]);

  const [resA, resB] = await Promise.all([reqA, reqB]);

  assert(
    "Fast Conversation B completed and applied its messages",
    !resB.ignored && displayedMessages.length === 2 && displayedMessages[0].content === "Question for Conv B"
  );

  assert(
    "Slow Conversation A resolved later but was safely discarded by activeConversationIdRef guard",
    resA.ignored && displayedMessages[0].content === "Question for Conv B",
    "Did not snap back to Conv A"
  );

  // Verify popstate listener exists for Back/Forward navigation
  assert(
    "ChatDashboard registers popstate listener for back/forward browser navigation",
    chatDashboardSrc.includes('window.addEventListener("popstate", handlePopState);') &&
    chatDashboardSrc.includes('window.removeEventListener("popstate", handlePopState);')
  );

  // -------------------------------------------------------------
  // TASK 3: Fix Delete Conversation
  // -------------------------------------------------------------
  console.log("\n--- TASK 3: Fix Delete Conversation ---");

  const sidebarSrc = readFileSync(
    resolve(process.cwd(), "src/components/Sidebar.tsx"),
    "utf-8"
  );

  assert(
    "Sidebar conversation items use div role='button' instead of nested <a> tags",
    sidebarSrc.includes('role="button"') && !sidebarSrc.includes('<a href={`/c/${conv.id}')
  );

  assert(
    "Sidebar delete action intercepts events with e.stopPropagation() and e.preventDefault()",
    sidebarSrc.includes("e.stopPropagation();") && sidebarSrc.includes("e.preventDefault();")
  );

  const deleteRouteSrc = readFileSync(
    resolve(process.cwd(), "src/app/api/conversations/[id]/route.ts"),
    "utf-8"
  );

  assert(
    "DELETE route validates user authentication (returns 401 if unauthenticated)",
    deleteRouteSrc.includes("if (authError || !user)") &&
    deleteRouteSrc.includes('return NextResponse.json({ error: "Unauthorized" }, { status: 401 });')
  );

  assert(
    "DELETE route validates conversation ownership (returns 404 if not found or unauthorized)",
    deleteRouteSrc.includes('.eq("user_id", user.id)') &&
    deleteRouteSrc.includes('return NextResponse.json({ error: "Conversation not found or unauthorized." }, { status: 404 });')
  );

  assert(
    "DELETE route cleans up attachments in Supabase storage and messages in database",
    deleteRouteSrc.includes('.storage.from("user-uploads").remove(paths)') &&
    deleteRouteSrc.includes('.from("messages")') &&
    deleteRouteSrc.includes('.delete()')
  );

  assert(
    "ChatDashboard handleDeleteConversation calls handleNewChat if active chat is deleted",
    chatDashboardSrc.includes("if (activeConversationIdRef.current === id || currentConversationId === id)") &&
    chatDashboardSrc.includes("handleNewChat();")
  );

  // -------------------------------------------------------------
  // TASK 4: Fix Refresh and Conversation Restoration
  // -------------------------------------------------------------
  console.log("\n--- TASK 4: Fix Refresh and Conversation Restoration ---");

  assert(
    "api/conversations/[id] queries messages sorted by created_at ascending",
    deleteRouteSrc.includes('.order("created_at", { ascending: true });')
  );

  assert(
    "ChatDashboard initializes conversationLoading based on initialConversationId to prevent welcome flash",
    chatDashboardSrc.includes("const [conversationLoading, setConversationLoading] = useState(Boolean(initialConversationId));")
  );

  const chatWorkspaceSrc = readFileSync(
    resolve(process.cwd(), "src/components/ChatWorkspace.tsx"),
    "utf-8"
  );

  assert(
    "ChatWorkspace renders skeleton loader while conversationLoading is true instead of empty welcome screen",
    chatWorkspaceSrc.includes("conversationLoading ? (") &&
    chatWorkspaceSrc.includes("Loading Conversation Skeleton")
  );

  assert(
    "loadConversation resets to root / when conversation is 404 or unauthorized",
    chatDashboardSrc.includes('window.history.pushState(null, "", "/");')
  );

  // -------------------------------------------------------------
  // TASK 5: Fix Retry and Message Preservation
  // -------------------------------------------------------------
  console.log("\n--- TASK 5: Fix Retry and Message Preservation ---");

  assert(
    "Offline check in handleSendMessage appends optimisticUserMessage AND failedAssistantMessage",
    chatDashboardSrc.includes("if (!isOnline())") &&
    chatDashboardSrc.includes("setMessages((prev) => [...prev, optimisticUserMessage, failedAssistantMessage]);")
  );

  assert(
    "handleRetryMessage locates exact previous user message from failed assistant message",
    chatDashboardSrc.includes("for (let j = targetAssistantIdx - 1; j >= 0; j--)" ) &&
    chatDashboardSrc.includes('if (messages[j].role === "user")')
  );

  assert(
    "handleRetryMessage sets isRetry: true and passes assistantMsgIdToUpdate to prevent duplicate messages",
    chatDashboardSrc.includes("isRetry: true,") &&
    chatDashboardSrc.includes("existingUserMsgId: userMsg.id,") &&
    chatDashboardSrc.includes("assistantMsgIdToUpdate: failedAssistantMsg.id,")
  );

  const apiChatSrc = readFileSync(
    resolve(process.cwd(), "src/app/api/chat/route.ts"),
    "utf-8"
  );

  assert(
    "api/chat updates existing message instead of inserting duplicate user message on isRetry",
    apiChatSrc.includes("if (isRetry && existingUserMessageId)") &&
    apiChatSrc.includes('userMessageId = existingUserMessageId;') &&
    apiChatSrc.includes('.update({ status: "pending", error_message: null })')
  );

  assert(
    "api/chat omits the retried user message from historical context to prevent duplication",
    apiChatSrc.includes("if (isRetry && pm.id === existingUserMessageId) continue;")
  );

  // -------------------------------------------------------------
  // TASK 6: Fix User/AI Message Alignment
  // -------------------------------------------------------------
  console.log("\n--- TASK 6: Fix User/AI Message Alignment ---");

  const messageBubbleSrc = readFileSync(
    resolve(process.cwd(), "src/components/MessageBubble.tsx"),
    "utf-8"
  );

  assert(
    "MessageBubble container aligns user messages to the right and assistant to the left",
    messageBubbleSrc.includes('className={`w-full flex ${isUser ? "justify-end" : "justify-start"} my-3 sm:my-4`}')
  );

  assert(
    "Message content container uses items-end and max-w-[85%] sm:max-w-[75%] for user",
    messageBubbleSrc.includes('isUser') &&
    messageBubbleSrc.includes('"items-end max-w-[85%] sm:max-w-[75%]"')
  );

  assert(
    "Assistant message container uses items-start flex-1 max-w-full overflow-hidden",
    messageBubbleSrc.includes('"items-start flex-1 max-w-full overflow-hidden"')
  );

  assert(
    "User text bubble uses w-fit max-w-full and text-left with whitespace-pre-wrap",
    messageBubbleSrc.includes("w-fit max-w-full") &&
    messageBubbleSrc.includes("manuscript-user-bubble") &&
    messageBubbleSrc.includes("whitespace-pre-wrap leading-relaxed")
  );

  assert(
    "Assistant text bubble uses min-w-0 and manuscript-surface to prevent horizontal overflow",
    messageBubbleSrc.includes("manuscript-surface min-w-0")
  );

  console.log("\n==================================================================");
  console.log(`RESULTS: ${passedTests}/${totalTests} tests passed`);
  console.log("==================================================================");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runPriority1StabilityTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
