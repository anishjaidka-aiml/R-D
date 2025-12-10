"use client";

export default function DiscordConnectButton() {
  const handleConnect = () => {
    // Start UCS Discord OAuth flow
    window.location.href = "/api/ucs/discord/start";
  };

  return (
    <button
      onClick={handleConnect}
      className="px-6 py-3 rounded-lg text-sm font-semibold shadow-md bg-indigo-600 text-white hover:bg-indigo-700"
    >
      🕹️ Connect Discord
    </button>
  );
}
