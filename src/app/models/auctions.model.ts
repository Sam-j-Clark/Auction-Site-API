import { getPool } from "../../config/db";
import Logger from "../../config/logger";
import {Category, AuctionDetails, AuctionListRequest, AuctionOverview, Bid} from "../app_types";
import {rowPacketDataToAuction, rowPaketDataToCategory} from "../middleware/schemaConvserion.middleware";
import {format, ResultSetHeader} from "mysql2";


const getAuctionById = async (auctionId: number): Promise<AuctionDetails> => {
    Logger.info(`Getting auction by id: ${auctionId}`)
    const conn = await getPool().getConnection();
    const query = `SELECT *
                        FROM auction WHERE id = ?`;
    const [ result ] = await conn.query(query, [ auctionId ]);
    conn.release();
    if (result.length === 0)
        return null;
    return await rowPacketDataToAuction(result[0]);
}

const getAuctionsList = async (auctionsParams: AuctionListRequest): Promise<AuctionOverview[]> => {
    Logger.info("Getting a list of auctions");
    const conn = await getPool().getConnection();
    let query = `SELECT q.id as auctionId, title, category_id as categoryId, seller_id as sellerId,
                   u.first_name as sellerFirstName, u.last_name as sellerLastName, reserve, end_date as endDate FROM
                        (SELECT *, title LIKE ? as titleMatches, description LIKE ? as descriptionMatches
                            FROM auction) AS q
                        INNER JOIN user u ON seller_id = u.id
                    WHERE titleMatches OR descriptionMatches
                    ORDER BY ` + auctionsParams.sortBy;
    query = format(query, [auctionsParams.regEx, auctionsParams.regEx]);
    const [ result ] = await conn.query(query);
    conn.release();
    return result;
}


const getHighestBid = async (auctionId: number): Promise<number> => {
    const conn = await getPool().getConnection();
    const query = `SELECT MAX(amount) AS highestBid FROM auction_bid WHERE auction_id = ?`;
    const [ result ] = await conn.query(query, [ auctionId ]);
    conn.release();
    return result[0].highestBid;
}

const getCountOfBids = async (auctionId: number): Promise<number> => {
    const conn = await getPool().getConnection();
    const query = `SELECT COUNT(*) AS numBids FROM auction_bid WHERE auction_id = ?`;
    const [ result ] = await conn.query(query, [ auctionId ]);
    conn.release();
    return result[0].numBids;
}

const deleteAuctionById = async (auctionId: number): Promise<any> => {
    Logger.info(`Deleting auction with id: ${auctionId}`);
    const conn = await getPool().getConnection();
    const query = `DELETE FROM auction WHERE id = ?`;
    const [ result ] = await conn.query(query, [ auctionId ]);
    conn.release();
    return result;
}

const getCategoryById = async (categoryId: number): Promise<Category> => {
    Logger.info(`Getting category by id: ${categoryId}`)
    const conn = await getPool().getConnection();
    const query = `SELECT * FROM category WHERE id = ?`;
    const [ result ] = await conn.query(query, [ categoryId ]);
    conn.release();
    if (result.length === 0)
        return null;
    return (await rowPaketDataToCategory(result[0]))
}

const addAuction = async (auction: AuctionDetails): Promise<ResultSetHeader> => {
    Logger.info(`Adding auction to database`)
    const conn = await getPool().getConnection();
    const query = `INSERT INTO auction (title, description, end_date, reserve, seller_id, category_id) VALUES (?, ?, ?, ?, ?, ?)`;
    const [ result ] = await conn.query(query, [ auction.title, auction.description, auction.endDate, auction.reserve, auction.sellerId ,auction.categoryId]);
    conn.release();
    return (result);
}

const updateAuctionDetails = async (auctionId: number, auction: AuctionDetails): Promise<void> => {
    Logger.info(`Updating auction: ${auctionId}`);
    const conn = await getPool().getConnection();
    const query = `UPDATE auction SET title = ?, description = ?, end_date = ?, reserve = ?, category_id = ?
                    WHERE id = ?`;
    await conn.query(query, [ auction.title, auction.description, auction.endDate, auction.reserve, auction.categoryId, auctionId]);
    conn.release();
    return;
}

const getCategoriesList = async (): Promise<any> => {
    Logger.info(`Getting categories list`);
    const conn = await getPool().getConnection();
    const query = `SELECT id as categoryId, name FROM category ORDER BY categoryId ASC`;
    const [ result ] = await conn.query(query);
    conn.release();
    return result;
}

const auctionHasBidder = async (auctionId: number, bidderId: number): Promise<boolean> => {
    const conn = await getPool().getConnection();
    const query = `SELECT Count(*) as numBids
                    FROM auction_bid
                    WHERE auction_id = ? AND user_id = ? `
    const [result] = await conn.query(query, [auctionId, bidderId]);
    conn.release();
    return result[0].numBids > 0;
}

const getBidsById = async (auctionId: number): Promise<Bid[]> => {
    Logger.info(`Getting bids list for auction: ${auctionId}`);
    const conn = await getPool().getConnection();
    const query = `SELECT bids.user_id as bidderId, amount, first_name as firstName, last_name as lastName, timestamp FROM
                        (SELECT * FROM
                        auction_bid WHERE auction_id = ?) AS bids
                        INNER JOIN user u ON user_id = u.id
                    ORDER BY amount DESC`
    const [result] = await conn.query(query, [auctionId]);
    conn.release();
    return result;
}

const placeBid = async (bidderId: number, auctionId: number, bidAmount: number): Promise<void> => {
    Logger.info(`Adding bid to auction: ${auctionId}`);
    const conn = await getPool().getConnection();
    const query = `INSERT INTO auction_bid (auction_id, user_id, amount) VALUES (?, ?, ?)`
    await conn.query(query, [auctionId, bidderId, bidAmount]);
    conn.release();
    return;
}

const auctionExistsWithTitle = async (title: string, sellerId: number, auctionId: number = 0): Promise<boolean> => {
    Logger.info(`Checking if an auction already has title: ${title}`);
    const conn = await getPool().getConnection();
    const query = `SELECT COUNT(*) as numAuctions FROM auction WHERE title = ? AND seller_id = ? AND id != ?`
    const [ result ] = await conn.query(query, [ title, sellerId, auctionId ]);
    conn.release();
    return result[0].numAuctions > 0;
}

export { getAuctionsList, getCategoryById, addAuction, getAuctionById, getHighestBid,getCountOfBids,
    deleteAuctionById, updateAuctionDetails, getCategoriesList, auctionHasBidder, getBidsById, placeBid, auctionExistsWithTitle}