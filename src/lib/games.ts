import { eq, asc, count } from 'drizzle-orm';
import type { Database } from './db';
import { games, categories, publishers } from '../../db/schema';
import type { Game } from '../types/game';

export const DEFAULT_PAGE_SIZE = 6;

export interface PaginatedGamesResult {
    games: Game[];
    page: number;
    pageSize: number;
    totalGames: number;
    totalPages: number;
}

const gameSelection = {
    id: games.id,
    title: games.title,
    description: games.description,
    starRating: games.starRating,
    categoryId: categories.id,
    categoryName: categories.name,
    publisherId: publishers.id,
    publisherName: publishers.name,
};

type GameSelectionRow = {
    id: number;
    title: string;
    description: string;
    starRating: number | null;
    categoryId: number | null;
    categoryName: string | null;
    publisherId: number | null;
    publisherName: string | null;
};

function mapGame(row: GameSelectionRow): Game {
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        starRating: row.starRating,
        category:
            row.categoryId !== null && row.categoryName !== null
                ? { id: row.categoryId, name: row.categoryName }
                : null,
        publisher:
            row.publisherId !== null && row.publisherName !== null
                ? { id: row.publisherId, name: row.publisherName }
                : null,
    };
}

function baseGamesQuery(db: Database) {
    return db
        .select(gameSelection)
        .from(games)
        .leftJoin(categories, eq(games.categoryId, categories.id))
        .leftJoin(publishers, eq(games.publisherId, publishers.id));
}

/** All games ordered by title. */
export async function getAllGames(db: Database): Promise<Game[]> {
    const rows = await baseGamesQuery(db).orderBy(asc(games.title));
    return rows.map(mapGame);
}

/** A page of games ordered by title. */
export async function getGamesPage(
    db: Database,
    page: number = 1,
    pageSize: number = DEFAULT_PAGE_SIZE,
): Promise<PaginatedGamesResult> {
    const normalizedPageSize = Number.isInteger(pageSize) && pageSize > 0 ? pageSize : DEFAULT_PAGE_SIZE;
    const normalizedPage = Number.isInteger(page) && page > 0 ? page : 1;

    const [totalResult] = await db.select({ totalGames: count() }).from(games);
    const totalGames = Number(totalResult?.totalGames ?? 0);
    const totalPages = totalGames === 0 ? 1 : Math.ceil(totalGames / normalizedPageSize);
    const safePage = Math.min(normalizedPage, totalPages);
    const offset = (safePage - 1) * normalizedPageSize;

    const rows = await baseGamesQuery(db)
        .orderBy(asc(games.title))
        .limit(normalizedPageSize)
        .offset(offset);

    return {
        games: rows.map(mapGame),
        page: safePage,
        pageSize: normalizedPageSize,
        totalGames,
        totalPages,
    };
}

/** All game ids ordered by title. */
export async function getAllGameIds(db: Database): Promise<number[]> {
    const rows = await db.select({ id: games.id }).from(games).orderBy(asc(games.title));
    return rows.map((row) => row.id);
}

/** A single game by id, or null when it does not exist. */
export async function getGameById(db: Database, id: number): Promise<Game | null> {
    const row = await baseGamesQuery(db).where(eq(games.id, id)).get();
    return row ? mapGame(row) : null;
}
