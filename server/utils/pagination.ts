export const DEFAULT_PAGE_LIMIT = 50;
export const MAX_PAGE_LIMIT = 100;

export interface PageOptions {
    limit?: number;
    offset?: number;
    includeUserCount?: boolean;
}

export interface Page<T> {
    items: T[];
    total: number;
}

export function normalizePage(options: PageOptions): { limit: number; offset: number; includeUserCount: boolean } {
    const limit = Math.min(Math.max(Math.floor(options.limit ?? DEFAULT_PAGE_LIMIT), 1), MAX_PAGE_LIMIT);
    const offset = Math.max(Math.floor(options.offset ?? 0), 0);
    return { limit, offset, includeUserCount: options.includeUserCount ?? false };
}

export function toPage<T>(items: T[], total: number): Page<T> {
    return { items, total };
}
