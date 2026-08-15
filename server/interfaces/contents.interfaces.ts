import type { Folder } from './folders.interfaces';
import type { File } from './files.interfaces';

export interface FolderContents {
    folders: Folder[];
    files: File[];
    total: number;
}
