'use client';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useDemo } from '@/components/provider';
import Image from 'next/image';

export function StudentIdentity() {
  const client = useMemo(() => createClient(), []);
  const { setState } = useDemo();
  const [id, setId] = useState('');
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [record, setRecord] = useState<{
    rating: number;
    wins: number;
    losses: number;
    draws: number;
    best_streak: number;
    best_points: number;
  } | null>(null);
  useEffect(() => {
    void (async () => {
      const {
        data: { user },
      } = await client.auth.getUser();
      if (!user) return;
      setId(user.id);
      const { data, error } = await client
        .from('profiles')
        .select('username,name,avatar_url')
        .eq('user_id', user.id)
        .single();
      if (error) {
        setMessage('Account profile unavailable. Check the accounts migration.');
        return;
      }
      setUsername(data.username ?? '');
      setName(data.name);
      setAvatar(data.avatar_url ?? '');
      const ratings = await client
        .from('player_ratings')
        .select('rating,wins,losses,draws,best_streak,best_points')
        .eq('user_id', user.id)
        .maybeSingle();
      if (ratings.data) setRecord(ratings.data);
    })();
  }, [client]);
  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      if (!/^[a-z0-9_]{3,24}$/.test(username))
        throw Error('Username: 3–24 lowercase letters, numbers or underscores.');
      if (avatar && new URL(avatar).protocol !== 'https:') throw Error('Avatar must use HTTPS.');
      const { error } = await client
        .from('profiles')
        .update({ username, name: name.trim(), avatar_url: avatar || null })
        .eq('user_id', id);
      if (error) throw error;
      setState((s) => ({ ...s, profile: { ...s.profile, name: name.trim() } }));
      setMessage('Identity updated.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : (e as { message: string }).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel setup-panel student-identity">
      <h2>Your student identity</h2>
      <p>User ID: {id || 'Loading…'}</p>
      {avatar && (
        <Image
          src={avatar}
          alt="Your avatar"
          width={56}
          height={56}
          referrerPolicy="no-referrer"
          style={{ borderRadius: '50%', objectFit: 'cover' }}
        />
      )}
      <form onSubmit={save} className="account-auth-form">
        <label>
          Username
          <input
            required
            minLength={3}
            maxLength={24}
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
          />
        </label>
        <label>
          Display name
          <input required maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          Avatar HTTPS URL (optional)
          <input
            type="url"
            maxLength={1000}
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
          />
        </label>
        <button className="button button-primary" disabled={busy || !id}>
          {busy ? 'Saving…' : 'Save identity'}
        </button>
      </form>
      {message && <p role="status">{message}</p>}
      <p>
        {record
          ? `${record.rating} Elo · ${record.wins} wins · ${record.losses} losses · ${record.draws} draws · best streak ${record.best_streak} · best ${record.best_points} points`
          : '1000 starting Elo · No recorded matches yet'}
      </p>
    </section>
  );
}
