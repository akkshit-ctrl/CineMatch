import { getRoom, updateRoomStatus } from '@/lib/room'

export async function startSwiping(roomId: string) {
  await updateRoomStatus(roomId, 'swiping')
}

export async function goToSpin(roomId: string) {
  await updateRoomStatus(roomId, 'spinning')
}

export async function finishSpin(roomId: string) {
  await updateRoomStatus(roomId, 'result')
}

export async function getRoomWithMovies(roomId: string) {
  return getRoom(roomId)
}
