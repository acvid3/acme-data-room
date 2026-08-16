export type User = {
    id: string
    email: string
    name: string
    createdAt: string
}

export type RoomUser = {
    id: string
    email: string
    name: string
}

export type RoomVisibility = 'PUBLIC' | 'PRIVATE'

export type DataRoom = {
    id: string
    ownerId: string
    name: string
    description: string | null
    visibility: RoomVisibility
    createdAt: string
    updatedAt: string
    users?: RoomUser[]
    activeUsers?: RoomUser[]
    userCount?: number
}

export type Folder = {
    id: string
    dataRoomId: string
    parentFolderId: string | null
    name: string
    createdAt: string
    updatedAt: string
}

export type FileMeta = {
    id: string
    dataRoomId: string
    folderId: string | null
    name: string
    mimeType: string
    sizeBytes: number
    createdAt: string
    updatedAt: string
}

export type FolderContents = {
    folders: Folder[]
    files: FileMeta[]
    total: number
}

export type ShareableType = 'DATAROOM' | 'FOLDER' | 'FILE'

export type Share = {
    id: string
    shareableType: ShareableType
    shareableId: string
    userId: string
    user?: { id: string; email: string; name: string }
    createdAt: string
}

export type RoomStats = {
    folders: number
    files: number
    sizeBytes: number
}

export type PublicFolderItem = Folder & {
    stats: RoomStats
}

export type PublicFolderContents = {
    folders: PublicFolderItem[]
    files: FileMeta[]
    total: number
}

export type SearchResults = {
    folders: Folder[]
    files: FileMeta[]
    total: number
}

export type PublicLink = {
    id: string
    token: string
    shareableType: ShareableType
    shareableId: string
    url: string
    createdAt: string
}

export type AuthResponse = {
    accessToken: string
    user: User
}

export type AuthChallenge = {
    email: string
    code?: string
    sent: boolean
}

export type DownloadResult = {
    url: string
    name: string
}

export type DeleteFolderResult = {
    deletedFolders: number
    deletedFiles: number
}

export type PublicPayload =
    | {
          type: 'DATAROOM'
          room: { id: string; name: string }
          contents: PublicFolderContents
          stats: RoomStats
          users: RoomUser[]
          activeUsers: RoomUser[]
      }
    | {
          type: 'FOLDER'
          folder: { id: string; name: string }
          roomId: string
          contents: PublicFolderContents
          stats: RoomStats
      }
    | {
          type: 'FILE'
          file: FileMeta
          roomId: string
          url: string
      }
