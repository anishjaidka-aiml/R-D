'use client';

export default function SlackConnectButton() {
  const handleConnect = () => {
    // Start OAuth flow
    window.location.href = '/api/ucs/slack/start';
  };

  const handleSendTest = async () => {
    try {
      const res = await fetch('/api/ucs/slack/send', {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        alert(
          'Failed to send Slack test message: ' +
            (data.error || res.statusText || res.status)
        );
        console.error('Slack send error', data);
        return;
      }

      alert('Slack test message sent ✅ Check your Slack!');
      console.log('Slack send result:', data);
    } catch (err) {
      console.error('Network error while sending Slack test message', err);
      alert('Network error while sending Slack test message');
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <button
        onClick={handleConnect}
        className="px-4 py-2 rounded-md bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
      >
        Connect Slack
      </button>

      <button
        onClick={handleSendTest}
        className="px-4 py-2 rounded-md border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50"
      >
        Send Slack Test Message
      </button>
    </div>
  );
}
