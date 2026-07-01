/**
 * Sync ルーム · クラウド state（PostgREST + RLS）
 */
import { getSyncClient } from './sync-auth.js';

/**
 * @typedef {Object} SyncRoom
 * @property {string} id
 * @property {string} title
 * @property {string} entitlement
 * @property {string} created_at
 * @property {string | null} [retain_until]
 */

/**
 * @returns {Promise<SyncRoom[]>}
 */
export async function listMyRooms() {
  const { data, error } = await getSyncClient()
    .from('sync_rooms')
    .select('id, title, entitlement, created_at, retain_until')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/**
 * @param {string} title
 */
export async function createRoom(title) {
  const { data: userData, error: userErr } = await getSyncClient().auth.getUser();
  if (userErr) throw userErr;
  const uid = userData.user?.id;
  if (!uid) throw new Error('not_authenticated');

  const { data, error } = await getSyncClient()
    .from('sync_rooms')
    .insert({
      owner_id: uid,
      title: title.trim() || '無題のイベント',
      entitlement: 'trial',
    })
    .select('id, title, entitlement, created_at, retain_until')
    .single();
  if (error) throw error;
  return data;
}

/**
 * @param {string} roomId
 */
export async function deleteRoom(roomId) {
  const { data: userData, error: userErr } = await getSyncClient().auth.getUser();
  if (userErr) throw userErr;
  const uid = userData.user?.id;
  if (!uid) throw new Error('not_authenticated');

  const { data, error } = await getSyncClient()
    .from('sync_rooms')
    .delete()
    .eq('id', roomId)
    .eq('owner_id', uid)
    .select('id');
  if (error) throw error;
  if (!data?.length) {
    throw new Error('room_delete_failed');
  }
}

/**
 * @param {string} roomId
 * @returns {Promise<{ revision: number, payload: object, updated_at: string } | null>}
 */
export async function loadRoomState(roomId) {
  const { data, error } = await getSyncClient()
    .from('sync_room_states')
    .select('revision, payload, updated_at')
    .eq('room_id', roomId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * @param {string} roomId
 * @param {object} payload
 * @param {number} currentRevision
 */
export async function saveRoomState(roomId, payload, currentRevision = 0) {
  const revision = Math.max(1, (currentRevision || 0) + 1);
  const { data, error } = await getSyncClient()
    .from('sync_room_states')
    .upsert(
      {
        room_id: roomId,
        revision,
        payload,
      },
      { onConflict: 'room_id' }
    )
    .select('revision, payload, updated_at')
    .single();
  if (error) throw error;
  return data;
}
