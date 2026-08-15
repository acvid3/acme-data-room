import { roomApi } from '@/api'
import { useRooms } from './useRooms'

export function useDataRooms(pageSize = 25) {
    return useRooms(roomApi.list, 'Failed to load data rooms.', pageSize)
}
