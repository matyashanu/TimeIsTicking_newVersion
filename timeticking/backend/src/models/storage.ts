import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'timeticking', 'backend', 'src', 'data', 'db.json');

export function ensureDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    const initial = {
      users: [
        { id: 'user1', username: 'alice', email: 'alice@example.com' },
        { id: 'user2', username: 'bob', email: 'bob@example.com' },
        { id: 'user3', username: 'carol', email: 'carol@example.com' }
      ],
      friendRequests: [],
      friendships: [],
      messages: [],
      focusSessions: []
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
  }
}

export function readDb(): any {
  ensureDb();
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(raw);
}

export function writeDb(obj: any) {
  ensureDb();
  fs.writeFileSync(DB_PATH, JSON.stringify(obj, null, 2));
}
