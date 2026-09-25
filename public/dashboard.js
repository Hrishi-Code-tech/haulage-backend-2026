document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('haulage.session');
  if (!token) {
    window.location.href = '/login';
    return;
  }

  const userStr = localStorage.getItem('haulage.user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      document.getElementById('user-greeting').textContent = `Hello, ${user.name.split(' ')[0]}`;
    } catch(e) {}
  }

  document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('haulage.session');
    localStorage.removeItem('haulage.user');
    window.location.href = '/login';
  });

  const showResult = (id, data, isError = false) => {
    const box = document.getElementById(id);
    box.style.display = 'block';
    box.textContent = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    box.className = `result-box ${isError ? 'error' : ''}`;
  };

  // Mock UUID for testing
  const mockLoadId = '550e8400-e29b-41d4-a716-446655440000';

  // Optimization
  document.getElementById('btn-optimize').addEventListener('click', async () => {
    const weight = parseInt(document.getElementById('load-weight').value) || 25000;
    try {
      const res = await fetch('/api/internal/optimize-matching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          load: { origin: { latitude: 34.05, longitude: -118.25 }, destination: { latitude: 36.16, longitude: -115.13 }, weight },
          nearby_drivers: [{ latitude: 34.06, longitude: -118.24 }]
        })
      });
      const data = await res.json();
      showResult('optimize-result', data, !res.ok);
    } catch (e) {
      showResult('optimize-result', e.message, true);
    }
  });

  // Media
  const reqMediaUrl = async (type) => {
    try {
      const endpoint = type === 'invoice' ? '/api/media/upload/invoice' : '/api/media/upload/pallet-photo';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          load_id: mockLoadId,
          file_name: `test_${type}.jpg`,
          content_type: 'image/jpeg'
        })
      });
      const data = await res.json();
      showResult('media-result', data, !res.ok);
    } catch (e) {
      showResult('media-result', e.message, true);
    }
  };
  document.getElementById('btn-invoice').addEventListener('click', () => reqMediaUrl('invoice'));
  document.getElementById('btn-pallet').addEventListener('click', () => reqMediaUrl('pallet'));

  // Telemetry
  document.getElementById('btn-telemetry').addEventListener('click', async () => {
    const lat = parseFloat(document.getElementById('lat-input').value) || 34.05;
    const lng = parseFloat(document.getElementById('lng-input').value) || -118.24;
    try {
      const res = await fetch('/api/telemetry/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ load_id: mockLoadId, latitude: lat, longitude: lng })
      });
      const data = await res.json();
      showResult('telemetry-result', data, !res.ok);
    } catch (e) {
      showResult('telemetry-result', e.message, true);
    }
  });

  // Webhook
  document.getElementById('btn-voice').addEventListener('click', async () => {
    try {
      const res = await fetch('/api/webhook/voice-negotiation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          orderId: mockLoadId,
          agreedRate: 1500,
          transcript: "Agent: Hello. Driver: I'll take it for 1500. Agent: Agreed.",
          agentDurationSec: 45
        })
      });
      const data = await res.json();
      showResult('webhook-result', data, !res.ok);
    } catch (e) {
      showResult('webhook-result', e.message, true);
    }
  });
});
