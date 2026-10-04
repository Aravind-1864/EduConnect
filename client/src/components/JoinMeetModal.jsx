import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api, errorMessage } from '../api/client';
import { Button, Modal } from './ui';

/** Student enters a 6-character meet code shared in their classroom. */
export default function JoinMeetModal({ open, onClose }) {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post('/meets/join', { code });
      toast.success('Joined the class meet');
      navigate(`/live/${data.classId}/${data.sessionId}`);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Join a class meet">
      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="label">Meet code</span>
          <input
            className="input text-center font-mono text-3xl font-bold uppercase tracking-[0.4em]"
            placeholder="K7P3QX"
            maxLength={6}
            autoFocus
            required
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
          />
          <span className="mt-1 block text-xs text-slate-500">6 letters and numbers, shared by your tutor in the classroom chat.</span>
        </label>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={busy} disabled={code.length !== 6}>Join meet</Button>
        </div>
      </form>
    </Modal>
  );
}
