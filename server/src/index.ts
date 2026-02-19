import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Room } from './types';

admin.initializeApp();
const db = admin.firestore();

function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export const createRoom = functions.https.onCall(async (data: any) => {
  const roomId = generateRoomId();

  const room: Room = {
    id: roomId,
    adminId: 'temp-admin',
    createdAt: Date.now(),
    status: 'waiting',
    numberOfRounds: 1,
    maxPlayers: 4,
    players: []
  };

  await db.collection('rooms').doc(roomId).set(room);

  return { roomId, success: true };
});

export const joinRoom = functions.https.onCall(async (payload: any) => {
  console.log('roomId from data:', Object.keys(payload.data));
  const { roomId } = payload.data;

  if (!roomId || typeof roomId !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'Room ID is required');
  }

  const roomRef = db.collection('rooms').doc(roomId);
  const roomDoc = await roomRef.get();

  if (!roomDoc.exists) {
    return { success: false, error: 'Room not found' };
  }

  const room = roomDoc.data() as Room;

  if (room.status !== 'waiting') {
    return { success: false, error: 'Room is not accepting players' };
  }

  if (room.players.length >= room.maxPlayers) {
    return { success: false, error: 'Room is full' };
  }

  return { success: true };
});
