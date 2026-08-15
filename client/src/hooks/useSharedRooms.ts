import { roomApi } from '@/api'
import { useRooms } from './useRooms'

export function useSharedRooms(pageSize = 25) {
    return useRooms(roomApi.listShared, 'Failed to load shared rooms.', pageSize)
}
